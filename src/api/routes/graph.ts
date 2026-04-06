/**
 * API Routes - Graph
 * 
 * GET /graph - Retorna grafo completo para visualização
 * GET /graph/stats - Estatísticas do grafo
 * GET /graph/connections/:noteId - Conexões de uma nota específica
 */

import { Request, Response } from 'express'
import { db } from '../../core/database'
import { logger } from '../../utils/logger'

/**
 * GET /graph
 * Retorna todos os nós e arestas do grafo
 */
export async function getGraph(req: Request, res: Response) {
  try {
    const database = db.getDb()
    
    // Busca todas as notas (nós principais)
    const notes = database.prepare(`
      SELECT id, title, slug, excerpt, created_at
      FROM notes
      ORDER BY created_at DESC
    `).all()

    // Busca todas as entidades (nós secundários)
    const entities = database.prepare(`
      SELECT id, name, type, mention_count
      FROM entities
      WHERE mention_count >= 2
    `).all()

    // Busca todas as tags (nós terciários)
    const tags = database.prepare(`
      SELECT id, name, usage_count
      FROM tags
      WHERE usage_count >= 2
    `).all()

    // Busca todas as relações (arestas)
    const relations = database.prepare(`
      SELECT 
        r.id,
        r.type,
        r.source_note_id,
        r.target_note_id,
        r.source_entity_id,
        r.target_entity_id,
        r.weight,
        r.confidence
      FROM relations r
      WHERE r.weight >= 0.1
    `).all()

    // Constrói response no formato esperado por bibliotecas de grafo
    const nodes = [
      ...notes.map((n: any) => ({
        id: n.id,
        type: 'note' as const,
        label: n.title,
        metadata: {
          slug: n.slug,
          excerpt: n.excerpt,
          createdAt: n.created_at
        }
      })),
      ...entities.map((e: any) => ({
        id: e.id,
        type: 'entity' as const,
        label: e.name,
        metadata: {
          entityType: e.type,
          mentionCount: e.mention_count
        }
      })),
      ...tags.map((t: any) => ({
        id: t.id,
        type: 'tag' as const,
        label: t.name,
        metadata: {
          usageCount: t.usage_count
        }
      }))
    ]

    const edges = relations.map((r: any) => ({
      source: r.source_note_id || r.source_entity_id,
      target: r.target_note_id || r.target_entity_id,
      type: r.type,
      weight: r.weight || 1.0,
      confidence: r.confidence || 0.8
    }))

    logger.info(`🕸️ Graph returned: ${nodes.length} nodes, ${edges.length} edges`)

    res.json({
      success: true,
      graph: {
        nodes,
        edges
      },
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        notesCount: notes.length,
        entitiesCount: entities.length,
        tagsCount: tags.length
      }
    })

  } catch (error: any) {
    logger.error('Failed to get graph:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * GET /graph/stats
 * Estatísticas detalhadas do grafo
 */
export async function getGraphStats(req: Request, res: Response) {
  try {
    const database = db.getDb()
    
    const stats: any = {}

    // Contagens básicas
    stats.notes = database.prepare('SELECT COUNT(*) as count FROM notes').get().count
    stats.entities = database.prepare('SELECT COUNT(*) as count FROM entities').get().count
    stats.tags = database.prepare('SELECT COUNT(*) as count FROM tags').get().count
    stats.relations = database.prepare('SELECT COUNT(*) as count FROM relations').get().count

    // Tipos de entidades
    stats.entityTypes = database.prepare(`
      SELECT type, COUNT(*) as count
      FROM entities
      GROUP BY type
      ORDER BY count DESC
    `).all()

    // Top tags
    stats.topTags = database.prepare(`
      SELECT name, usage_count
      FROM tags
      ORDER BY usage_count DESC
      LIMIT 10
    `).all()

    // Top notas mais conectadas
    stats.mostConnectedNotes = database.prepare(`
      SELECT n.title, n.slug, COUNT(r.id) as connections
      FROM notes n
      LEFT JOIN relations r ON (r.source_note_id = n.id OR r.target_note_id = n.id)
      GROUP BY n.id
      ORDER BY connections DESC
      LIMIT 10
    `).all()

    // Média de conexões
    const avgConnections = database.prepare(`
      SELECT AVG(connections) as avg
      FROM (
        SELECT COUNT(*) as connections
        FROM relations
        GROUP BY source_note_id
      )
    `).get()
    
    stats.avgConnectionsPerNote = avgConnections?.avg || 0

    res.json({ success: true, stats })

  } catch (error: any) {
    logger.error('Failed to get graph stats:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * GET /graph/connections/:noteId
 * Retorna conexões diretas e indiretas de uma nota
 */
export async function getNoteConnections(req: Request, res: Response) {
  const { noteId } = req.params
  const { depth = 2 } = req.query // Profundidade da busca

  try {
    const database = db.getDb()

    // Busca nota principal
    const note: any = database.prepare(`
      SELECT id, title, slug, content
      FROM notes
      WHERE id = ?
    `).get(noteId)

    if (!note) {
      return res.status(404).json({ error: 'Note not found' })
    }

    // Busca conexões diretas (depth 1)
    const directConnections = database.prepare(`
      SELECT 
        n.id,
        n.title,
        n.slug,
        r.type as relation_type,
        r.weight,
        CASE 
          WHEN r.source_note_id = ? THEN 'outgoing'
          ELSE 'incoming'
        END as direction
      FROM relations r
      JOIN notes n ON (
        (r.source_note_id = ? AND r.target_note_id = n.id) OR
        (r.target_note_id = ? AND r.source_note_id = n.id)
      )
      WHERE (r.source_note_id = ? OR r.target_note_id = ?)
      ORDER BY r.weight DESC
    `).all(noteId, noteId, noteId, noteId, noteId)

    // Busca entidades relacionadas
    const relatedEntities = database.prepare(`
      SELECT e.id, e.name, e.type, e.mention_count
      FROM entities e
      JOIN note_entities ne ON e.id = ne.entity_id
      WHERE ne.note_id = ?
      ORDER BY e.mention_count DESC
    `).all(noteId)

    // Busca tags
    const relatedTags = database.prepare(`
      SELECT t.id, t.name, t.usage_count
      FROM tags t
      JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
    `).all(noteId)

    res.json({
      success: true,
      note: {
        id: note.id,
        title: note.title,
        slug: note.slug
      },
      connections: {
        direct: directConnections,
        entities: relatedEntities,
        tags: relatedTags
      },
      stats: {
        directConnections: directConnections.length,
        relatedEntities: relatedEntities.length,
        relatedTags: relatedTags.length
      }
    })

  } catch (error: any) {
    logger.error('Failed to get note connections:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * GET /graph/path/:noteId1/:noteId2
 * Encontra caminho entre duas notas (se existir)
 */
export async function findPath(req: Request, res: Response) {
  const { noteId1, noteId2 } = req.params

  try {
    const database = db.getDb()

    // Verifica conexão direta
    const directConnection: any = database.prepare(`
      SELECT * FROM relations
      WHERE (source_note_id = ? AND target_note_id = ?)
         OR (source_note_id = ? AND target_note_id = ?)
    `).get(noteId1, noteId2, noteId2, noteId1)

    if (directConnection) {
      return res.json({
        success: true,
        path: {
          type: 'direct',
          length: 1,
          nodes: [noteId1, noteId2],
          relation: directConnection.type
        }
      })
    }

    // Busca caminho indireto (depth 2)
    const indirectPath: any = database.prepare(`
      SELECT 
        n1.id as intermediate_id,
        n1.title as intermediate_title,
        r1.type as relation1_type,
        r2.type as relation2_type
      FROM relations r1
      JOIN relations r2 ON (
        (r1.target_note_id = r2.source_note_id) OR
        (r1.source_note_id = r2.target_note_id)
      )
      JOIN notes n1 ON (
        r1.target_note_id = n1.id OR r1.source_note_id = n1.id
      )
      WHERE (r1.source_note_id = ? OR r1.target_note_id = ?)
        AND (r2.source_note_id = ? OR r2.target_note_id = ?)
      LIMIT 1
    `).get(noteId1, noteId1, noteId2, noteId2)

    if (indirectPath) {
      return res.json({
        success: true,
        path: {
          type: 'indirect',
          length: 2,
          nodes: [noteId1, indirectPath.intermediate_id, noteId2],
          via: indirectPath.intermediate_title,
          relations: [indirectPath.relation1_type, indirectPath.relation2_type]
        }
      })
    }

    res.json({
      success: true,
      path: null,
      message: 'No path found between these notes'
    })

  } catch (error: any) {
    logger.error('Failed to find path:', error)
    res.status(500).json({ error: error.message })
  }
}
