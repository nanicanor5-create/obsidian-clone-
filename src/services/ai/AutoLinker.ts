/**
 * AutoLinker - Sugestão Inteligente de Links
 * 
 * Descobre conexões entre notas baseado em:
 * 1. Similaridade de texto (TF-IDF simplificado)
 * 2. Entidades compartilhadas
 * 3. Tags em comum
 * 
 * 100% local, zero dependências externas
 */

import { logger } from '../../utils/logger'

export interface LinkSuggestion {
  sourceNoteId: string
  targetNoteId: string
  targetTitle: string
  confidence: number
  reason: string
  score: number
}

interface NoteData {
  id: string
  title: string
  content: string
  tags: string[]
  entities: string[]
}

export class AutoLinker {
  private static instance: AutoLinker
  
  // Stopwords em português/inglês para filtrar palavras vazias
  private stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'o', 'a', 'os', 'as', 'um', 'uma', 'e', 'ou', 'mas', 'em', 'no', 'na',
    'de', 'da', 'do', 'das', 'dos', 'para', 'por', 'com', 'ser', 'foi', 'são'
  ])

  static getInstance(): AutoLinker {
    if (!AutoLinker.instance) {
      AutoLinker.instance = new AutoLinker()
    }
    return AutoLinker.instance
  }

  /**
   * Encontra links sugeridos para uma nota
   * Compara com todas as outras notas do sistema
   */
  async findSuggestions(
    currentNote: NoteData,
    allNotes: NoteData[],
    maxSuggestions: number = 5
  ): Promise<LinkSuggestion[]> {
    logger.debug(`🔗 Finding link suggestions for: ${currentNote.title}`)

    const suggestions: LinkSuggestion[] = []

    for (const otherNote of allNotes) {
      // Ignora a própria nota
      if (otherNote.id === currentNote.id) continue

      // Calcula score de similaridade
      const score = this.calculateSimilarity(currentNote, otherNote)
      
      // Só sugere se score > threshold
      if (score.score >= 0.15) {
        suggestions.push({
          sourceNoteId: currentNote.id,
          targetNoteId: otherNote.id,
          targetTitle: otherNote.title,
          confidence: Math.min(score.score / 0.5, 0.95), // Normaliza 0-0.95
          score: score.score,
          reason: this.generateReason(score)
        })
      }
    }

    // Ordena por score e retorna top N
    suggestions.sort((a, b) => b.score - a.score)
    
    const top = suggestions.slice(0, maxSuggestions)
    logger.info(`💡 Found ${top.length} link suggestions`)
    
    return top
  }

  /**
   * Calcula similaridade entre duas notas
   * Combina múltiplos fatores
   */
  private calculateSimilarity(note1: NoteData, note2: NoteData): {
    score: number
    details: {
      textSimilarity: number
      entityOverlap: number
      tagOverlap: number
    }
  } {
    // 1. Similaridade de texto (palavras-chave)
    const textSim = this.textSimilarity(note1.content, note2.content)
    
    // 2. Overlap de entidades
    const entitySim = this.jaccardSimilarity(
      new Set(note1.entities.map(e => e.toLowerCase())),
      new Set(note2.entities.map(e => e.toLowerCase()))
    )
    
    // 3. Overlap de tags
    const tagSim = this.jaccardSimilarity(
      new Set(note1.tags.map(t => t.toLowerCase())),
      new Set(note2.tags.map(t => t.toLowerCase()))
    )

    // Ponderação: texto 50%, entidades 30%, tags 20%
    const totalScore = (textSim * 0.5) + (entitySim * 0.3) + (tagSim * 0.2)

    return {
      score: totalScore,
      details: {
        textSimilarity: textSim,
        entityOverlap: entitySim,
        tagOverlap: tagSim
      }
    }
  }

  /**
   * Similaridade de texto baseada em TF (term frequency)
   * Simplificado para performance (sem IDF para não precisar de corpus completo)
   */
  private textSimilarity(text1: string, text2: string): number {
    const words1 = this.extractKeywords(text1)
    const words2 = this.extractKeywords(text2)

    const set1 = new Set(words1)
    const set2 = new Set(words2)

    return this.jaccardSimilarity(set1, set2)
  }

  /**
   * Extrai palavras-chave de um texto
   * Remove stopwords, pontuação, palavras curtas
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove pontuação
      .split(/\s+/)
      .filter(word => {
        // Filtra: tamanho 3-30 chars, não é stopword, não é número
        return word.length >= 3 && 
               word.length <= 30 && 
               !this.stopwords.has(word) &&
               !/^\d+$/.test(word)
      })
      .slice(0, 100) // Limita para performance
  }

  /**
   * Similaridade Jaccard (interseção / união)
   * Perfeito para sets de palavras/tags/entidades
   */
  private jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    if (set1.size === 0 || set2.size === 0) return 0

    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return intersection.size / union.size
  }

  /**
   * Gera explicação humana para o link sugerido
   */
  private generateReason(details: {
    textSimilarity: number
    entityOverlap: number
    tagOverlap: number
  }): string {
    const reasons: string[] = []

    if (details.entityOverlap > 0.3) {
      reasons.push('entidades em comum')
    }

    if (details.tagOverlap > 0.5) {
      reasons.push('tags similares')
    }

    if (details.textSimilarity > 0.2) {
      reasons.push('conteúdo relacionado')
    }

    if (reasons.length === 0) {
      return 'similaridade geral'
    }

    return reasons.join(', ')
  }

  /**
   * Extrai links [[wikilink]] do conteúdo
   * Para verificar links já existentes
   */
  extractExistingLinks(content: string): string[] {
    const matches = content.match(/\[\[([^\]]+)\]\]/g)
    return matches ? matches.map(m => m.replace(/[[\]]/g, '')) : []
  }

  /**
   * Filtra sugestões que já existem como links
   */
  filterExisting(
    suggestions: LinkSuggestion[],
    existingLinks: string[],
    notesMap: Map<string, string> // id -> title
  ): LinkSuggestion[] {
    return suggestions.filter(suggestion => {
      const targetTitle = notesMap.get(suggestion.targetNoteId)?.toLowerCase()
      return !existingLinks.some(link => link.toLowerCase() === targetTitle)
    })
  }
}

// Export singleton
export const autoLinker = AutoLinker.getInstance()
