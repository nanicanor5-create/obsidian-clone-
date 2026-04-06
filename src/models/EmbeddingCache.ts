/**
 * Embedding Cache Entity
 * 
 * Armazena embeddings gerados para reutilização (cache local)
 * Essencial para performance no modo offline
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

export enum EmbeddingType {
  NOTE_CONTENT = 'note_content',
  NOTE_TITLE = 'note_title',
  ENTITY_NAME = 'entity_name',
  QUERY = 'query'
}

@Entity('embeddings')
@Index(['type', 'sourceId'])
export class EmbeddingCache {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    type: 'enum',
    enum: EmbeddingType
  })
  type!: EmbeddingType

  @Column()
  sourceId!: string // ID da nota, entidade, etc.

  @Column('text')
  originalText!: string // Texto original que gerou o embedding

  @Column('simple-json')
  vector!: number[] // O embedding em si (array de floats)

  @Column({ default: 384 })
  dimensions!: number // Dimensões do embedding

  @Column({ nullable: true })
  model?: string // Modelo usado para gerar o embedding

  @Column({ default: 0 })
  accessCount!: number // Quantas vezes foi acessado (para LRU cache)

  @Column({ nullable: true })
  lastAccessedAt?: Date

  @CreateDateColumn()
  createdAt!: Date

  /**
   * Atualiza contagem de acesso e timestamp
   */
  touch(): void {
    this.accessCount++
    this.lastAccessedAt = new Date()
  }

  /**
   * Calcula similaridade de cosseno com outro embedding
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimensions')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    if (normA === 0 || normB === 0) return 0

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Verifica se o texto é igual (para cache hit)
   */
  matches(text: string): boolean {
    return this.originalText === text
  }
}
