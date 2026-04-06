/**
 * Database Core - Better-SQLite3 Puro
 * 
 * Zero ORM, máximo performance
 * Inspirado no conceito "SQLite-First" para PCs fracos
 */

import Database from 'better-sqlite3'
import path from 'path'
import { logger } from '../utils/logger'

export class DatabaseCore {
  private static instance: DatabaseCore
  private db: Database.Database | null = null
  private readonly DB_PATH: string

  constructor(dbPath?: string) {
    this.DB_PATH = dbPath || path.join(process.cwd(), 'knowledge.db')
  }

  static getInstance(dbPath?: string): DatabaseCore {
    if (!DatabaseCore.instance) {
      DatabaseCore.instance = new DatabaseCore(dbPath)
    }
    return DatabaseCore.instance
  }

  /**
   * Inicializa conexão com SQLite
   * Configurações otimizadas para performance
   */
  connect(): void {
    if (this.db) {
      logger.debug('Database already connected')
      return
    }

    try {
      logger.info(`💾 Connecting to SQLite: ${this.DB_PATH}`)
      
      this.db = new Database(this.DB_PATH, {
        verbose: process.env.DEBUG_DB ? console.log : undefined
      })

      // Otimizações de performance (WAL mode, memory-mapped I/O)
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('synchronous = NORMAL')
      this.db.pragma('cache_size = -64000') // 64MB cache
      this.db.pragma('temp_store = MEMORY')
      this.db.pragma('mmap_size = 268435456') // 256MB mmap

      // Cria tabelas se não existirem
      this.initializeSchema()

      logger.info('✅ Database connected and optimized')
    } catch (error) {
      logger.error('Failed to connect to database:', error)
      throw error
    }
  }

  /**
   * Retorna instância do banco
   */
  getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db
  }

  /**
   * Inicializa schema completo
   * SQL puro, zero ORM
   */
  private initializeSchema(): void {
    const db = this.getDb()

    // Tabela: notes
    db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        source TEXT DEFAULT 'manual',
        source_id TEXT,
        file_path TEXT,
        url TEXT,
        metadata TEXT,
        is_processed INTEGER DEFAULT 0,
        processed_at DATETIME,
        last_synced_at DATETIME,
        version INTEGER DEFAULT 0,
        checksum TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Tabela: tags
    db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        color TEXT,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Tabela: entities (conceitos extraídos)
    db.exec(`
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        mention_count INTEGER DEFAULT 0,
        confidence REAL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Tabela: relations (grafo)
    db.exec(`
      CREATE TABLE IF NOT EXISTS relations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        source_note_id TEXT,
        target_note_id TEXT,
        source_entity_id TEXT,
        target_entity_id TEXT,
        weight REAL DEFAULT 1.0,
        confidence REAL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_note_id) REFERENCES notes(id),
        FOREIGN KEY (target_note_id) REFERENCES notes(id),
        FOREIGN KEY (source_entity_id) REFERENCES entities(id),
        FOREIGN KEY (target_entity_id) REFERENCES entities(id)
      )
    `)

    // Tabela: note_tags (many-to-many)
    db.exec(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id),
        FOREIGN KEY (tag_id) REFERENCES tags(id)
      )
    `)

    // Tabela: note_entities (many-to-many)
    db.exec(`
      CREATE TABLE IF NOT EXISTS note_entities (
        note_id TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        PRIMARY KEY (note_id, entity_id),
        FOREIGN KEY (note_id) REFERENCES notes(id),
        FOREIGN KEY (entity_id) REFERENCES entities(id)
      )
    `)

    // Tabela: embeddings_cache
    db.exec(`
      CREATE TABLE IF NOT EXISTS embeddings_cache (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        original_text TEXT NOT NULL,
        vector TEXT NOT NULL,
        dimensions INTEGER NOT NULL,
        model TEXT,
        access_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(type, source_id)
      )
    `)

    // Índices para performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_notes_slug ON notes(slug);
      CREATE INDEX IF NOT EXISTS idx_notes_checksum ON notes(checksum);
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
      CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
      CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_note_id);
      CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_note_id);
      CREATE INDEX IF NOT EXISTS idx_embeddings_type ON embeddings_cache(type);
    `)

    logger.info('📊 Database schema initialized')
  }

  /**
   * Executa query preparada (seguro contra SQL injection)
   */
  prepare(sql: string): Database.Statement {
    return this.getDb().prepare(sql)
  }

  /**
   * Executa transação
   */
  transaction<T>(fn: () => T): T {
    return this.getDb().transaction(fn)()
  }

  /**
   * Fecha conexão
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      logger.info('🔒 Database connection closed')
    }
  }

  /**
   * Reset completo (para desenvolvimento)
   */
  reset(): void {
    logger.warn('⚠️  Resetting database...')
    
    if (this.db) {
      this.db.close()
    }

    // Deleta arquivo do banco
    const fs = require('fs')
    if (fs.existsSync(this.DB_PATH)) {
      fs.unlinkSync(this.DB_PATH)
    }

    // Reconecta
    this.connect()
    logger.info('✅ Database reset complete')
  }
}

// Export singleton
export const db = DatabaseCore.getInstance()
