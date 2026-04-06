# 🚀 Knowledge Nexus Clone - AI-Powered Note Taking System (MVP)

Um sistema de gerenciamento de conhecimento **local-first** inspirado no [Knowledge Nexus](https://github.com/Jallermax/knowledge-nexus) e no Obsidian, com integração nativa de IA baseada em **Modelos Locais Leves (Xenova Transformers)** e **Gemini CLI**, permitindo que o sistema execute ações autônomas para análise, geração de conteúdo e automação de fluxo de trabalho, **100% privado e offline**.

## 🎯 Conceitos do Knowledge Nexus Integrados

Este MVP faz engenharia reversa dos principais conceitos do Knowledge Nexus:

| Knowledge Nexus (Python) | Nosso MVP (TypeScript/Node) | Status |
|--------------------------|----------------------------|--------|
| Neo4j Graph DB | **SQLite + TypeORM Relations** | ✅ |
| OpenAI API | **Xenova Transformers (Local)** | ✅ |
| Streamlit UI | **REST API + Futuro React** | 🚧 |
| LangChain | **Orquestrador Próprio** | ✅ |
| Notion Provider | **FileSystem + Notion (Futuro)** | ✅/🚧 |
| FS Cache | **EmbeddingCache Entity** | ✅ |
| spaCy NER | **Xenova NER (Futuro)** | 🚧 |
| Python | **Node.js/TypeScript** | ✅ |

## ✨ Diferenciais vs Knowledge Nexus Original

| Feature | Knowledge Nexus | Nosso MVP |
|---------|----------------|-----------|
| Runtime | Python | **Node.js/TS** |
| IA | OpenAI only | **Local-first + Cloud fallback** |
| Graph DB | Neo4j required | **SQLite OR Neo4j** |
| Offline | ❌ Requires API | **✅ 100% offline capable** |
| Privacy | Sends to OpenAI | **Zero data out (local mode)** |
| Speed | ~1-2s/op | **~50-100ms/op (local)** |
| UI | Streamlit | **REST API + React (futuro)** |
| Real-time | ❌ | **✅ Socket.io ready** |
| Setup | Complex | **npm install + run** |

## 📦 MVP Scope - Funcionalidades Implementadas

### ✅ Fase 1: Core Infrastructure

#### Modelos de Dados
- **Note**: Notas com suporte a múltiplas fontes (FS, Notion, Web)
- **ConceptEntity**: Entidades/conceitos extraídos (Topic, Person, Organization, etc.)
- **Relation**: Relações entre entidades (MENTIONS, RELATED_TO, SIMILAR_TO, etc.)
- **Tag**: Tags estilo Obsidian
- **EmbeddingCache**: Cache de vetores para busca semântica offline

#### Serviços
- **FileSystemProvider**: Ingestão de markdown com parse de frontmatter, tags e links
- **EmbeddingService**: Geração de embeddings locais com Xenova (384 dims, quantizado)
- **GraphEngine**: Construção e consulta do grafo de conhecimento

### 🚧 Fase 2: Em Desenvolvimento
- Entity Extraction (NER automático)
- Auto-Linker (sugestão de links entre notas)
- API Routes completas
- Frontend React

### 🔮 Fase 3: Futuro
- Notion Provider
- Web Scraper
- RAG Mechanism
- Chat Interface Q&A

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                 UI Frontend                          │
│            (React/Vue + Monaco Editor)               │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│            API Layer (REST/GraphQL)                 │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│     Core Engine                                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ Note System  │  │ Graph Engine │                 │
│  └──────────────┘  └──────────────┘                 │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ Ingestion    │  │ AI Engine    │                 │
│  │ (FileSystem) │  │ (Xenova)     │                 │
│  └──────────────┘  └──────────────┘                 │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│       Storage Layer                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  SQLite  │  │  File    │  │ Embedding│           │
│  │(TypeORM) │  │  Store   │  │  Cache   │           │
│  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Pré-requisitos
- Node.js >= 18.0.0
- npm >= 8.0.0

### Instalação

```bash
# Clone o repositório
git clone <repository>
cd obsidian-clone-

# Instale as dependências
npm install

# Configure variáveis de ambiente (opcional para modo local)
cp .env.example .env

# Inicie o servidor de desenvolvimento
npm run dev

# Acesse em http://localhost:3000
```

### Primeiro Uso - Ingestão de Notas

```typescript
import { FileSystemProvider } from './src/services/ingestion/FileSystemProvider'
import { embeddingService } from './src/services/ai/EmbeddingService'
import { graphEngine } from './src/services/graph/GraphEngine'

// 1. Escaneia diretório
const provider = new FileSystemProvider()
const files = await provider.scanDirectory('./my-notes')

// 2. Processa cada arquivo
for (const file of files) {
  const parsed = await provider.parseMarkdown(file.filePath)
  console.log(`Parsed: ${parsed.title}`)
}

// 3. Gera embeddings (primeira vez baixa o modelo ~80MB)
const embedding = await embeddingService.generateEmbedding(
  "Conteúdo da nota",
  EmbeddingType.NOTE_CONTENT,
  'note-id'
)

// 4. Visualiza grafo
const graph = await graphEngine.buildGraph()
console.log(`Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`)
```

## 📚 Documentação

| Documento | Propósito |
|-----------|-----------|
| [**MVP_PLAN.md**](./MVP_PLAN.md) | 📋 Plano completo do MVP |
| [**MVP_IMPLEMENTATION.md**](./docs/MVP_IMPLEMENTATION.md) | 🔧 Guia de implementação |
| [**QUICK_LOCAL_SETUP.md**](./docs/QUICK_LOCAL_SETUP.md) | ⚡ Setup em 5 minutos |
| [**LOCAL_MODELS.md**](./docs/LOCAL_MODELS.md) | 🤖 Modelos leves & arquitetura local-first |
| [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) | 🏗️ Arquitetura detalhada |
| [**AI_ENGINE.md**](./docs/AI_ENGINE.md) | ⚙️ Motor de IA e orquestração |
| [**API.md**](./docs/API.md) | 📖 Referência da API |

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5
- **Database**: SQLite (via TypeORM)
- **AI/Xenova**: @xenova/transformers (all-MiniLM-L6-v2)
- **Vector**: Embedding cache no SQLite
- **Server**: Express + Socket.io
- **Models**: TypeORM entities

## 📊 Métricas de Performance

| Operação | Tempo Alvo | Modo |
|----------|------------|------|
| Scan 100 files | < 5s | Local |
| Parse markdown | < 10ms | Local |
| Generate embedding | 50-100ms | Local (cached: <10ms) |
| Build graph (1000 nodes) | < 2s | Local |
| Semantic search | < 200ms | Local |

## 🔒 Privacidade e Offline

- ✅ Zero dados enviados para cloud (modo local)
- ✅ Embeddings gerados localmente
- ✅ Banco de dados SQLite local
- ✅ Funciona sem internet após setup inicial
- ✅ Download único do modelo (~80MB quantizado)

## 🤝 Contribuindo

Veja [DEVELOPMENT.md](./docs/DEVELOPMENT.md) para instruções de desenvolvimento.

## 📄 Licença

MIT

## 🙏 Agradecimentos

Inspirado por:
- [Knowledge Nexus](https://github.com/Jallermax/knowledge-nexus) - GraphRAG para Second Brain
- [Obsidian.md](https://obsidian.md) - Note taking baseado em markdown
- [Xenova Transformers](https://github.com/xenova/transformers.js) - ML no navegador/Node

---

**Status**: 🚧 MVP em Desenvolvimento (Fase 1 Completa)  
**Versão**: 0.2.0-mvp  
**Última Atualização**: 2025-04-05
