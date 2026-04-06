-- Turbo MVP Database Schema
-- Optimized for Better-SQLite3

-- Enable WAL mode for better performance
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = memory;
PRAGMA mmap_size = 268435456; -- 256MB

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    path TEXT UNIQUE,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    word_count INTEGER DEFAULT 0,
    checksum TEXT
);

-- Create index for fast path lookup
CREATE INDEX IF NOT EXISTS idx_notes_path ON notes(path);
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Note-Tags junction table
CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Entities table (extracted concepts)
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('PERSON', 'ORGANIZATION', 'LOCATION', 'TOPIC', 'EVENT', 'DATE')),
    confidence REAL DEFAULT 1.0,
    source_note_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);

-- Relations table (graph edges)
CREATE TABLE IF NOT EXISTS relations (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('MENTIONS', 'RELATED_TO', 'SIMILAR_TO', 'LINKS_TO', 'REFERENCES')),
    strength REAL DEFAULT 1.0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (source_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_id);
CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_id);
CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(type);

-- Embeddings cache (for semantic search)
CREATE TABLE IF NOT EXISTS embedding_cache (
    id TEXT PRIMARY KEY,
    note_id TEXT UNIQUE NOT NULL,
    embedding BLOB NOT NULL, -- Store as blob for efficiency
    model_version TEXT DEFAULT 'minilm-l6-v2',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_embedding_note ON embedding_cache(note_id);

-- Auto-links suggestions table
CREATE TABLE IF NOT EXISTS link_suggestions (
    id TEXT PRIMARY KEY,
    source_note_id TEXT NOT NULL,
    target_note_id TEXT NOT NULL,
    score REAL NOT NULL,
    reason TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    accepted INTEGER DEFAULT 0,
    FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_suggestions_source ON link_suggestions(source_note_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_score ON link_suggestions(score DESC);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('version', '0.1.0'),
    ('auto_link_enabled', 'true'),
    ('auto_tag_enabled', 'true'),
    ('embedding_model', 'minilm-l6-v2');
