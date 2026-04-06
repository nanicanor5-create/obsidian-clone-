#!/usr/bin/env tsx
/**
 * CLI Ingestion Tool
 * Manually ingest a directory of markdown files
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './data/turbo-mvp.db';
const NOTES_DIR = process.argv[2] || './notes';

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

async function main() {
  console.log('🚀 Starting manual ingestion...');
  console.log(`📁 Source: ${NOTES_DIR}`);
  console.log(`💾 Database: ${DB_PATH}\n`);

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  let ingested = 0;
  let skipped = 0;
  let errors = 0;

  try {
    await ingestDirectory(NOTES_DIR, db);
    
    console.log('\n✅ Ingestion complete!');
    console.log(`   📝 Ingested: ${ingested}`);
    console.log(`   ⏭️  Skipped (unchanged): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

    // Show stats
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_notes,
        SUM(word_count) as total_words,
        COUNT(DISTINCT t.id) as total_tags
      FROM notes
      LEFT JOIN note_tags nt ON notes.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
    `).get() as any;

    console.log('\n📊 Database stats:');
    console.log(`   Total notes: ${stats.total_notes}`);
    console.log(`   Total words: ${stats.total_words}`);
    console.log(`   Total tags: ${stats.total_tags}`);

  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

async function ingestDirectory(dirPath: string, db: Database.Database) {
  let ingested = 0;
  let skipped = 0;
  let errors = 0;

  async function processDir(currentPath: string) {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) {
          await processDir(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        try {
          const result = await ingestFile(fullPath, db);
          if (result === 'ingested') ingested++;
          else skipped++;
        } catch (error) {
          errors++;
          console.error(`   ❌ Error: ${fullPath}`, error);
        }
      }
    }
  }

  await processDir(dirPath);

  console.log(`\n📈 Results: ${ingested} ingested, ${skipped} skipped, ${errors} errors`);
}

async function ingestFile(filePath: string, db: Database.Database): Promise<'ingested' | 'skipped'> {
  const { readFile, stat } = await import('fs/promises');
  
  const content = await readFile(filePath, 'utf-8');
  const stats = await stat(filePath);
  const noteData = parseMarkdown(content, filePath);

  // Check if file already exists and unchanged
  const existing = db.prepare('SELECT checksum, id FROM notes WHERE path = ?').get(filePath) as any;
  
  if (existing && existing.checksum === noteData.checksum) {
    console.log(`⏭️  Skipped: ${filePath}`);
    return 'skipped';
  }

  saveNote(noteData, stats.mtimeMs, db, !!existing);
  console.log(`📝 ${existing ? 'Updated' : 'Created'}: ${noteData.title}`);
  
  return 'ingested';
}

function parseMarkdown(content: string, filePath: string): NoteData {
  const checksum = createHash('md5').update(content).digest('hex');
  
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filePath.split('/').pop()?.replace('.md', '') || 'Untitled';
  
  const tags = [...content.matchAll(/#([\w-]+)/g)].map(m => m[1]);
  const links = [...content.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1]);
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  return {
    id: uuidv4(),
    title,
    content,
    path: filePath,
    wordCount,
    checksum,
    tags: [...new Set(tags)],
    links
  };
}

function saveNote(noteData: NoteData, mtime: number, db: Database.Database, isUpdate: boolean) {
  const now = Math.floor(Date.now() / 1000);
  const updatedAt = Math.floor(mtime / 1000);

  const transaction = db.transaction(() => {
    db.prepare(`
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

    const existing = db.prepare('SELECT id FROM notes WHERE path = ?').get(noteData.path) as any;
    const noteId = existing.id;

    db.prepare('DELETE FROM note_tags WHERE note_id = ?').run(noteId);
    
    noteData.tags.forEach(tagName => {
      const tagId = `tag-${tagName.toLowerCase()}`;
      db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)').run(tagId, tagName);
      db.prepare('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)').run(noteId, tagId);
    });

    noteData.links.forEach(linkTitle => {
      const target = db.prepare('SELECT id FROM notes WHERE title = ? OR path LIKE ?').get(linkTitle, `%${linkTitle}%`) as any;
      if (target) {
        db.prepare(`
          INSERT OR IGNORE INTO relations (id, source_id, target_id, type, strength)
          VALUES (?, ?, ?, 'LINKS_TO', 1.0)
        `).run(uuidv4(), noteId, target.id);
      }
    });
  });

  transaction();
}

main();
