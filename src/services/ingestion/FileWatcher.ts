import chokidar from 'chokidar';
import { readFile, stat } from 'fs/promises';
import { basename, extname } from 'path';
import { createHash } from 'crypto';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

interface NoteData {
  id: string;
  title: string;
  content: string;
  path: string;
  wordCount: number;
  checksum: string;
  tags: string[];
  links: string[];
}

export class FileWatcher {
  private db: Database.Database;
  private watcher: chokidar.FSWatcher;
  private notesDir: string;

  constructor(dbPath: string, notesDir: string) {
    this.db = new Database(dbPath);
    this.notesDir = notesDir;
    
    // Enable WAL
    this.db.pragma('journal_mode = WAL');
    
    this.watcher = chokidar.watch(notesDir, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: false
    });

    this.setupListeners();
    console.log(`👁️  FileWatcher started on ${notesDir}`);
  }

  private setupListeners() {
    this.watcher
      .on('add', (path) => this.handleFile(path, 'created'))
      .on('change', (path) => this.handleFile(path, 'updated'))
      .on('unlink', (path) => this.handleFileDelete(path))
      .on('ready', () => console.log('✅ Initial scan complete'));
  }

  private async handleFile(filePath: string, event: 'created' | 'updated') {
    if (extname(filePath) !== '.md') return;

    try {
      const content = await readFile(filePath, 'utf-8');
      const stats = await stat(filePath);
      const noteData = this.parseMarkdown(content, filePath);

      // Check if file actually changed
      const existing = this.db.prepare('SELECT checksum FROM notes WHERE path = ?').get(filePath) as any;
      if (existing && existing.checksum === noteData.checksum) {
        return; // No changes
      }

      this.saveNote(noteData, stats.mtimeMs);
      console.log(`📝 [${event.toUpperCase()}] ${basename(filePath)}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
    }
  }

  private async handleFileDelete(filePath: string) {
    if (extname(filePath) !== '.md') return;

    const note = this.db.prepare('SELECT id FROM notes WHERE path = ?').get(filePath) as any;
    if (note) {
      this.db.prepare('DELETE FROM notes WHERE id = ?').run(note.id);
      console.log(`🗑️  [DELETED] ${basename(filePath)}`);
    }
  }

  private parseMarkdown(content: string, filePath: string): NoteData {
    const checksum = createHash('md5').update(content).digest('hex');
    
    // Extract title from first h1 or filename
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : basename(filePath, '.md');
    
    // Extract tags (#tag or #tag)
    const tags = [...content.matchAll(/#([\w-]+)/g)].map(m => m[1]);
    
    // Extract wikilinks [[link]]
    const links = [...content.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1]);
    
    // Word count
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    return {
      id: uuidv4(),
      title,
      content,
      path: filePath,
      wordCount,
      checksum,
      tags: [...new Set(tags)], // Remove duplicates
      links
    };
  }

  private saveNote(noteData: NoteData, mtime: number) {
    const now = Math.floor(Date.now() / 1000);
    const updatedAt = Math.floor(mtime / 1000);

    const transaction = this.db.transaction(() => {
      // Upsert note
      this.db.prepare(`
        INSERT INTO notes (id, title, content, path, word_count, checksum, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          word_count = excluded.word_count,
          checksum = excluded.checksum,
          updated_at = excluded.updated_at
      `).run(
        noteData.id,
        noteData.title,
        noteData.content,
        noteData.path,
        noteData.wordCount,
        noteData.checksum,
        now,
        updatedAt
      );

      // Get the actual ID (in case of update)
      const existing = this.db.prepare('SELECT id FROM notes WHERE path = ?').get(noteData.path) as any;
      const noteId = existing ? existing.id : noteData.id;

      // Update tags
      this.db.prepare('DELETE FROM note_tags WHERE note_id = ?').run(noteId);
      
      noteData.tags.forEach(tagName => {
        const tagId = `tag-${tagName.toLowerCase()}`;
        this.db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)').run(tagId, tagName);
        this.db.prepare('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)').run(noteId, tagId);
      });

      // Create explicit link relations
      noteData.links.forEach(linkTitle => {
        const target = this.db.prepare('SELECT id FROM notes WHERE title = ? OR path LIKE ?').get(linkTitle, `%${linkTitle}%`) as any;
        if (target) {
          this.db.prepare(`
            INSERT OR IGNORE INTO relations (id, source_id, target_id, type, strength)
            VALUES (?, ?, ?, 'LINKS_TO', 1.0)
          `).run(uuidv4(), noteId, target.id);
        }
      });
    });

    transaction();
  }

  public close() {
    this.watcher.close();
    this.db.close();
  }
}
