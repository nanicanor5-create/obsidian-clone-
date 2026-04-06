# 🚀 MVP Implementation Guide

## Visão Geral

Este documento descreve a implementação do MVP que integra os conceitos do **Knowledge Nexus** com a arquitetura **local-first** deste repositório.

## ✅ Componentes Implementados

### 1. Modelos de Dados (TypeORM)

#### `Note` - Notas do Sistema
- Inspirado no conceito de "Page" do Knowledge Nexus
- Suporte a múltiplas fontes: FileSystem, Notion, Web, Manual
- Controle de versão e checksum para processamento incremental
- Relações com tags, entidades e notas pai

#### `ConceptEntity` - Entidades/Conceitos
- Tipos: Topic, Person, Organization, Location, Event, Concept, Tool, Project
- Extraído automaticamente via IA das notas
- Rastreia menções e confiança da extração

#### `Relation` - Relações do Grafo
- Tipos: MENTIONS, RELATED_TO, SIMILAR_TO, PART_OF, CONTAINS, etc.
- Conecta notas ↔ notas, entidades ↔ entidades, notas ↔ entidades
- Peso e confiança para cada relação

#### `Tag` - Tags de Categorização
- Tags estilo Obsidian (#tag)
- Contagem de uso e cores opcionais

#### `EmbeddingCache` - Cache de Embeddings
- Armazena vetores gerados localmente
- Permite busca semântica offline
- LRU cache com contagem de acesso

### 2. Serviços Core

#### `FileSystemProvider` - Ingestão de Arquivos
- Escaneia diretórios recursivamente
- Parse markdown com frontmatter YAML
- Extrai título, conteúdo, tags e links [[obsidian]]
- Detecta mudanças via checksum SHA-256
- Processamento incremental (só atualiza modificados)

#### `EmbeddingService` - Embeddings Locais
- Usa **Xenova Transformers** (modelo: `all-MiniLM-L6-v2`)
- 384 dimensões, quantizado para performance
- Cache automático no banco
- Similaridade de cosseno para busca semântica
- Batch processing para eficiência

#### `GraphEngine` - Motor de Grafo
- Constrói grafo completo (nodes + edges)
- SQLite-based (alternativa leve ao Neo4j)
- Estatísticas do grafo
- Busca de conexões entre notas
- Limpeza de relações órfãs

## 🏗️ Arquitetura Local-First

```
┌─────────────────────────────────────┐
│     Frontend (React - Futuro)       │
└──────────────┬──────────────────────┘
               │ REST API
┌──────────────┴──────────────────────┐
│     Express Server                  │
│  /notes, /graph, /search, /ingest   │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│     Services Layer                  │
│ ┌────────────┐ ┌─────────────────┐  │
│ │ FileSystem │ │  Graph Engine   │  │
│ │ Provider   │ │  (SQLite)       │  │
│ └────────────┘ └─────────────────┘  │
│ ┌────────────┐ ┌─────────────────┐  │
│ │ Embedding  │ │  Entity Extract │  │
│ │ Service    │ │  (Futuro)       │  │
│ └────────────┘ └─────────────────┘  │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│     TypeORM + SQLite                │
│  Notes, Entities, Relations, Tags   │
│  Embeddings (vectors)               │
└─────────────────────────────────────┘
```

## 📦 Dependências Adicionais Necessárias

```bash
npm install @xenova/transformers better-sqlite3
```

## 🔧 Configuração do Banco de Dados

Atualize `src/config/database.ts` para incluir as entities:

```typescript
import { Note, ConceptEntity, Relation, Tag, EmbeddingCache } from '@/models'

export const AppDataSource = new DataSource({
  // ... config existente
  entities: [
    Note,
    ConceptEntity,
    Relation,
    Tag,
    EmbeddingCache
  ],
  // ...
})
```

## 🚀 Scripts de Uso

### 1. Ingestão de Diretório

```bash
# Criar script de ingestão
npm run ingest ./path/to/notes
```

Exemplo de uso programático:

```typescript
import { FileSystemProvider } from './src/services/ingestion/FileSystemProvider'
import { getRepository } from 'typeorm'
import { Note, Tag } from './src/models'

const provider = new FileSystemProvider()
const files = await provider.scanDirectory('./my-notes')

for (const file of files) {
  const parsed = await provider.parseMarkdown(file.filePath)
  
  // Verifica se já existe
  const existing = await getRepository(Note).findOne({
    where: { filePath: file.filePath }
  })
  
  const changes = provider.detectChanges(existing?.checksum, file.checksum)
  
  if (changes.isNew || changes.hasChanged) {
    const note = getRepository(Note).create({
      slug: provider.generateSlug(file.filePath, parsed.title),
      title: parsed.title,
      content: parsed.content,
      source: NoteSource.FILESYSTEM,
      filePath: file.filePath,
      checksum: file.checksum,
      isProcessed: false
    })
    
    await getRepository(Note).save(note)
  }
}
```

### 2. Geração de Embeddings

```typescript
import { embeddingService } from './src/services/ai/EmbeddingService'
import { EmbeddingType } from './src/models/EmbeddingCache'

// Gera embedding para uma nota
const result = await embeddingService.generateEmbedding(
  noteContent,
  EmbeddingType.NOTE_CONTENT,
  noteId
)

console.log(`Vector dimensions: ${result.dimensions}`)
console.log(`Cached: ${result.cached}`)
```

### 3. Busca Semântica

```typescript
// Gera embedding da query
const queryEmbedding = await embeddingService.generateEmbedding(
  "machine learning algorithms",
  EmbeddingType.QUERY
)

// Encontra notas similares
const similar = await embeddingService.findSimilar(
  queryEmbedding.vector,
  EmbeddingType.NOTE_CONTENT,
  10 // top 10
)

console.log(similar) // [{ sourceId: '...', similarity: 0.89 }, ...]
```

### 4. Visualização do Grafo

```typescript
import { graphEngine } from './src/services/graph/GraphEngine'

// Constrói grafo completo
const graphData = await graphEngine.buildGraph()

console.log(`Nodes: ${graphData.nodes.length}`)
console.log(`Edges: ${graphData.edges.length}`)

// Estatísticas
const stats = await graphEngine.getStats()
console.log(stats)
```

## 🎯 Próximos Passos (Fase 2+)

### 1. Entity Extraction Service
- Usar Xenova para NER (Named Entity Recognition)
- Extrair pessoas, organizações, locais
- Classificar tipos de entidades automaticamente

### 2. Auto-Linker
- Sugerir links entre notas baseado em similaridade
- Detectar menções de títulos de outras notas
- Criar relações automáticas

### 3. API Routes
- `POST /api/ingest/filesystem` - Ingerir arquivos
- `GET /api/graph` - Obter dados do grafo
- `POST /api/search/semantic` - Busca semântica
- `GET /api/notes/:id/related` - Notas relacionadas

### 4. Frontend React
- Editor Monaco com preview
- Visualização do grafo (react-force-graph)
- Interface de chat Q&A

## 📊 Métricas de Performance Esperadas

| Operação | Tempo Alvo | Modo |
|----------|------------|------|
| Scan 100 files | < 5s | Local |
| Parse markdown | < 10ms | Local |
| Generate embedding | 50-100ms | Local (cached: <10ms) |
| Build graph (1000 nodes) | < 2s | Local |
| Semantic search | < 200ms | Local |
| Find connections | < 100ms | Local |

## 🔒 Privacidade e Offline

- ✅ Zero dados enviados para cloud (modo local)
- ✅ Embeddings gerados localmente
- ✅ Banco de dados SQLite local
- ✅ Funciona sem internet após setup inicial
- ✅ Download único do modelo (~80MB quantizado)

## 🛠️ Troubleshooting

### Modelo de Embedding não carrega
```bash
# Limpa cache do transformers
rm -rf ~/.cache/huggingface
# Reinicia o servidor
```

### Erro de memória ao gerar batch
```typescript
// Reduz batch size
const results = await embeddingService.generateBatch(texts, type)
// Internamente usa batchSize: 16, reduza para 8 se necessário
```

### Lentidão na primeira execução
- É normal: modelo está sendo baixado (~80MB)
- Execuções subsequentes usam cache
- Considere pré-baixar o modelo em produção

---

**Status**: ✅ Fase 1 Completa (Core Infrastructure)  
**Próximo**: Implementar API routes e Entity Extraction
