/**
 * API Routes - Search
 * Full-text and semantic search
 */

import { Router } from 'express';
import Database from 'better-sqlite3';

const router = Router();
let db: Database.Database;

export function setDatabase(database: Database.Database) {
  db = database;
}

/**
 * GET /api/search
 * Search notes by query string
 */
router.get('/', (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // Full-text search in title and content
    const results = db.prepare(`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.word_count,
        n.updated_at,
        GROUP_CONCAT(t.name) as tags,
        CASE 
          WHEN n.title LIKE ? THEN 3
          WHEN n.content LIKE ? THEN 2
          ELSE 1
        END as relevance
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE n.title LIKE ? OR n.content LIKE ? OR t.name LIKE ?
      GROUP BY n.id
      ORDER BY relevance DESC, n.updated_at DESC
      LIMIT ?
    `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, parseInt(limit as string));

    // Highlight matches (simple implementation)
    const highlightedResults = results.map((result: any) => ({
      ...result,
      excerpt: highlightMatches(result.content, q as string, 150)
    }));

    res.json({
      success: true,
      data: {
        query: q,
        count: highlightedResults.length,
        results: highlightedResults
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/search/tags
 * Search by tags
 */
router.get('/tags', (req, res) => {
  try {
    const { tag } = req.query;
    
    if (!tag) {
      return res.status(400).json({ error: 'Tag parameter is required' });
    }

    const notes = db.prepare(`
      SELECT n.*
      FROM notes n
      JOIN note_tags nt ON n.id = nt.note_id
      JOIN tags t ON nt.tag_id = t.id
      WHERE t.name = ?
      ORDER BY n.updated_at DESC
    `).all(tag);

    res.json({
      success: true,
      data: {
        tag,
        count: notes.length,
        notes
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/search/suggestions
 * Get search suggestions (autocomplete)
 */
router.get('/suggestions', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    // Get title suggestions
    const titleSuggestions = db.prepare(`
      SELECT DISTINCT title as value, 'title' as type
      FROM notes
      WHERE title LIKE ?
      LIMIT 5
    `).all(`${q}%`);

    // Get tag suggestions
    const tagSuggestions = db.prepare(`
      SELECT DISTINCT name as value, 'tag' as type
      FROM tags
      WHERE name LIKE ?
      LIMIT 5
    `).all(`${q}%`);

    const suggestions = [...titleSuggestions, ...tagSuggestions];

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Highlight matched text
 */
function highlightMatches(text: string, query: string, maxLength: number): string {
  const excerpt = text.substring(0, maxLength);
  const regex = new RegExp(`(${query})`, 'gi');
  return excerpt.replace(regex, '<mark>$1</mark>') + '...';
}

export default router;
