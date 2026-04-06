/**
 * API Routes - Notes
 * CRUD operations for notes
 */

import { Router } from 'express';
import Database from 'better-sqlite3';

const router = Router();
let db: Database.Database;

export function setDatabase(database: Database.Database) {
  db = database;
}

/**
 * GET /api/notes
 * List all notes
 */
router.get('/', (req, res) => {
  try {
    const notes = db.prepare(`
      SELECT n.*, GROUP_CONCAT(t.name) as tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      GROUP BY n.id
      ORDER BY n.updated_at DESC
    `).all();

    res.json({ success: true, data: notes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/notes/:id
 * Get single note by ID
 */
router.get('/:id', (req, res) => {
  try {
    const note: any = db.prepare(`
      SELECT n.*, GROUP_CONCAT(t.name) as tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE n.id = ?
      GROUP BY n.id
    `).get(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Get related notes
    const relations = db.prepare(`
      SELECT n2.id, n2.title, r.type, r.strength
      FROM relations r
      JOIN notes n2 ON r.target_id = n2.id
      WHERE r.source_id = ?
      LIMIT 10
    `).all(req.params.id);

    note.relations = relations;

    res.json({ success: true, data: note });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
