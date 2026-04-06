/**
 * API Routes - Ingest
 * 
 * POST /ingest - Ingere notas do filesystem
 * GET /ingest/status - Status da ingestão
 */

import { Request, Response } from 'express'
import { db } from '../../core/database'
import { FileSystemProvider } from '../ingestion/FileSystemProvider'
import { entityExtractor } from '../ai/EntityExtractor'
import { autoLinker } from '../ai/AutoLinker'
import { logger } from '../../utils/logger'
import { v4 as uuidv4 } from 'uuid'

const fsProvider = new FileSystemProvider()

/**
 * POST /ingest
 * Ingere notas de um diretório
 */
export async function ingestNotes(req: Request, res: Response) {
  const { directory = './notes', force = false } = req.body

  try {
    logger.info(`📥 Starting ingestion from: ${directory}`)

    // Escaneia diretório
    const files = await fsProvider.scanDirectory(directory)
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'No markdown files found' })
    }

    const results = {
      total: files.length,
      ingested: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    }

    const database = db.getDb()
    
    // Prepara statements (performance)
    const insertNote = database.prepare(`
      INSERT INTO notes (id, slug, title, content, excerpt, source, file_path, checksum, is_processed)
      VALUES (?, ?, ?, ?, ?, 'filesystem', ?, ?, 0)
    `)

    const updateNote = database.prepare(`
      UPDATE notes 
      SET content = ?, title = ?, excerpt = ?, checksum = ?, version = version + 1
      WHERE file_path = ?
    `)

    const checkExisting = database.prepare(`
      SELECT id, checksum FROM notes WHERE file_path = ?
    `)

    // Processa cada arquivo
    for (const file of files) {
      try {
        const parsed = await fsProvider.parseMarkdown(file.filePath)
        const slug = fsProvider.generateSlug(file.filePath, parsed.title)
        
        // Verifica se já existe
        const existing: any = checkExisting.get(file.filePath)
        const changeDetection = fsProvider.detectChanges(existing?.checksum, file.checksum)

        if (existing && !changeDetection.hasChanged && !force) {
          results.skipped++
          continue
        }

        // Extrai entidades (rápido, local)
        const entities = await entityExtractor.extract(parsed.content)
        
        // Gera excerpt
        const excerpt = parsed.content.substring(0, 200) + '...'

        if (existing) {
          // Atualiza nota existente
          updateNote.run(
            parsed.content,
            parsed.title,
            excerpt,
            file.checksum,
            file.filePath
          )
          results.updated++
          
          logger.debug(`✏️ Updated: ${parsed.title}`)
        } else {
          // Insere nova nota
          insertNote.run(
            uuidv4(),
            slug,
            parsed.title,
            parsed.content,
            excerpt,
            file.filePath,
            file.checksum
          )
          results.ingested++
          
          logger.debug(`✅ Ingested: ${parsed.title}`)
        }

        // Salva tags
        if (parsed.tags.length > 0) {
          saveTags(database, existing?.id || uuidv4(), parsed.tags)
        }

        // Salva entidades
        if (entities.length > 0) {
          saveEntities(database, existing?.id || uuidv4(), entities)
        }

      } catch (error: any) {
        results.errors.push(`${file.filePath}: ${error.message}`)
        logger.error(`❌ Error processing ${file.filePath}:`, error)
      }
    }

    // Auto-linking em batch (após todas as notas ingeridas)
    if (results.ingested > 0) {
      logger.info('🔗 Running auto-linker...')
      await runAutoLinker(database)
    }

    logger.info(`🎉 Ingestion complete: ${results.ingested} new, ${results.updated} updated`)

    res.json({
      success: true,
      message: `Ingested ${results.ingested} notes, updated ${results.updated}`,
      results
    })

  } catch (error: any) {
    logger.error('Ingestion failed:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Salva tags no banco
 */
function saveTags(database: any, noteId: string, tags: string[]) {
  const insertTag = database.prepare(`
    INSERT OR IGNORE INTO tags (id, name, usage_count)
    VALUES (?, ?, 0)
  `)

  const linkTag = database.prepare(`
    INSERT OR REPLACE INTO note_tags (note_id, tag_id)
    VALUES (?, ?)
  `)

  const updateCount = database.prepare(`
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?
  `)

  for (const tagName of tags) {
    const tagId = uuidv4()
    insertTag.run(tagId, tagName.toLowerCase())
    linkTag.run(noteId, tagId)
    updateCount.run(tagId)
  }
}

/**
 * Salva entidades no banco
 */
function saveEntities(database: any, noteId: string, entities: any[]) {
  const insertEntity = database.prepare(`
    INSERT OR IGNORE INTO entities (id, name, type, mention_count, confidence)
    VALUES (?, ?, ?, ?, ?)
  `)

  const linkEntity = database.prepare(`
    INSERT OR REPLACE INTO note_entities (note_id, entity_id)
    VALUES (?, ?)
  `)

  const updateMentions = database.prepare(`
    UPDATE entities SET mention_count = mention_count + 1 WHERE id = ?
  `)

  for (const entity of entities) {
    const entityId = uuidv4()
    insertEntity.run(entityId, entity.name, entity.type, entity.mentions, entity.confidence)
    linkEntity.run(noteId, entityId)
    updateMentions.run(entityId)
  }
}

/**
 * Roda auto-linker para todas as notas
 */
async function runAutoLinker(database: any) {
  const notes = database.prepare(`
    SELECT id, title, content FROM notes
  `).all()

  const notesMap = new Map(notes.map((n: any) => [n.id, n.title]))

  const insertRelation = database.prepare(`
    INSERT OR IGNORE INTO relations (id, type, source_note_id, target_note_id, weight, confidence)
    VALUES (?, 'RELATED_TO', ?, ?, ?, ?)
  `)

  for (const note of notes) {
    const suggestions = await autoLinker.findSuggestions(
      {
        id: note.id,
        title: note.title,
        content: note.content,
        tags: [],
        entities: []
      },
      notes.map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        tags: [],
        entities: []
      })),
      3 // Max 3 sugestões por nota
    )

    for (const suggestion of suggestions) {
      insertRelation.run(
        uuidv4(),
        suggestion.sourceNoteId,
        suggestion.targetNoteId,
        suggestion.score,
        suggestion.confidence
      )
    }
  }
}

/**
 * GET /ingest/status
 * Retorna estatísticas de ingestão
 */
export async function getIngestStatus(req: Request, res: Response) {
  try {
    const database = db.getDb()
    
    const stats: any = {}
    
    stats.totalNotes = database.prepare('SELECT COUNT(*) as count FROM notes').get().count
    stats.totalTags = database.prepare('SELECT COUNT(*) as count FROM tags').get().count
    stats.totalEntities = database.prepare('SELECT COUNT(*) as count FROM entities').get().count
    stats.totalRelations = database.prepare('SELECT COUNT(*) as count FROM relations').get().count

    res.json({ success: true, stats })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
