# Development Guide

Guia completo para desenvolvedores que querem contribuir ao projeto.

## Índice

1. [Configuração Local](#configuração-local)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estrutura do Código](#estrutura-do-código)
4. [Conventions & Standards](#conventions--standards)
5. [Workflow de Desenvolvimento](#workflow-de-desenvolvimento)
6. [Testes](#testes)
7. [Debugging](#debugging)
8. [Deployment](#deployment)

---

## Configuração Local

### 1. Pré-requisitos

```bash
# Verificar versões
node --version  # v18.0.0+
npm --version   # v8.0.0+
git --version
docker --version  # para containers
```

### 2. Fork & Clone

```bash
# Fork no GitHub, depois:
git clone https://github.com/seu-user/obsidian-clone-.git
cd obsidian-clone-

# Adicionar upstream para sincronizar com main
git remote add upstream https://github.com/original-owner/obsidian-clone-.git
```

### 3. Setup Inicial

```bash
# Instalar dependências
npm install

# Setup git hooks (pre-commit, pre-push)
npm run prepare

# Configurar .env
cp .env.example .env
# Edite .env com suas credentials

# Iniciar serviços complementares
docker-compose up -d

# Rodar migrações
npm run migrate:up

# Seed dados de desenvolvimento
npm run seed:dev
```

### 4. Iniciar Servidor

```bash
# Terminal 1: Backend + AI Engine
npm run dev

# Terminal 2 (opcional): Frontend em dev separado
cd frontend && npm run dev
```

Acesse:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- API Docs: http://localhost:3000/docs

---

## Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5+
- **Web Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Search**: Elasticsearch 8+
- **Vector DB**: Pinecone/Weaviate
- **Task Queue**: Bull (Redis-backed)
- **Authentication**: JWT + bcrypt
- **Logging**: Pino + Morgan
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite 4+
- **Styling**: TailwindCSS 3+
- **State Management**: Zustand/Redux
- **Markdown**: Monaco Editor + react-markdown
- **Graph Visualization**: D3.js / Cytoscape.js
- **API Client**: Axios + React Query
- **Real-time**: Socket.io-client

### AI & ML
- **Primary**: Google Generative AI (Gemini)
- **Fallback**: Anthropic Claude, OpenAI GPT
- **Embeddings**: OpenAI/Gemini embeddings
- **ML Framework**: TensorFlow.js (optional, para local models)

### DevOps
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (production)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

---

## Estrutura do Código

```
obsidian-clone-/
│
├── src/
│   ├── index.ts                    # Entry point
│   ├── server.ts                   # Express setup
│   ├── config/
│   │   ├── env.ts                  # Environment variables
│   │   ├── database.ts             # DB connection
│   │   └── redis.ts                # Redis cache
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.ts             # Auth endpoints
│   │   │   ├── notes.ts            # Note CRUD
│   │   │   ├── graph.ts            # Graph endpoints
│   │   │   ├── search.ts           # Search endpoints
│   │   │   └── ai.ts               # AI endpoints
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT verification
│   │   │   ├── errorHandler.ts     # Error handling
│   │   │   └── rateLimit.ts        # Rate limiting
│   │   │
│   │   └── validators/
│   │       ├── note.ts             # Note schema validation
│   │       ├── auth.ts             # Auth schema validation
│   │       └── ai.ts               # AI input validation
│   │
│   ├── services/
│   │   ├── noteService.ts          # Note business logic
│   │   ├── graphService.ts         # Graph algorithms
│   │   ├── searchService.ts        # Multi-index search
│   │   ├── tagService.ts           # Tag management
│   │   ├── authService.ts          # Authentication
│   │   └── aiService.ts            # AI orchestration
│   │
│   ├── models/
│   │   ├── Note.ts                 # TypeORM entities
│   │   ├── User.ts
│   │   ├── Link.ts
│   │   ├── Tag.ts
│   │   └── AIAnalysis.ts
│   │
│   ├── ai/
│   │   ├── orchestrator.ts         # AI controller
│   │   │
│   │   ├── processors/             # AI analyzers
│   │   │   ├── analyzer.ts
│   │   │   ├── linkSuggester.ts
│   │   │   ├── tagGenerator.ts
│   │   │   ├── summarizer.ts
│   │   │   └── insightGenerator.ts
│   │   │
│   │   ├── engines/                # AI backends
│   │   │   ├── gemini.ts
│   │   │   ├── claude.ts
│   │   │   ├── openai.ts
│   │   │   └── engine.interface.ts
│   │   │
│   │   ├── prompts/                # Templates de prompts
│   │   │   ├── analyzer.prompts.ts
│   │   │   ├── linker.prompts.ts
│   │   │   └── tagger.prompts.ts
│   │   │
│   │   ├── queue/                  # Job processing
│   │   │   ├── aiQueue.ts
│   │   │   └── workers.ts
│   │   │
│   │   └── memory/                 # Learning system
│   │       ├── aiMemory.ts
│   │       └── feedbackLoop.ts
│   │
│   ├── utils/
│   │   ├── logger.ts               # Logging setup
│   │   ├── validators.ts           # Helper validators
│   │   ├── embeddings.ts           # Vector conversion
│   │   ├── cache.ts                # Cache helpers
│   │   └── errors.ts               # Custom error classes
│   │
│   └── types/
│       ├── index.ts                # Global types
│       ├── note.ts
│       ├── user.ts
│       ├── ai.ts
│       └── shared.ts
│
├── frontend/                       # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── GraphView.tsx
│   │   │   ├── SearchBox.tsx
│   │   │   ├── AIPanel.tsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── NotePage.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/
│   │   │   ├── useNotes.ts
│   │   │   ├── useGraph.ts
│   │   │   └── useAI.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── socket.ts
│   │   ├── store/                  # State management
│   │   │   ├── notes.store.ts
│   │   │   └── ui.store.ts
│   │   └── App.tsx
│   └── package.json
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── utils/
│   │   └── ai/
│   ├── integration/
│   │   ├── api.spec.ts
│   │   ├── ai.integration.spec.ts
│   │   └── database.spec.ts
│   ├── e2e/
│   │   ├── notes.e2e.spec.ts
│   │   └── aiFlow.e2e.spec.ts
│   └── fixtures/
│       ├── notes.fixture.ts
│       └── users.fixture.ts
│
├── config/
│   ├── ai-engine.config.ts         # IA configuration
│   ├── database.config.ts
│   ├── redis.config.ts
│   └── logger.config.ts
│
├── scripts/
│   ├── migrate.ts                  # DB migrations
│   ├── seed.ts                     # Seed data
│   ├── train-embeddings.ts         # ML training
│   └── backup.sh                   # Database backup
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  # CI pipeline
│   │   ├── deploy.yml              # Deploy pipeline
│   │   └── codeql.yml              # Security scan
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── docker/
│   ├── Dockerfile                  # Backend image
│   ├── Dockerfile.frontend         # Frontend image
│   └── docker-compose.yml
│
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── README.md
└── docs/
    ├── ARCHITECTURE.md
    ├── AI_ENGINE.md
    ├── API.md
    ├── DEVELOPMENT.md (este arquivo)
    └── GETTING_STARTED.md
```

---

## Conventions & Standards

### Code Style

```bash
# Format código
npm run format

# Lint + fix
npm run lint:fix
```

#### TypeScript

```typescript
// ✅ Sempre use tipos explícitos
interface Note {
  id: string
  title: string
  content: string
}

async function createNote(data: Note): Promise<Note> {
  // ...
}

// ✅ Use enums para constantes
enum ProcessorType {
  ANALYZER = 'analyzer',
  LINK_SUGGESTER = 'link_suggester',
}

// ✅ Evite "any"
const data: any = {} // ❌ NÃO FAÇA ISTO

// ✅ Use union types
type Status = 'pending' | 'processing' | 'completed'
```

#### Nomes

```typescript
// Services: Service suffix
class NoteService {}
class GraphService {}

// Providers: Provider suffix
class GeminiProvider {}
class ClaudeProvider {}

// Interfaces: I prefix (opcional)
interface IProcesssor {}
type Processor = {} // Ou use type

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3
const DEFAULT_TIMEOUT = 1000

// Variables/Functions: camelCase
const maxRetries = 3
function getUserById(id: string) {}

// Classes: PascalCase
class NoteAnalyzer {}
```

### Arquitetura por Camadas

```
HTTP Request
    ↓
[API Route / Controller]
    ↓
[Service / Business Logic]
    ↓
[Repository / Data Access]
    ↓
[Database / Cache]
```

```typescript
// ✅ BOM: Separação clara de responsabilidades

// Route (apenas HTTP)
router.post('/notes', async (req, res) => {
  const note = await noteService.createNote(req.body)
  res.json(note)
})

// Service (lógica de negócio)
class NoteService {
  async createNote(data: CreateNoteDto): Promise<Note> {
    const note = new Note(data)
    return this.noteRepository.save(note)
  }
}

// Repository (acesso a dados)
class NoteRepository {
  async save(note: Note): Promise<Note> {
    return db.notes.create(note)
  }
}
```

---

## Workflow de Desenvolvimento

### Criar Feature

```bash
# 1. Sync com main
git fetch upstream
git rebase upstream/main

# 2. Criar branch
git checkout -b feat/auto-linking
# Ou: git checkout -b fix/link-parsing

# 3. Fazer changes
# Seguir conventions acima

# 4. Commit (conventional commits)
git commit -m "feat: implement auto-linking based on concepts"
# Tipos: feat, fix, docs, style, refactor, perf, test

# 5. Push
git push origin feat/auto-linking

# 6. Criar PR no GitHub
# Template será preenchido automaticamente
```

### Conventional Commits

```
feat(ai): add concept-based link suggestions
fix(search): resolve elasticsearch timeout
docs: update API documentation
style: format code with prettier
refactor(core): extract graph algorithms
perf: optimize embedding generation
test(ai): add processor unit tests
chore: update dependencies
```

### Commit Message

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Exemplo**:
```
feat(ai): implement auto-linking processor

- Extract concepts from notes using Gemini
- Compare with existing notes
- Suggest links with confidence > 0.7
- Store suggestions in database

Fixes #123
Related to #456
```

---

## Testes

### Setup

```bash
# Instalar dependências de teste
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev supertest @types/supertest
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Rodando Testes

```bash
# Todos os testes
npm run test

# Watch mode
npm run test:watch

# Com coverage
npm run test:coverage

# Apenas unit tests
npm run test:unit

# Apenas integration
npm run test:integration

# Apenas E2E
npm run test:e2e
```

### Unit Test Example

```typescript
// tests/unit/services/noteService.spec.ts

import { NoteService } from '@/services/noteService'
import { noteRepository } from '@/repositories/noteRepository'

jest.mock('@/repositories/noteRepository')

describe('NoteService', () => {
  let service: NoteService

  beforeEach(() => {
    service = new NoteService(noteRepository)
    jest.clearAllMocks()
  })

  describe('createNote', () => {
    it('should create a note with valid data', async () => {
      const input = {
        title: 'Test Note',
        content: 'Content here'
      }

      const mockNote = { id: '1', ...input, createdAt: new Date() }
      noteRepository.save.mockResolvedValue(mockNote)

      const result = await service.createNote(input)

      expect(result).toEqual(mockNote)
      expect(noteRepository.save).toHaveBeenCalledWith(expect.objectContaining(input))
    })

    it('should throw error if title is empty', async () => {
      const input = { title: '', content: 'Content' }

      await expect(service.createNote(input)).rejects.toThrow('Title required')
    })
  })
})
```

### Integration Test Example

```typescript
// tests/integration/api.spec.ts

import request from 'supertest'
import { app } from '@/server'

describe('Notes API', () => {
  let token: string

  beforeAll(async () => {
    // Login and get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
    token = res.body.token
  })

  describe('POST /api/notes', () => {
    it('should create a note', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test',
          content: 'Content'
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.title).toBe('Test')
    })
  })
})
```

---

## Debugging

### VSCode Debug Config

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "API Server",
      "program": "${workspaceFolder}/src/server.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "AI Engine",
      "program": "${workspaceFolder}/src/ai/orchestrator.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Logging

```typescript
import { logger } from '@/utils/logger'

logger.debug('Detailed debug info', { data })
logger.info('Operation successful', { noteId, duration })
logger.warn('Unusual condition', { retry, attempt })
logger.error('Error occurred', { error, stack })
```

### Inspecionar AI Decisions

```typescript
// Habilitar logs detalhados da IA
process.env.AI_DEBUG = 'true'

// Verificar logs
tail -f logs/ai-engine.log | grep "DECISION"
```

---

## Deployment

### Build

```bash
# Build TypeScript
npm run build

# Resultado em ./dist/
```

### Docker

```bash
# Build imagem
docker build -t obsidian-clone:latest .

# Root localmente
docker run -p 3000:3000 --env-file .env obsidian-clone:latest
```

### GitHub Actions CI/CD

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm install
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Production Checklist

- [ ] Build passa em CI
- [ ] Coverage > 80%
- [ ] Sem warnings (console.log, TODO comments)
- [ ] Secrets não estão no código
- [ ] Migrations estão preparadas
- [ ] .env no servidor configurado
- [ ] Logs configurados
- [ ] Monitoring ativo
- [ ] Plano de rollback pronto

---

## Resources

- [Express.js Docs](https://expressjs.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Perguntas?** Abra uma issue ou entre em contato.

**Quer contribuir?** Veja [CONTRIBUTING.md](../CONTRIBUTING.md) (quando criado)
