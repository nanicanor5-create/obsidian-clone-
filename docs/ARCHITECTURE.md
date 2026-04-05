# Arquitetura do Obsidian Clone

## Visão Geral da Arquitetura

O Obsidian Clone é construído com uma arquitetura em camadas que separa preocupações entre UI, API, lógica de negócio e IA.

```
┌─────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                 │
│  ┌────────────────────────────────────────────────┐ │
│  │ React Frontend + Monaco Editor                 │ │
│  │ - UI Components                                │ │
│  │ - State Management (Redux/Zustand)             │ │
│  │ - Real-time Updates (Socket.io)                │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         ▲
                         │ HTTP/WebSocket
                         ▼
┌─────────────────────────────────────────────────────┐
│                    API LAYER                        │
│  ┌────────────────────────────────────────────────┐ │
│  │ REST API / GraphQL                             │ │
│  │ - Authentication                               │ │
│  │ - Rate Limiting                                │ │
│  │ - Request Validation                           │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         ▲
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│               BUSINESS LOGIC LAYER                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │  Note Engine │  │ Graph Engine │  │ Search   │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ Link Manager │  │ Tag Manager  │  │ Export   │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────┘
                         ▲
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                 AI ENGINE LAYER                     │
│  ┌────────────────────────────────────────────────┐ │
│  │         Gemini CLI Orchestrator                │ │
│  │  ┌────────────────────────────────────────┐   │ │
│  │  │ AI Processors                          │   │ │
│  │  │ - Content Analyzer                     │   │ │
│  │  │ - Link Suggester                       │   │ │
│  │  │ - Tag Generator                        │   │ │
│  │  │ - Summarizer                           │   │ │
│  │  │ - Insight Generator                    │   │ │
│  │  └────────────────────────────────────────┘   │ │
│  │  ┌────────────────────────────────────────┐   │ │
│  │  │ Fallback Engines                       │   │ │
│  │  │ - Claude API                           │   │ │
│  │  │ - OpenAI API                           │   │ │
│  │  └────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         ▲
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│               PERSISTENCE LAYER                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ PostgreSQL   │  │ File Storage │  │ Vector   │  │
│  │ (Metadata)   │  │ (Notes)      │  │ DB       │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ Cache        │  │ Search Index │                │
│  │ (Redis)      │  │ (Elasticsearch)              │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
```

## Componentes Principais

### 1. Presentation Layer (Frontend)

**Stack**: React 18 + TypeScript + TailwindCSS

#### Componentes Principais
- `NoteEditor.tsx` - Editor de markdown com preview em tempo real
- `GraphView.tsx` - Visualização do grafo de notas
- `NoteList.tsx` - Lista de notas
- `SearchBar.tsx` - Busca inteligente
- `AIPanel.tsx` - Painel de sugestões da IA
- `SettingsPanel.tsx` - Configurações

#### State Management
- Redux/Zustand para gerenciar estado de notas
- WebSocket listeners para atualizações em tempo real

### 2. API Layer

**Stack**: Express.js + TypeScript

#### Rotas Principais

```
POST   /api/notes                 # Criar nova nota
GET    /api/notes/:id             # Buscar nota
PUT    /api/notes/:id             # Atualizar nota
DELETE /api/notes/:id             # Deletar nota
GET    /api/notes                 # Listar notas

GET    /api/graph                 # Buscar grafo
POST   /api/graph/analyze         # Analisar grafo com IA

GET    /api/search                # Busca inteligente
GET    /api/tags                  # Listar tags
GET    /api/backlinks/:id         # Buscar backlinks

POST   /api/ai/analyze            # Análise IA
POST   /api/ai/suggest-links      # Sugestões de link
POST   /api/ai/generate-summary   # Gerar sumário
POST   /api/ai/auto-tag           # Gerar tags

GET    /api/status                # Status do sistema
```

### 3. Business Logic Layer

#### 3.1 Note Engine
Responsável pelo gerenciamento de notas:
```typescript
interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  links: string[]  // IDs de notas relacionadas
  metadata: {
    wordCount: number
    readingTime: number
    importance: number
  }
}
```

#### 3.2 Graph Engine
Estrutura de grafo para conectar notas:
```typescript
interface Graph {
  nodes: Note[]
  edges: Link[]
  getNeighbors(noteId: string): Note[]
  getCommonNeighbors(noteId1: string, noteId2: string): Note[]
  calculateSimilarity(noteId1: string, noteId2: string): number
}
```

#### 3.3 Link Manager
Gerencia relacionamentos bidirecionais:
- Cria links entre notas
- Mantém índice de backlinks
- Detecta ciclos
- Sugere novas conexões

#### 3.4 Search Engine
Implementa busca multi-índice:
- Busca por texto (Elasticsearch)
- Busca por tags
- Busca semântica (embeddings vetoriais)
- Busca por conexões no grafo

### 4. AI Engine Layer

Este é o coração inteligente do sistema. Similar ao Paperclip AI, ele é **autônomo** e **auto-dirigido**.

#### 4.1 Gemini CLI Orchestrator

O Gemini CLI é o motor central que:

1. **Monitora eventos** do sistema
2. **Analisa notas** conforme são criadas/atualizadas
3. **Toma decisões** sobre ações a executar
4. **Executa ações** via APIs
5. **Itera** e melhora resultados

```typescript
interface AIOrchestrator {
  // Processamento autônomo
  processNoteAutonomously(noteId: string): Promise<AIResult>
  
  // Análise em lote
  analyzeNewNotes(): Promise<Analysis[]>
  
  // Decision making
  shouldCreateLink(noteId1: string, noteId2: string): Promise<boolean>
  suggestActions(noteId: string): Promise<Action[]>
  
  // Execução de ações
  executeAction(action: Action): Promise<void>
}
```

#### 4.2 AI Processors

**ContentAnalyzer**
- Extrai conceitos principais
- Identifica entidades nomeadas
- Analisa sentimento
- Calcula relevância

**LinkSuggester**
- Encontra notas relacionadas
- Sugere conexões ocultas
- Aprende de padrões de user

**TagGenerator**
- Cria tags relevantes
- Organiza hierarquicamente
- Aprende taxonomia

**Summarizer**
- Cria sumários executivos
- Extrai insights chave
- Gera títulos automáticos

**InsightGenerator**
- Identifica padrões
- Sugere análises
- Propõe questões interessantes

#### 4.3 Interface com Gemini CLI

```bash
# Executar análise autônoma
gemini-cli analyze --note-id=uuid --recursive

# Processar lote
gemini-cli process-batch --limit=100

# Treinar modelo customizado
gemini-cli train --dataset=notes --output=model

# Executar pipeline
gemini-cli exec-pipeline --name=daily-analysis
```

#### 4.4 Fallback Engines

Se Gemini falhar:
- **Claude API**: Para análises complexas
- **OpenAI API**: Para tarefas criativas
- **Local Models**: Para processamento offline

### 5. Persistence Layer

#### 5.1 PostgreSQL
Armazena:
- Metadados de notas (títulos, tags, timestamps)
- Informações de relacionamentos
- Índices do grafo
- Histórico de alterações

Esquema:
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID NOT NULL,
  folder_id UUID
);

CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  note_id UUID REFERENCES notes(id)
);

CREATE TABLE links (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES notes(id),
  target_id UUID REFERENCES notes(id),
  link_type VARCHAR(50),  -- "manual", "auto", "suggested"
  confidence FLOAT,
  created_at TIMESTAMP
);

CREATE TABLE ai_analysis (
  id UUID PRIMARY KEY,
  note_id UUID REFERENCES notes(id),
  processor_name VARCHAR(100),
  result JSONB,
  confidence FLOAT,
  created_at TIMESTAMP
);
```

#### 5.2 File Storage
- Armazena arquivos markdown raw
- Versionamento + Git integration
- Backup automático

#### 5.3 Vector Database
- Armazena embeddings de notas
- Busca semântica rápida
- Clustering automático

#### 5.4 Cache (Redis)
- Cache de queries
- Sessões de user
- Task queues (Bull)

## Fluxos de Dados

### Fluxo de Criação de Nota

```
1. User digita nota e clica "Save"
   │
2. Frontend envia POST /api/notes
   │
3. NoteEngine salva em DB
   │
4. Emite evento "noteCreated"
   │
5. AIOrchestrator captura evento
   │
6. Gemini CLI analisa conteúdo (autonomous)
   │
7. Extrai tags, encontra links, cria sumário
   │
8. Atualiza Elasticsearch + Vector DB
   │
9. Emite eventos WebSocket para UI
   │
10. UI atualiza em tempo real
```

### Fluxo de Análise Autônoma

```
┌─ Scheduler (a cada 30 min)
│
├─ AIOrchestrator.analyzeNewNotes()
│
├─ Para cada nota nova:
│  ├─ Gemini CLI: analyze --note-id=X
│  ├─ Extrai conceitos
│  ├─ Busca notas relacionadas
│  ├─ Valida sugestões
│  └─ Executa ações aprovadas
│
├─ Atualiza metadados
│
├─ Busca por padrões (clustering)
│
└─ Gera insights para "AI Panel"
```

### Fluxo de Busca

```
User digita query
   │
├─ Busca exata em Elasticsearch
├─ Busca semântica em Vector DB
├─ Busca em grafo (pagerank)
│
└─ Merge + Score + Rank (usagemini para ML ranking)
```

## Padrões de Design

### 1. Observer Pattern
- Notas notificam quando alteradas
- UI e AI Engine escutam eventos

### 2. Strategy Pattern
- Múltiplas estratégias de IA (Gemini, Claude, etc)
- Fallback automático

### 3. Repository Pattern
- Abstração de data access
- Facilita testes

### 4. Command Pattern
- Ações executadas via orquestrador
- Histórico de ações
- Undo/Redo

### 5. Factory Pattern
- Criação de processadores IA
- Seleção dinâmica de backend

## Escalabilidade

### Horizontal Scaling

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│Frontend │────>│  Load   │────>│Backend  │
│Instances│     │Balancer │     │Instances│
└─────────┘     └─────────┘     └─────────┘
                      ▲
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼───┐    ┌────▼───┐    ┌───▼────┐
   │Instance1    │Instance2    │Instance3│
   │ AI Engine   │ AI Engine   │API Only │
   └─────────┘    └─────────┘    └────────┘
```

### Vertical Scaling

- Task queues para processamento assíncrono
- Worker threads para análise paralela
- Caching agressivo

## Segurança

- API Key management para Gemini/Claude
- Autenticação JWT
- Rate limiting
- Input validation
- SQL injection prevention
- CORS configurado
- Encryption at rest

---

**Veja também**:
- [AI_ENGINE.md](./AI_ENGINE.md) - Detalhes do motor de IA
- [API.md](./API.md) - Referência da API
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Setup de desenvolvimento
