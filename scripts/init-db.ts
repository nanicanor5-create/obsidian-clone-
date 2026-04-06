#!/usr/bin/env tsx
/**
 * Database Initialization Script
 * Creates SQLite database with optimized schema for Turbo MVP
 */

import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './data/turbo-mvp.db';
const SCHEMA_PATH = join(__dirname, 'schema.sql');

console.log('🚀 Initializing Turbo MVP Database...');
console.log(`📍 Database path: ${DB_PATH}`);

try {
  // Ensure data directory exists
  mkdirSync(dirname(DB_PATH), { recursive: true });

  // Open database connection
  const db = new Database(DB_PATH);
  
  // Enable WAL mode and optimizations
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 10000');
  db.pragma('temp_store = memory');
  db.pragma('mmap_size = 268435456');

  console.log('⚙️  Database optimizations applied');

  // Read and execute schema
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);

  console.log('✅ Schema created successfully');

  // Verify tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('\n📊 Tables created:');
  tables.forEach((table: any) => console.log(`   - ${table.name}`));

  // Insert sample data for testing
  console.log('\n🧪 Inserting sample data...');
  
  const sampleNoteId = 'sample-note-1';
  const now = Math.floor(Date.now() / 1000);
  
  db.prepare(`
    INSERT OR REPLACE INTO notes (id, title, content, path, word_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    sampleNoteId,
    'Welcome to Turbo MVP',
    '# Welcome to Turbo MVP\n\nThis is your first note! \n\nStart by adding more markdown files to the `notes` folder.\n\n#turbo #mvp #getting-started',
    './notes/welcome.md',
    25,
    now,
    now
  );

  // Add tags
  const tagIds: string[] = [];
  ['turbo', 'mvp', 'getting-started'].forEach(tagName => {
    const tagId = `tag-${tagName}`;
    db.prepare(`INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)`).run(tagId, tagName);
    tagIds.push(tagId);
    
    db.prepare(`INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)`).run(sampleNoteId, tagId);
  });

  console.log('✅ Sample note created with tags');

  // Close connection
  db.close();

  console.log('\n🎉 Database initialization complete!');
  console.log(`📁 Database file: ${DB_PATH}`);
  console.log('\n✨ Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Visit: http://localhost:3000');
  console.log('   3. Add markdown files to ./notes folder');

} catch (error) {
  console.error('❌ Error initializing database:', error);
  process.exit(1);
}
