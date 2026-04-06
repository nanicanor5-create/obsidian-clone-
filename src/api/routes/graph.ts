/**
 * API Routes - Graph
 * Knowledge graph visualization and queries
 */

import { Router } from 'express';
import Database from 'better-sqlite3';

const router = Router();
let db: Database.Database;

export function setDatabase(database: Database.Database) {
  db = database;
}

/**
 * GET /api/graph
 * Get complete graph structure for visualization
 */
router.get('/', (req, res) => {
  try {
    // Get all nodes (notes)
    const nodes = db.prepare(`
      SELECT 
        id,
        title as label,
        word_count as size,
        created_at,
        updated_at
      FROM notes
    `).all();

    // Get all edges (relations)
    const edges = db.prepare(`
      SELECT 
        r.source_id as source,
        r.target_id as target,
        r.type,
        r.strength as weight
      FROM relations r
    `).all();

    // Get stats
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM notes) as totalNotes,
        (SELECT COUNT(*) FROM relations) as totalRelations,
        (SELECT COUNT(*) FROM tags) as totalTags,
        (SELECT COUNT(*) FROM entities) as totalEntities
    `).get();

    res.json({
      success: true,
      data: {
        nodes,
        edges,
        stats
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/graph/connections/:noteId
 * Get direct connections for a specific note
 */
router.get('/connections/:id', (req, res) => {
  try {
    const note = db.prepare('SELECT id, title FROM notes WHERE id = ?').get(req.params.id);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Get incoming and outgoing relations
    const connections = db.prepare(`
      SELECT 
        n.id,
        n.title,
        r.type,
        r.strength,
        CASE 
          WHEN r.source_id = ? THEN 'outgoing'
          ELSE 'incoming'
        END as direction
      FROM relations r
      JOIN notes n ON 
        (r.source_id = ? AND r.target_id = n.id) OR
        (r.target_id = ? AND r.source_id = n.id)
      WHERE r.source_id = ? OR r.target_id = ?
      LIMIT 50
    `).all(req.params.id, req.params.id, req.params.id, req.params.id, req.params.id);

    res.json({
      success: true,
      data: {
        note,
        connections
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/graph/stats
 * Get graph statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats: any = {};

    // Basic counts
    const counts: any = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM notes) as notes,
        (SELECT COUNT(*) FROM relations) as relations,
        (SELECT COUNT(*) FROM tags) as tags,
        (SELECT COUNT(*) FROM entities) as entities
    `).get();

    stats.counts = counts;

    // Most connected notes
    stats.mostConnected = db.prepare(`
      SELECT n.id, n.title, COUNT(r.id) as connectionCount
      FROM notes n
      LEFT JOIN relations r ON n.id = r.source_id OR n.id = r.target_id
      GROUP BY n.id
      ORDER BY connectionCount DESC
      LIMIT 10
    `).all();

    // Recent activity
    stats.recentNotes = db.prepare(`
      SELECT id, title, updated_at
      FROM notes
      ORDER BY updated_at DESC
      LIMIT 5
    `).all();

    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
