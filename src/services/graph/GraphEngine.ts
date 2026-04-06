/**
 * Graph Engine - SQLite-based
 * 
 * Constrói e gerencia o grafo de conhecimento usando SQLite/TypeORM
 * Alternativa leve ao Neo4j do Knowledge Nexus para modo local-first
 */

import { getRepository, In } from 'typeorm'
import { Note, ConceptEntity, Relation, Tag } from '../models'
import { RelationType } from '../models/Relation'
import { logger } from '../../utils/logger'

export interface GraphNode {
  id: string
  type: 'note' | 'entity' | 'tag'
  label: string
  metadata?: Record<string, any>
}

export interface GraphEdge {
  source: string
  target: string
  type: RelationType
  weight?: number
  metadata?: Record<string, any>
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export class GraphEngine {
  private static instance: GraphEngine

  static getInstance(): GraphEngine {
    if (!GraphEngine.instance) {
      GraphEngine.instance = new GraphEngine()
    }
    return GraphEngine.instance
  }

  /**
   * Constrói grafo completo do banco de dados
   */
  async buildGraph(): Promise<GraphData> {
    logger.info('🕸️ Building knowledge graph...')

    const notes = await getRepository(Note).find({
      relations: ['tags', 'entities']
    })
    
    const entities = await getRepository(ConceptEntity).find()
    const tags = await getRepository(Tag).find()
    const relations = await getRepository(Relation).find({
      relations: ['sourceNote', 'targetNote', 'sourceEntity', 'targetEntity']
    })

    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    // Adiciona notas como nós
    for (const note of notes) {
      nodes.push({
        id: note.id,
        type: 'note',
        label: note.title,
        metadata: {
          slug: note.slug,
          excerpt: note.excerpt,
          createdAt: note.createdAt,
          tags: note.tags.map(t => t.name)
        }
      })
    }

    // Adiciona entidades como nós
    for (const entity of entities) {
      nodes.push({
        id: entity.id,
        type: 'entity',
        label: entity.name,
        metadata: {
          entityType: entity.type,
          description: entity.description,
          mentionCount: entity.mentionCount
        }
      })
    }

    // Adiciona tags como nós
    for (const tag of tags) {
      nodes.push({
        id: tag.id,
        type: 'tag',
        label: tag.name,
        metadata: {
          color: tag.color,
          usageCount: tag.usageCount
        }
      })
    }

    // Adiciona relações como arestas
    for (const relation of relations) {
      const involved = relation.getInvolvedIds()
      
      // Nota -> Nota
      if (relation.sourceNote && relation.targetNote) {
        edges.push({
          source: relation.sourceNote.id,
          target: relation.targetNote.id,
          type: relation.type,
          weight: relation.weight,
          metadata: relation.metadata
        })
      }

      // Entidade -> Entidade
      if (relation.sourceEntity && relation.targetEntity) {
        edges.push({
          source: relation.sourceEntity.id,
          target: relation.targetEntity.id,
          type: relation.type,
          weight: relation.weight,
          metadata: relation.metadata
        })
      }

      // Nota -> Entidade (MENTIONS)
      if (relation.sourceNote && relation.targetEntity) {
        edges.push({
          source: relation.sourceNote.id,
          target: relation.targetEntity.id,
          type: RelationType.MENTIONS,
          weight: relation.weight
        })
      }

      // Nota -> Tag
      if (relation.sourceNote && relation.targetEntity) {
        // Tags são tratadas separadamente
      }
    }

    // Adiciona arestas implícitas de Note -> Tags
    for (const note of notes) {
      for (const tag of note.tags) {
        edges.push({
          source: note.id,
          target: tag.id,
          type: RelationType.TAGGED_WITH,
          weight: 1.0
        })
      }

      // Adiciona arestas implícitas de Note -> Entities
      for (const entity of note.entities) {
        edges.push({
          source: note.id,
          target: entity.id,
          type: RelationType.MENTIONS,
          weight: entity.confidence || 0.8
        })
      }
    }

    logger.info(`✅ Graph built: ${nodes.length} nodes, ${edges.length} edges`)
    
    return { nodes, edges }
  }

  /**
   * Encontra conexões entre duas notas (caminhos no grafo)
   */
  async findConnections(noteId1: string, noteId2: string, maxDepth: number = 3): Promise<any[]> {
    // Implementação simplificada - em produção usar BFS/DFS
    const relations = await getRepository(Relation).find({
      where: [
        { sourceNote: { id: noteId1 } },
        { targetNote: { id: noteId1 } }
      ],
      relations: ['sourceNote', 'targetNote', 'sourceEntity', 'targetEntity']
    })

    const connections: any[] = []
    
    for (const relation of relations) {
      if (relation.sourceNote?.id === noteId2 || relation.targetNote?.id === noteId2) {
        connections.push({
          type: 'direct',
          relation: relation.type,
          path: [noteId1, noteId2]
        })
      }
    }

    return connections
  }

  /**
   * Cria relação entre duas entidades
   */
  async createRelation(data: {
    type: RelationType
    sourceNoteId?: string
    targetNoteId?: string
    sourceEntityId?: string
    targetEntityId?: string
    confidence?: number
    metadata?: Record<string, any>
  }): Promise<Relation> {
    const repo = getRepository(Relation)
    
    const relation = repo.create({
      type: data.type,
      sourceNote: data.sourceNoteId ? { id: data.sourceNoteId } : undefined,
      targetNote: data.targetNoteId ? { id: data.targetNoteId } : undefined,
      sourceEntity: data.sourceEntityId ? { id: data.sourceEntityId } : undefined,
      targetEntity: data.targetEntityId ? { id: data.targetEntityId } : undefined,
      confidence: data.confidence,
      metadata: data.metadata
    })

    await repo.save(relation)
    logger.debug(`🔗 Created relation: ${data.type}`)
    
    return relation
  }

  /**
   * Remove relações órfãs ou antigas
   */
  async cleanupOrphanedRelations(): Promise<number> {
    const repo = getRepository(Relation)
    const relations = await repo.find({
      relations: ['sourceNote', 'targetNote', 'sourceEntity', 'targetEntity']
    })

    let removed = 0
    
    for (const relation of relations) {
      if (!relation.isValid()) {
        await repo.remove(relation)
        removed++
      }
    }

    if (removed > 0) {
      logger.info(`🧹 Removed ${removed} orphaned relations`)
    }

    return removed
  }

  /**
   * Estatísticas do grafo
   */
  async getStats(): Promise<{
    totalNodes: number
    totalEdges: number
    notesCount: number
    entitiesCount: number
    tagsCount: number
    avgConnectionsPerNode: number
  }> {
    const notesCount = await getRepository(Note).count()
    const entitiesCount = await getRepository(ConceptEntity).count()
    const tagsCount = await getRepository(Tag).count()
    const relationsCount = await getRepository(Relation).count()

    const totalNodes = notesCount + entitiesCount + tagsCount
    const totalEdges = relationsCount + (notesCount * 2) // + implicit tag/entity links

    return {
      totalNodes,
      totalEdges,
      notesCount,
      entitiesCount,
      tagsCount,
      avgConnectionsPerNode: totalNodes > 0 ? totalEdges / totalNodes : 0
    }
  }

  /**
   * Busca nós por tipo e filtro
   */
  async searchNodes(query: {
    type?: 'note' | 'entity' | 'tag'
    searchTerm?: string
    limit?: number
  }): Promise<GraphNode[]> {
    const limit = query.limit || 50
    const results: GraphNode[] = []

    if (!query.type || query.type === 'note') {
      const notes = await getRepository(Note).find({
        where: query.searchTerm ? { title: Like(`%${query.searchTerm}%`) } : {},
        take: limit
      })
      
      results.push(...notes.map(note => ({
        id: note.id,
        type: 'note' as const,
        label: note.title,
        metadata: { slug: note.slug }
      })))
    }

    if (!query.type || query.type === 'entity') {
      const entities = await getRepository(ConceptEntity).find({
        where: query.searchTerm ? { name: Like(`%${query.searchTerm}%`) } : {},
        take: limit
      })
      
      results.push(...entities.map(entity => ({
        id: entity.id,
        type: 'entity' as const,
        label: entity.name,
        metadata: { entityType: entity.type }
      })))
    }

    return results.slice(0, limit)
  }
}

// Helper para TypeORM Like operator
function Like(pattern: string) {
  return { like: pattern }
}

// Export singleton
export const graphEngine = GraphEngine.getInstance()
