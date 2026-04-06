/**
 * Entity Extractor - Híbrido (Regex Local + Gemini Cloud)
 * 
 * Extrai entidades (pessoas, organizações, tópicos) de notas
 * Estratégia: Regex para padrões simples, Gemini para contexto complexo
 */

import { execSync } from 'child_process'
import { logger } from '../../utils/logger'

export interface ExtractedEntity {
  name: string
  type: EntityType
  confidence: number
  description?: string
  mentions: number
}

export type EntityType = 
  | 'PERSON'
  | 'ORGANIZATION'
  | 'LOCATION'
  | 'TOPIC'
  | 'EVENT'
  | 'CONCEPT'

export class EntityExtractor {
  private static instance: EntityExtractor
  
  // Padrões regex para extração local rápida (zero IA)
  private patterns = {
    PERSON: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
    ORGANIZATION: /\b([A-Z][A-Za-z]+(?:\s+(?:Inc|Ltd|LLC|Corp|Company|University))?)\b/g,
    LOCATION: /\b([A-Z][a-z]+(?:\s+(?:City|Town|State|Country|River|Mount)))?\b/g,
    TOPIC: /#(\w[-\w]*)/g,
    WIKILINK: /\[\[([^\]]+)\]\]/g
  }

  static getInstance(): EntityExtractor {
    if (!EntityExtractor.instance) {
      EntityExtractor.instance = new EntityExtractor()
    }
    return EntityExtractor.instance
  }

  /**
   * Extrai entidades usando abordagem híbrida
   * - Texto curto (<500 palavras): apenas regex local
   * - Texto longo: Gemini CLI para contexto
   */
  async extract(content: string, useCloud: boolean = false): Promise<ExtractedEntity[]> {
    const wordCount = content.split(/\s+/).length
    
    // Decide estratégia baseada no tamanho
    if (!useCloud && wordCount < 500) {
      logger.debug('🔍 Using local regex extraction (fast)')
      return this.extractLocal(content)
    } else {
      logger.debug('☁️ Using Gemini CLI for complex extraction')
      return this.extractWithGemini(content)
    }
  }

  /**
   * Extração local com regex (super rápido, ~1ms)
   */
  private extractLocal(content: string): ExtractedEntity[] {
    const entities: Map<string, ExtractedEntity> = new Map()

    // Extrai wikilinks [[Entity]] - alta confiança
    const wikilinks = content.matchAll(this.patterns.WIKILINK)
    for (const match of wikilinks) {
      const name = match[1].trim()
      if (name.length > 1 && name.length < 100) {
        entities.set(name.toLowerCase(), {
          name,
          type: 'TOPIC',
          confidence: 0.95,
          mentions: (entities.get(name.toLowerCase())?.mentions || 0) + 1
        })
      }
    }

    // Extrai hashtags #topic
    const hashtags = content.matchAll(this.patterns.TOPIC)
    for (const match of hashtags) {
      const name = match[1]
      if (name.length > 1 && name.length < 50) {
        const key = `tag_${name.toLowerCase()}`
        entities.set(key, {
          name: `#${name}`,
          type: 'TOPIC',
          confidence: 0.9,
          mentions: (entities.get(key)?.mentions || 0) + 1
        })
      }
    }

    // Extrai possíveis pessoas (padrão Nome Sobrenome)
    const persons = content.matchAll(this.patterns.PERSON)
    const personCounts: Map<string, number> = new Map()
    
    for (const match of persons) {
      const name = match[1].trim()
      // Filtra falsos positivos
      if (this.isValidPersonName(name)) {
        personCounts.set(name, (personCounts.get(name) || 0) + 1)
      }
    }

    // Adiciona pessoas com múltiplas menções (mais confiança)
    personCounts.forEach((count, name) => {
      if (count >= 2) { // Pelo menos 2 menções
        entities.set(`person_${name.toLowerCase()}`, {
          name,
          type: 'PERSON',
          confidence: Math.min(0.7 + (count * 0.1), 0.95),
          mentions: count
        })
      }
    })

    const result = Array.from(entities.values())
    logger.debug(`📊 Extracted ${result.length} entities locally`)
    
    return result
  }

  /**
   * Extração com Gemini CLI (mais precisa, ~1-2s)
   */
  private extractWithGemini(content: string): ExtractedEntity[] {
    try {
      // Prepara prompt otimizado
      const prompt = `
Analyze this text and extract key entities. Return ONLY valid JSON array:
[{"name": "Entity Name", "type": "PERSON|ORGANIZATION|LOCATION|TOPIC|CONCEPT", "confidence": 0.8}]

Rules:
- Only include entities mentioned 2+ times
- Be specific, avoid generic terms
- Confidence: 0.6-0.95 based on context clarity

Text (first 3000 chars):
${content.substring(0, 3000)}
`.trim()

      // Chama Gemini CLI
      const result = execSync(`echo "${this.escapeShell(prompt)}" | gemini`, {
        encoding: 'utf-8',
        timeout: 10000 // 10s timeout
      })

      // Parse do JSON response
      const entities = JSON.parse(result.trim()) as ExtractedEntity[]
      
      logger.info(`☁️ Gemini extracted ${entities.length} entities`)
      
      return entities.map(e => ({
        ...e,
        confidence: Math.min(Math.max(e.confidence, 0.6), 0.95)
      }))
    } catch (error) {
      logger.warn('Gemini extraction failed, falling back to local:', error)
      return this.extractLocal(content)
    }
  }

  /**
   * Valida se é um nome de pessoa plausível
   */
  private isValidPersonName(name: string): boolean {
    const words = name.split(/\s+/)
    
    // Deve ter 2-4 palavras
    if (words.length < 2 || words.length > 4) return false
    
    // Cada palavra deve ter 2-20 caracteres
    for (const word of words) {
      if (word.length < 2 || word.length > 20) return false
    }

    // Evita palavras comuns em maiúsculo
    const commonWords = ['The', 'This', 'That', 'What', 'When', 'Where', 'Why', 'How']
    if (commonWords.includes(words[0])) return false

    return true
  }

  /**
   * Escapa string para shell
   */
  private escapeShell(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n')
  }

  /**
   * Agrupa entidades similares (deduplicação)
   */
  deduplicate(entities: ExtractedEntity[]): ExtractedEntity[] {
    const grouped: Map<string, ExtractedEntity> = new Map()

    for (const entity of entities) {
      const key = `${entity.type}_${entity.name.toLowerCase()}`
      
      if (grouped.has(key)) {
        const existing = grouped.get(key)!
        existing.mentions += entity.mentions
        existing.confidence = Math.max(existing.confidence, entity.confidence)
      } else {
        grouped.set(key, { ...entity })
      }
    }

    return Array.from(grouped.values())
  }
}

// Export singleton
export const entityExtractor = EntityExtractor.getInstance()
