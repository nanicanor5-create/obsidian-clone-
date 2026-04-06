/**
 * Embedding Service - Local-First
 * 
 * Gera embeddings usando modelos locais (Xenova Transformers)
 * Com cache para performance e modo offline
 * Inspirado no conceito de "Semantic Layer" do Knowledge Nexus
 */

import { pipeline, PipelineType } from '@xenova/transformers'
import { getRepository } from 'typeorm'
import { EmbeddingCache, EmbeddingType } from '../../models/EmbeddingCache'
import { logger } from '../../utils/logger'

export interface EmbeddingResult {
  vector: number[]
  dimensions: number
  model: string
  cached: boolean
}

export class EmbeddingService {
  private static instance: EmbeddingService
  private featureExtractor: any = null
  private isInitialized = false
  private readonly MODEL_NAME = 'Xenova/all-MiniLM-L6-v2' // 384 dims, leve
  private readonly CACHE_ENABLED = true

  /**
   * Singleton pattern
   */
  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService()
    }
    return EmbeddingService.instance
  }

  /**
   * Inicializa o modelo de embedding (download na primeira vez)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      logger.info('🤖 Loading embedding model (first time may take a while)...')
      
      this.featureExtractor = await pipeline(
        PipelineType.FeatureExtraction,
        this.MODEL_NAME,
        {
          quantized: true, // Usa versão quantizada (menor)
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              logger.debug(`Loading model: ${Math.round(progress.progress)}%`)
            }
          }
        }
      )

      this.isInitialized = true
      logger.info('✅ Embedding model loaded successfully')
    } catch (error) {
      logger.error('Failed to load embedding model:', error)
      throw error
    }
  }

  /**
   * Gera embedding para um texto
   * Usa cache se disponível
   */
  async generateEmbedding(
    text: string,
    type: EmbeddingType = EmbeddingType.NOTE_CONTENT,
    sourceId?: string
  ): Promise<EmbeddingResult> {
    // Tenta buscar do cache primeiro
    if (this.CACHE_ENABLED && sourceId) {
      const cached = await this.getCachedEmbedding(type, sourceId, text)
      if (cached) {
        logger.debug(`⚡ Cache hit for embedding: ${sourceId}`)
        return {
          vector: cached.vector,
          dimensions: cached.dimensions,
          model: cached.model || this.MODEL_NAME,
          cached: true
        }
      }
    }

    // Garante que o modelo está carregado
    if (!this.isInitialized) {
      await this.initialize()
    }

    // Gera novo embedding
    logger.debug(`Generating embedding for: ${text.substring(0, 50)}...`)
    
    const output = await this.featureExtractor(text, {
      pooling: 'mean',
      normalize: true
    })

    const vector = Array.from(output.data as Float32Array)
    
    // Salva no cache
    if (this.CACHE_ENABLED && sourceId) {
      await this.cacheEmbedding({
        type,
        sourceId,
        originalText: text,
        vector,
        dimensions: vector.length,
        model: this.MODEL_NAME
      })
    }

    return {
      vector,
      dimensions: vector.length,
      model: this.MODEL_NAME,
      cached: false
    }
  }

  /**
   * Gera embeddings em batch
   */
  async generateBatch(
    texts: string[],
    type: EmbeddingType = EmbeddingType.NOTE_CONTENT
  ): Promise<EmbeddingResult[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    logger.debug(`Generating batch embeddings: ${texts.length} texts`)

    const results: EmbeddingResult[] = []
    
    // Processa em batches menores para evitar OOM
    const batchSize = 16
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      
      const output = await this.featureExtractor(batch, {
        pooling: 'mean',
        normalize: true,
        chunk: true // Processa em chunks
      })

      // Extrai vetores do output
      const vectors = this.extractVectors(output, batch.length)
      
      for (let j = 0; j < vectors.length; j++) {
        results.push({
          vector: vectors[j],
          dimensions: vectors[j].length,
          model: this.MODEL_NAME,
          cached: false
        })
      }
    }

    return results
  }

  /**
   * Extrai vetores do output do transformer
   */
  private extractVectors(output: any, count: number): number[][] {
    const data = output.data as Float32Array
    const dims = output.dims[output.dims.length - 1]
    const vectors: number[][] = []

    for (let i = 0; i < count; i++) {
      const start = i * dims
      const vector = Array.from(data.slice(start, start + dims))
      vectors.push(vector)
    }

    return vectors
  }

  /**
   * Busca embedding no cache
   */
  private async getCachedEmbedding(
    type: EmbeddingType,
    sourceId: string,
    text: string
  ): Promise<EmbeddingCache | null> {
    try {
      const repo = getRepository(EmbeddingCache)
      const cached = await repo.findOne({
        where: { type, sourceId }
      })

      if (cached && cached.matches(text)) {
        cached.touch()
        await repo.save(cached)
        return cached
      }

      return null
    } catch (error) {
      logger.debug('Cache miss or error:', error)
      return null
    }
  }

  /**
   * Salva embedding no cache
   */
  private async cacheEmbedding(data: Partial<EmbeddingCache>): Promise<void> {
    try {
      const repo = getRepository(EmbeddingCache)
      const embedding = repo.create({
        ...data,
        lastAccessedAt: new Date()
      })
      await repo.save(embedding)
    } catch (error) {
      logger.warn('Failed to cache embedding:', error)
    }
  }

  /**
   * Calcula similaridade entre dois vetores
   */
  calculateSimilarity(vec1: number[], vec2: number[]): number {
    return EmbeddingCache.cosineSimilarity(vec1, vec2)
  }

  /**
   * Encontra os N embeddings mais similares
   */
  async findSimilar(
    queryVector: number[],
    type: EmbeddingType,
    limit: number = 10
  ): Promise<Array<{ sourceId: string; similarity: number }>> {
    try {
      const repo = getRepository(EmbeddingCache)
      const embeddings = await repo.find({
        where: { type },
        select: ['sourceId', 'vector']
      })

      const results = embeddings.map(embed => ({
        sourceId: embed.sourceId,
        similarity: this.calculateSimilarity(queryVector, embed.vector)
      }))

      // Ordena por similaridade e retorna top N
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
    } catch (error) {
      logger.error('Failed to find similar embeddings:', error)
      return []
    }
  }

  /**
   * Limpa cache antigo (LRU)
   */
  async clearOldCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const repo = getRepository(EmbeddingCache)
      const cutoff = new Date(Date.now() - maxAge)
      
      const oldEmbeddings = await repo.find({
        where: { createdAt: { before: cutoff } },
        order: { accessCount: 'ASC' } // Remove menos acessados primeiro
      })

      if (oldEmbeddings.length > 0) {
        await repo.remove(oldEmbeddings)
        logger.info(`🧹 Cleared ${oldEmbeddings.length} old embeddings from cache`)
      }

      return oldEmbeddings.length
    } catch (error) {
      logger.error('Failed to clear cache:', error)
      return 0
    }
  }
}

// Export singleton
export const embeddingService = EmbeddingService.getInstance()
