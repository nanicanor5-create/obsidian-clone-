# 🚀 MVP Plan: Knowledge Nexus + Obsidian Clone Integration

## Visão Geral

Criar um **MVP viável** que integra os melhores conceitos do [Knowledge Nexus](https://github.com/Jallermax/knowledge-nexus) com a arquitetura **local-first** e **IA autônoma** deste repositório.

## 🎯 Conceitos Chave do Knowledge Nexus (Engenharia Reversa)

### 1. **Pipeline de Ingestão Modular**
- ✅ Providers pluggáveis (Notion, Web, arquivos locais)
- ✅ Cache inteligente para evitar reprocessamento
- ✅ Processamento incremental (só atualiza páginas modificadas)

### 2. **GraphRAG Architecture**
- ✅ Extração de entidades via LLM
- ✅ Embeddings para busca semântica
- ✅ Grafo enriquecido com relações semânticas
- ✅ Query processor com contexto do grafo

### 3. **Neo4j como Graph Database**
- ✅ Nós: Page, Entity, Topic, Person
- ✅ Relações: MENTIONS, RELATED_TO, BELONGS_TO
- ✅ Queries Cypher para exploração

### 4. **Q&A Interface (Streamlit)**
- ✅ Chat interface com visualização do grafo
- ✅ RAG mechanism com contexto do grafo

## 🔧 Adaptação para Local-First & TypeScript

### Mudanças Principais:

| Knowledge Nexus (Python) | Nosso MVP (TypeScript/Node) |
|--------------------------|----------------------------|
| Neo4j | **Neo4j OU Better-SQLite3 com relations** |
| OpenAI API | **Gemini CLI + Modelos Locais (Xenova)** |
| Streamlit | **React + Socket.io real-time** |
| LangChain | **Orquestrador próprio leve** |
| Python spaCy | **Xenova Transformers (JS)** |
| FS Cache | **Better-SQLite3 + Redis opcional** |

## 📦 MVP Scope - Funcionalidades Essenciais

### Fase 1: Core Infrastructure (Semana 1-2)
- [x] Setup do projeto TypeScript
- [ ] Neo4j integration OU SQLite com graph relations
- [ ] Entity extraction com Xenova (local)
- [ ] Embedding generation local-first
- [ ] Basic graph construction

### Fase 2: Data Ingestion (Semana 2-3)
- [ ] File system watcher (markdown files)
- [ ] Notion API integration (opcional)
- [ ] Web scraper básico
- [ ] Incremental processing com cache

### Fase 3: AI Engine (Semana 3-4)
- [ ] Gemini CLI orchestrator
- [ ] Auto-linker baseado em embeddings
- [ ] Auto-tagger com classificação local
- [ ] Smart summarizer

### Fase 4: Query & Visualization (Semana 4-5)
- [ ] Semantic search API
- [ ] Graph visualization (React Force Graph)
- [ ] Q&A interface simples
- [ ] RAG mechanism básico

## 🏗️ Arquitetura do MVP

```
┌─────────────────────────────────────────────────────┐
│              Frontend (React + Monaco)               │
│         Editor + Graph Viz + Chat Interface          │
└──────────────────┬──────────────────────────────────┘
                   │ REST + WebSocket
┌──────────────────┴──────────────────────────────────┐
│              Express API Server                      │
│  /notes  /graph  /search  /ingest  /query           │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│              Core Services                           │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │IngestionSvc  │  │ GraphEngine  │                 │
│  │ - FileSystem │  │ - Neo4j/SQLite│                │
│  │ - Notion     │  │ - Embeddings │                 │
│  │ - Web        │  │ - Relations  │                 │
│  └──────────────┘  └──────────────┘                 │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│              AI Engine (Local-First)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │Xenova    │  │Gemini CLI│  │ RAG      │           │
│  │Embeddings│  │Orchestr. │  │Retriever │           │
│  └──────────┘  └──────────┘  └──────────┘           │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│              Storage Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │PostgreSQL│  │ Better-  │  │ Vector   │           │
│  │(metadata)│  │ SQLite   │  │ Index    │           │
│  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────┘
```

## 📊 Métricas de Sucesso do MVP

- ⚡ **Performance**: < 200ms para operações locais de IA
- 📈 **Precisão**: > 70% de acurácia em auto-links sugeridos
- 💾 **Offline**: 100% funcional sem internet
- 🔒 **Privacidade**: Zero dados enviados para cloud (modo local)
- 🎯 **Usabilidade**: Setup em < 10 minutos

## 🛠️ Stack Tecnológico do MVP

```json
{
  "runtime": "Node.js 18+",
  "language": "TypeScript 5",
  "database": ["PostgreSQL", "Better-SQLite3"],
  "graph": ["Neo4j (opcional)", "Custom graph in SQLite"],
  "ai": ["@xenova/transformers", "@google/generative-ai"],
  "vector": ["pgvector", "custom HNSW"],
  "frontend": "React 18 + Vite",
  "realtime": "Socket.io"
}
```

## 📁 Estrutura de Pastas Proposta

```
/workspace/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── notes.ts
│   │   │   ├── graph.ts
│   │   │   ├── search.ts
│   │   │   ├── ingest.ts
│   │   │   └── query.ts
│   │   └── middleware/
│   ├── services/
│   │   ├── ingestion/
│   │   │   ├── FileSystemProvider.ts
│   │   │   ├── NotionProvider.ts
│   │   │   └── WebScraper.ts
│   │   ├── graph/
│   │   │   ├── GraphEngine.ts
│   │   │   ├── Neo4jAdapter.ts
│   │   │   └── SQLiteGraphAdapter.ts
│   │   ├── ai/
│   │   │   ├── EntityExtractor.ts
│   │   │   ├── EmbeddingService.ts
│   │   │   ├── AutoLinker.ts
│   │   │   └── RAGRetriever.ts
│   │   └── storage/
│   │       ├── NoteRepository.ts
│   │       ├── EntityRepository.ts
│   │       └── VectorIndex.ts
│   ├── models/
│   │   ├── Note.ts
│   │   ├── Entity.ts
│   │   ├── Relation.ts
│   │   └── Topic.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── neo4j.ts
│   │   └── ai-engine.ts
│   └── utils/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   ├── GraphViz/
│   │   │   ├── ChatInterface/
│   │   │   └── SearchBar/
│   │   └── hooks/
├── docs/
├── tests/
└── scripts/
```

## 🚀 Quick Start do MVP

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env
# Editar .env (pode usar tudo local, sem APIs)

# 3. Iniciar Neo4j (opcional, usa SQLite se não tiver)
docker-compose up -d neo4j

# 4. Rodar migrações
npm run migrate:up

# 5. Ingestão inicial
npm run ingest ./my-notes

# 6. Iniciar servidor
npm run dev

# 7. Acessar http://localhost:3000
```

## 🎯 Diferenciais vs Knowledge Nexus Original

| Feature | Knowledge Nexus | Nosso MVP |
|---------|----------------|-----------|
| Runtime | Python | **Node.js/TS** |
| IA | OpenAI only | **Local-first + Cloud fallback** |
| Graph DB | Neo4j required | **Neo4j OR SQLite** |
| Offline | ❌ Requires API | **✅ 100% offline capable** |
| Privacy | Sends to OpenAI | **Zero data out (local mode)** |
| Speed | ~1-2s/op | **~50-100ms/op (local)** |
| UI | Streamlit | **React SPA moderna** |
| Real-time | ❌ | **✅ Socket.io** |

## ✅ Critérios de Aceitação do MVP

1. **Ingestão**: Conseguir ingerir 100+ notas markdown em < 1 minuto
2. **Grafo**: Visualizar grafo com 50+ nós e conexões
3. **Busca**: Buscar semanticamente e retornar resultados relevantes
4. **Auto-links**: Sugerir links entre notas com > 60% precisão
5. **Offline**: Funcionar completamente sem internet
6. **Setup**: Instalar e rodar em < 10 minutos

---

**Próximos Passos**: Implementar Fase 1 (Core Infrastructure)
