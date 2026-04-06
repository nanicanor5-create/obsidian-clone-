import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

interface LinkSuggestion {
  sourceNoteId: string;
  targetNoteId: string;
  score: number;
  reason: string;
}

export class AutoLinker {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  /**
   * Find and suggest links between notes using Jaccard similarity
   * Lightweight algorithm that works great on low-end hardware
   */
  async findSuggestions(noteId?: string): Promise<LinkSuggestion[]> {
    const suggestions: LinkSuggestion[] = [];

    // Get all notes or specific note
    const notes = noteId 
      ? this.getNoteById(noteId)
      : this.getAllNotes();

    if (!noteId && notes.length > 0) {
      // Batch processing for all notes
      console.log(`🔍 Analyzing ${notes.length} notes for link suggestions...`);
      
      for (let i = 0; i < notes.length; i++) {
        const related = this.findRelatedNotes(notes[i]);
        suggestions.push(...related);
        
        // Progress logging
        if ((i + 1) % 10 === 0) {
          console.log(`   Processed ${i + 1}/${notes.length} notes`);
        }
      }
    } else if (notes.length > 0) {
      // Single note processing
      suggestions.push(...this.findRelatedNotes(notes[0]));
    }

    // Save top suggestions to DB
    this.saveSuggestions(suggestions);

    return suggestions.slice(0, 50); // Return top 50
  }

  /**
   * Get single note by ID
   */
  private getNoteById(noteId: string): Array<{id: string, title: string, content: string}> {
    const note = this.db.prepare(`
      SELECT id, title, content FROM notes WHERE id = ?
    `).get(noteId) as any;

    return note ? [note] : [];
  }

  /**
   * Get all notes for batch processing
   */
  private getAllNotes(): Array<{id: string, title: string, content: string}> {
    return this.db.prepare(`
      SELECT id, title, content FROM notes
    `).all() as any[];
  }

  /**
   * Find related notes using Jaccard similarity on word sets
   * Fast, no ML required, works offline
   */
  private findRelatedNotes(sourceNote: {id: string, title: string, content: string}): LinkSuggestion[] {
    const suggestions: LinkSuggestion[] = [];
    
    // Extract keywords from source note
    const sourceWords = this.extractKeywords(sourceNote.content);
    
    if (sourceWords.size < 3) return []; // Too short to compare

    // Get all other notes
    const otherNotes = this.db.prepare(`
      SELECT id, title, content FROM notes WHERE id != ?
    `).all(sourceNote.id) as any[];

    for (const target of otherNotes) {
      const targetWords = this.extractKeywords(target.content);
      
      if (targetWords.size < 3) continue;

      // Calculate Jaccard similarity
      const intersection = new Set([...sourceWords].filter(x => targetWords.has(x)));
      const union = new Set([...sourceWords, ...targetWords]);
      
      const jaccardScore = intersection.size / union.size;

      // Only suggest if score is meaningful (> 0.1)
      if (jaccardScore > 0.1) {
        // Boost score if titles match
        let finalScore = jaccardScore;
        let reason = `Shared keywords: ${intersection.size}`;
        
        if (target.title.toLowerCase().includes(sourceNote.title.toLowerCase()) ||
            sourceNote.title.toLowerCase().includes(target.title.toLowerCase())) {
          finalScore *= 1.5;
          reason = 'Title similarity + shared keywords';
        }

        suggestions.push({
          sourceNoteId: sourceNote.id,
          targetNoteId: target.id,
          score: Math.min(finalScore, 1.0),
          reason
        });
      }
    }

    // Sort by score descending
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * Extract significant words from content
   * Removes stopwords and focuses on meaningful terms
   */
  private extractKeywords(content: string): Set<string> {
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
      'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where',
      'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
      'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now'
    ]);

    // Extract words, convert to lowercase, filter
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && // At least 4 chars
        !stopwords.has(word) && // Not a stopword
        !/^\d+$/.test(word) // Not just numbers
      );

    return new Set(words);
  }

  /**
   * Save suggestions to database
   */
  private saveSuggestions(suggestions: LinkSuggestion[]) {
    const transaction = this.db.transaction(() => {
      // Clear old suggestions (optional: could keep history)
      this.db.prepare('DELETE FROM link_suggestions').run();

      // Insert new suggestions
      suggestions.forEach(sugg => {
        const id = uuidv4();
        this.db.prepare(`
          INSERT INTO link_suggestions (id, source_note_id, target_note_id, score, reason, accepted)
          VALUES (?, ?, ?, ?, ?, 0)
        `).run(id, sugg.sourceNoteId, sugg.targetNoteId, sugg.score, sugg.reason);
      });
    });

    transaction();
    console.log(`💾 Saved ${suggestions.length} link suggestions`);
  }

  /**
   * Accept a suggestion and create actual relation
   */
  acceptSuggestion(suggestionId: string): boolean {
    const suggestion = this.db.prepare(`
      SELECT * FROM link_suggestions WHERE id = ?
    `).get(suggestionId) as any;

    if (!suggestion) return false;

    const transaction = this.db.transaction(() => {
      // Create relation
      this.db.prepare(`
        INSERT OR IGNORE INTO relations (id, source_id, target_id, type, strength)
        VALUES (?, ?, ?, 'RELATED_TO', ?)
      `).run(uuidv4(), suggestion.source_note_id, suggestion.target_note_id, suggestion.score);

      // Mark as accepted
      this.db.prepare(`
        UPDATE link_suggestions SET accepted = 1 WHERE id = ?
      `).run(suggestionId);
    });

    transaction();
    return true;
  }

  /**
   * Get pending suggestions
   */
  getPendingSuggestions(limit: number = 20): any[] {
    return this.db.prepare(`
      SELECT ls.*, n1.title as source_title, n2.title as target_title
      FROM link_suggestions ls
      JOIN notes n1 ON ls.source_note_id = n1.id
      JOIN notes n2 ON ls.target_note_id = n2.id
      WHERE ls.accepted = 0
      ORDER BY ls.score DESC
      LIMIT ?
    `).all(limit) as any[];
  }

  public close() {
    this.db.close();
  }
}
