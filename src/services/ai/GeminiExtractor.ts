import Database from 'better-sqlite3';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

interface Entity {
  name: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'TOPIC' | 'EVENT' | 'DATE';
  confidence: number;
}

export class GeminiExtractor {
  private db: Database.Database;
  private apiKey?: string;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  /**
   * Extract entities using hybrid approach:
   * 1. Quick regex for obvious patterns (dates, simple tags)
   * 2. Gemini CLI for complex semantic extraction
   */
  async extractEntities(noteId: string, content: string, title: string): Promise<Entity[]> {
    const entities: Entity[] = [];

    // Step 1: Fast local extraction (regex-based)
    const localEntities = this.extractLocal(content);
    entities.push(...localEntities);

    // Step 2: Cloud extraction for complex cases (if API key exists)
    if (this.apiKey && content.length > 200) {
      try {
        const cloudEntities = await this.extractWithGemini(title, content);
        entities.push(...cloudEntities);
      } catch (error) {
        console.warn('⚠️  Gemini extraction failed, using local only:', error);
      }
    }

    // Deduplicate and save to DB
    const uniqueEntities = this.deduplicateEntities(entities);
    this.saveEntities(noteId, uniqueEntities);

    return uniqueEntities;
  }

  /**
   * Fast local extraction using regex patterns
   * Catches: Dates, capitalized phrases, potential topics
   */
  private extractLocal(content: string): Entity[] {
    const entities: Entity[] = [];

    // Extract dates (simple pattern)
    const datePatterns = [
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi
    ];

    datePatterns.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(m => {
        entities.push({
          name: m[0],
          type: 'DATE',
          confidence: 0.95
        });
      });
    });

    // Extract capitalized phrases (potential organizations/people)
    const capPhrases = [...content.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g)];
    capPhrases.slice(0, 10).forEach(m => { // Limit to top 10
      const phrase = m[1];
      // Filter out common false positives
      if (!this.isFalsePositive(phrase)) {
        entities.push({
          name: phrase,
          type: this.guessType(phrase),
          confidence: 0.6
        });
      }
    });

    // Extract topics from hashtags
    const hashtags = [...content.matchAll(/#([\w-]+)/g)];
    hashtags.forEach(m => {
      entities.push({
        name: m[1],
        type: 'TOPIC',
        confidence: 0.9
      });
    });

    return entities;
  }

  /**
   * Use Gemini CLI for sophisticated entity extraction
   */
  private async extractWithGemini(title: string, content: string): Promise<Entity[]> {
    const prompt = `Extract key entities from this note. Return ONLY valid JSON array in this format:
[{"name": "Entity Name", "type": "PERSON|ORGANIZATION|LOCATION|TOPIC|EVENT", "confidence": 0.0-1.0}]

Note Title: ${title}
Content: ${content.slice(0, 3000)}

Focus on the most important entities only (max 10).`;

    try {
      const command = `echo "${prompt}" | gemini`;
      const result = execSync(command, { 
        encoding: 'utf-8',
        env: { ...process.env, GEMINI_API_KEY: this.apiKey! },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Parse JSON response
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((e: any) => ({
          name: e.name,
          type: this.validateType(e.type),
          confidence: e.confidence || 0.7
        }));
      }
    } catch (error) {
      throw new Error(`Gemini CLI failed: ${error}`);
    }

    return [];
  }

  /**
   * Remove duplicate entities
   */
  private deduplicateEntities(entities: Entity[]): Entity[] {
    const seen = new Set<string>();
    return entities.filter(e => {
      const key = `${e.name.toLowerCase()}-${e.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Guess entity type based on name patterns
   */
  private guessType(name: string): Entity['type'] {
    const lower = name.toLowerCase();
    
    if (lower.includes('inc') || lower.includes('ltd') || lower.includes('corp')) {
      return 'ORGANIZATION';
    }
    if (lower.includes('university') || lower.includes('school')) {
      return 'ORGANIZATION';
    }
    if (['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].some(m => lower.includes(m))) {
      return 'DATE';
    }
    
    // Default to TOPIC
    return 'TOPIC';
  }

  /**
   * Check if phrase is a common false positive
   */
  private isFalsePositive(phrase: string): boolean {
    const falsePositives = [
      'The', 'This', 'That', 'These', 'Those',
      'Introduction', 'Conclusion', 'Summary',
      'Chapter', 'Section', 'Part',
      'Note', 'Notes', 'File', 'Files'
    ];
    return falsePositives.some(fp => phrase.toLowerCase() === fp.toLowerCase());
  }

  /**
   * Validate entity type
   */
  private validateType(type: string): Entity['type'] {
    const validTypes = ['PERSON', 'ORGANIZATION', 'LOCATION', 'TOPIC', 'EVENT', 'DATE'];
    return validTypes.includes(type.toUpperCase()) ? type.toUpperCase() as Entity['type'] : 'TOPIC';
  }

  /**
   * Save entities to database
   */
  private saveEntities(noteId: string, entities: Entity[]) {
    const transaction = this.db.transaction(() => {
      // Remove old entities for this note
      this.db.prepare('DELETE FROM entities WHERE source_note_id = ?').run(noteId);

      // Insert new entities
      entities.forEach(entity => {
        const entityId = uuidv4();
        this.db.prepare(`
          INSERT INTO entities (id, name, type, confidence, source_note_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(entityId, entity.name, entity.type, entity.confidence, noteId);
      });
    });

    transaction();
    console.log(`💾 Saved ${entities.length} entities for note ${noteId}`);
  }

  public close() {
    this.db.close();
  }
}
