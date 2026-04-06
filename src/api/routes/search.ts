/**
 * API Routes - Search
 * 
 * GET /search?q=... - Busca full-text + semântica
 * GET /search/similar/:noteId - Notas similares
 */

import { Request, Response } from 'express'
import { db } from '../../core/database'
import { logger } from '../../utils/logger'

/**
 * GET /search
 * Busca híbrida: full-text + filtro por tipo
 */
export async function searchNotes(req: Request, res: Response) {
  const { q, type = 'all', limit = 20 } = req.query

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required' })
  }

  try {
    const database = db.getDb()
    const searchTerm = `%${q.toLowerCase()}%`

    let results: any[] = []

    // Busca em títulos e conteúdo (full-text simples)
    const notes = database.prepare(`
      SELECT 
        n.id,
        n.title,
        n.slug,
        n.excerpt,
        n.created_at,
        'note' as type,
        1.0 as relevance
      FROM notes n
      WHERE LOWER(n.title) LIKE ? OR LOWER(n.content) LIKE ?
      ORDER BY n.created_at DESC
      LIMIT ?
    `).all(searchTerm, searchTerm, Number(limit))

    results.push(...notes)

    // Busca em entidades
    if (type === 'all' || type === 'entities') {
      const entities = database.prepare(`
        SELECT 
          e.id,
          e.name as title,
          e.type as slug,
          e.description as excerpt,
          e.created_at,
          'entity' as type,
          0.8 as relevance
        FROM entities e
        WHERE LOWER(e.name) LIKE ?
        ORDER BY e.mention_count DESC
        LIMIT ?
      `).all(searchTerm, Number(limit))

      results.push(...entities)
    }

    // Busca em tags
    if (type === 'all' || type === 'tags') {
      const tags = database.prepare(`
        SELECT 
          t.id,
          t.name as title,
          'tag' as slug,
          NULL as excerpt,
          t.created_at,
          'tag' as type,
          0.6 as relevance
        FROM tags t
        WHERE LOWER(t.name) LIKE ?
        ORDER BY t.usage_count DESC
        LIMIT ?
      `).all(searchTerm, Number(limit))

      results.push(...tags)
    }

    // Ordena por relevância e tipo
    results.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Limita resultados totais
    results = results.slice(0, Number(limit))

    logger.info(`🔍 Search "${q}": found ${results.length} results`)

    res.json({
      success: true,
      query: q,
      results,
      count: results.length
    })

  } catch (error: any) {
    logger.error('Search failed:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * GET /search/similar/:noteId
 * Encontra notas semanticamente similares
 * Usa AutoLinker para similaridade baseada em conteúdo
 */
export async function findSimilarNotes(req: Request, res: Response) {
  const { noteId } = req.params
  const { limit = 10 } = req.query

  try {
    const database = db.getDb()

    // Busca nota original
    const note: any = database.prepare(`
      SELECT id, title, content
      FROM notes
      WHERE id = ?
    `).get(noteId)

    if (!note) {
      return res.status(404).json({ error: 'Note not found' })
    }

    // Busca todas as outras notas
    const allNotes: any[] = database.prepare(`
      SELECT id, title, content
      FROM notes
      WHERE id != ?
    `).all(noteId)

    // Calcula similaridade (mesma lógica do AutoLinker)
    const keywords1 = extractKeywords(note.content)
    const set1 = new Set(keywords1)

    const similarities = allNotes.map(other => {
      const keywords2 = extractKeywords(other.content)
      const set2 = new Set(keywords2)

      const intersection = new Set([...set1].filter(x => set2.has(x)))
      const union = new Set([...set1, ...set2])

      const similarity = union.size > 0 ? intersection.size / union.size : 0

      return {
        id: other.id,
        title: other.title,
        similarity,
        commonKeywords: Array.from(intersection).slice(0, 10)
      }
    })

    // Ordena e filtra
    similarities
      .filter(s => s.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, Number(limit))

    logger.info(`🔍 Found ${similarities.length} similar notes for: ${note.title}`)

    res.json({
      success: true,
      note: {
        id: note.id,
        title: note.title
      },
      similarNotes: similarities,
      count: similarities.length
    })

  } catch (error: any) {
    logger.error('Failed to find similar notes:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * GET /search/tags
 * Lista todas as tags com contagem
 */
export async function listTags(req: Request, res: Response) {
  try {
    const database = db.getDb()

    const tags = database.prepare(`
      SELECT name, usage_count
      FROM tags
      ORDER BY usage_count DESC
    `).all()

    res.json({
      success: true,
      tags,
      count: tags.length
    })

  } catch (error: any) {
    logger.error('Failed to list tags:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * GET /search/entities
 * Lista entidades por tipo
 */
export async function listEntities(req: Request, res: Response) {
  const { type } = req.query

  try {
    const database = db.getDb()

    let query = `
      SELECT name, type, mention_count, description
      FROM entities
    `

    const params: any[] = []

    if (type) {
      query += ' WHERE type = ?'
      params.push(type)
    }

    query += ' ORDER BY mention_count DESC LIMIT 50'

    const entities = database.prepare(query).all(...params)

    res.json({
      success: true,
      entities,
      count: entities.length
    })

  } catch (error: any) {
    logger.error('Failed to list entities:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Extrai palavras-chave de um texto (mesma lógica do AutoLinker)
 */
function extractKeywords(text: string): string[] {
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'o', 'a', 'os', 'as', 'um', 'uma', 'e', 'ou', 'mas', 'em', 'no', 'na',
    'de', 'da', 'do', 'das', 'dos', 'para', 'por', 'com', 'ser', 'foi', 'são'
  ])

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => {
      return word.length >= 3 && 
             word.length <= 30 && 
             !stopwords.has(word) &&
             !/^\d+$/.test(word)
    })
    .slice(0, 100)
}
