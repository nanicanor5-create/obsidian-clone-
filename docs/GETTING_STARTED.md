# Getting Started - Guia de Início Rápido

## Pré-requisitos

- **Node.js**: 18.0.0+
- **npm** ou **yarn**: 8.0.0+
- **Docker**: (opcional, para PostgreSQL)
- **Git**: para versionamento
- **API Keys**:
  - [Google Gemini API](https://cloud.google.com/docs/generative-ai)
  - [Claude API](https://www.anthropic.com/) (opcional)
  - [OpenAI API](https://openai.com) (opcional)

## 1. Clonar e Instalar

```bash
# Clone o repositório
git clone https://github.com/seu-user/obsidian-clone-.git
cd obsidian-clone-

# Instale as dependências
npm install

# Ou, se preferir yarn
yarn install
```

## 2. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env
nano .env
```

### Configuração Completa de .env

```env
# ========== APLICAÇÃO ==========
NODE_ENV=development
PORT=3000
HOST=localhost

# ========== BANCO DE DADOS ==========
DATABASE_URL=postgresql://user:password@localhost:5432/obsidian-clone
DATABASE_POOL_SIZE=10

# ========== GEMINI AI ==========
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro
GEMINI_MAX_TOKENS=2048
GEMINI_TEMPERATURE=0.7

# ========== FALLBACK ENGINES ==========
# Claude
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-sonnet-20240229

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# ========== VECTOR DATABASE ==========
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_ENVIRONMENT=us-west1
PINECONE_INDEX=obsidian-notes

# ========== ELASTICSEARCH ==========
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=notes

# ========== REDIS (Cache & Jobs) ==========
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# ========== JWT & SEGURANÇA ==========
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRATION=7d
BCRYPT_ROUNDS=10

# ========== AI ENGINE ==========
AI_UPDATE_INTERVAL=1800000  # 30 minutos em ms
AI_CONFIDENCE_THRESHOLD=0.65
AI_AUTO_LINK_ENABLED=true
AI_AUTO_TAG_ENABLED=false
AI_INSIGHT_GENERATION_ENABLED=true

# ========== LOGGING ==========
LOG_LEVEL=info
LOG_FORMAT=json

# ========== CORS ==========
CORS_ORIGIN=http://localhost:3000

# ========== FILE STORAGE ==========
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB

# ========== FRONTEND ==========
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

## 3. Setup do Banco de Dados

### Opção A: Usar Docker Compose

```bash
# Criar docker-compose.yml com PostgreSQL, Redis, Elasticsearch
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: obsidian-clone
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

volumes:
  postgres-data:
  elasticsearch-data:
EOF

# Inicie os serviços
docker-compose up -d
```

### Opção B: Instalação Local

```bash
# PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
# Windows: https://www.postgresql.org/download/windows/

# Redis
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server
# Windows: https://github.com/microsoftarchive/redis/releases

# Elasticsearch
# https://www.elastic.co/downloads/elasticsearch
```

### Rodar Migrações

```bash
# Criar tabelas
npm run migrate:up

# Seed inicial (opcional)
npm run seed:dev
```

## 4. Obtener API Keys

### Google Gemini API

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto
3. Ative a "Generative AI API"
4. Crie uma credencial (API Key)
5. Adicione a chave ao `.env`

```bash
GEMINI_API_KEY=AIzaSyD...
```

### Claude API (Anthropic)

1. Acesse [Anthropic Console](https://console.anthropic.com)
2. Crie uma account
3. Gere uma API key
4. Adicione ao `.env`

```bash
CLAUDE_API_KEY=sk-ant-...
```

### OpenAI API

1. Crie conta em [OpenAI](https://platform.openai.com)
2. Gere uma API key
3. Adicione ao `.env`

```bash
OPENAI_API_KEY=sk-...
```

## 5. Iniciar Servidor de Desenvolvimento

```bash
# Start backend + AI engine
npm run dev

# Ou em separado:
# Terminal 1: Backend API
npm run dev:api

# Terminal 2: AI Engine
npm run dev:ai

# Terminal 3: Frontend (se necessário)
npm run dev:frontend
```

Acesse:
- **API**: http://localhost:3000
- **Frontend**: http://localhost:5173 (se usando Vite)
- **Documentação**: http://localhost:3000/docs

## 6. Verificar que Tudo Funciona

```bash
# Health check
curl http://localhost:3000/api/status

# Response esperada:
# {
#   "status": "ok",
#   "timestamp": "2025-04-05T10:30:00Z",
#   "database": "connected",
#   "redis": "connected",
#   "gemini": "ready",
#   "version": "0.1.0"
# }
```

## 7. Criar Primeira Nota

### Via API

```bash
# Create note
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Minha Primeira Nota",
    "content": "# Olá\n\nEsta é a primeira nota. O sistema de IA vai analisar e criar links automaticamente!"
  }'

# Response:
# {
#   "id": "uuid-xxxxx",
#   "title": "Minha Primeira Nota",
#   "content": "...",
#   "createdAt": "2025-04-05T10:30:00Z"
# }
```

### Via Frontend (em desenvolvimento)

```bash
# Abra http://localhost:5173
# Clique em "New Note"
# Digite conteúdo
# Clique "Save"
# Observe a IA analisando e criando sugestões!
```

## 8. Observar Motor de IA

### Logs da IA

```bash
# Terminal onde rodando npm run dev
# Veja logs como:

[AI] Analyzing note: 'Minha Primeira Nota'
[AI] Found 3 concepts: AI, Learning, Productivity
[AI] Suggesting 2 links with confidence > 0.7
[AI] Generating tags automatically...
[AI] Analysis complete in 234ms
```

### Dashboard

```bash
# Abra http://localhost:3000/ai-dashboard
# Veja:
# - Actions/hour
# - Approval rate
# - Processing queue
# - Recent AI decisions
```

## 9. Configurações Importantes para IA

### Arquivo: `config/ai-engine.config.js`

```javascript
module.exports = {
  // Automação
  autoLink: {
    enabled: true,
    confidenceThreshold: 0.75,
    maxLinks: 5
  },
  
  autoTag: {
    enabled: false,  // Desabilitar enquanto ajusta
    confidenceThreshold: 0.80
  },
  
  // Processamento
  processingInterval: 30 * 60 * 1000,  // 30 min
  maxParallelTasks: 5,
  
  // Modelos
  primaryModel: 'gemini',  // 'gemini' | 'claude' | 'openai'
  fallbackModels: ['claude', 'openai'],
  
  // Aprendizado
  enableLearningLoop: true,
  feedbackWindow: 24 * 60 * 60 * 1000
}
```

## 10. Troubleshooting

### Problema: "GEMINI_API_KEY not found"

```bash
# Verificar .env
cat .env | grep GEMINI

# Se estiver vazio:
# 1. Obtenha a chave em https://console.cloud.google.com
# 2. Adicione ao .env
# 3. Reinicie: npm run dev
```

### Problema: "PostgreSQL connection refused"

```bash
# Se usando Docker:
docker-compose ps
# Se não estiver running: docker-compose up -d postgres

# Se local:
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql
# Windows: Services > PostgreSQL > Start
```

### Problema: "Redis connection failed"

```bash
# Se usando Docker:
docker-compose up -d redis

# Se local:
# macOS: brew services start redis
# Ubuntu: sudo systemctl start redis-server
# Windows: redis-server.exe
```

### Problema: "Erro 429 - Rate limit Gemini"

```bash
# Aumentar interval entre processamentos
AI_UPDATE_INTERVAL=3600000  # 1 hora em vez de 30 min

# Ou usar batch processing
npx ts-node ./ai-engine/batch-process.ts --limit=10
```

## 11. Próximos Passos

1. ✅ **Setup Completo**: Vocêfez tudo acima
2. 📝 **Criar Notas**: Comece a adicionar conteúdo
3. 🤖 **Configurar IA**: Ajuste confidence thresholds
4. 📚 **Ler Documentação**: Veja [ARCHITECTURE.md](./ARCHITECTURE.md) e [AI_ENGINE.md](./AI_ENGINE.md)
5. 🧪 **Testar**: Execute `npm run test`
6. 📦 **Deploy**: Veja instruções em [DEVELOPMENT.md](./DEVELOPMENT.md)

## 12. Estrutura do Projeto

```
obsidian-clone-/
├── src/
│   ├── server.ts              # Server principal
│   ├── api/                   # Routes da API
│   │   ├── notes.ts
│   │   ├── graph.ts
│   │   └── ai.ts
│   ├── services/              # Lógica de negócio
│   │   ├── noteService.ts
│   │   ├── graphService.ts
│   │   └── aiService.ts
│   ├── models/                # Database models
│   │   ├── Note.ts
│   │   ├── Link.ts
│   │   └── Tag.ts
│   ├── ai/                    # Motor de IA
│   │   ├── orchestrator.ts    # Controlador principal
│   │   ├── processors/        # Analisadores
│   │   │   ├── analyzer.ts
│   │   │   ├── linkSuggester.ts
│   │   │   └── tagGenerator.ts
│   │   └── engines/           # Backends de IA
│   │       ├── gemini.ts
│   │       ├── claude.ts
│   │       └── openai.ts
│   └── utils/                 # Utilitários
│
├── frontend/                  # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   └── package.json
│
├── tests/                     # Testes
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/                      # Documentação
│   ├── ARCHITECTURE.md
│   ├── AI_ENGINE.md
│   ├── API.md
│   └── DEVELOPMENT.md
│
├── config/                    # Configurações
│   ├── ai-engine.config.js
│   └── database.config.js
│
├── setup/                     # Setup scripts
│   └── migrations/
│
├── .env.example               # Template de env
├── package.json
├── tsconfig.json
├── docker-compose.yml         # Local development
└── README.md
```

## 13. Recursos Úteis

- 📖 [Google Generative AI Docs](https://ai.google.dev/docs)
- 🤖 [Anthropic Claude Docs](https://docs.anthropic.com/)
- 🚀 [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- 🔗 [Express.js Guide](https://expressjs.com)
- ⚛️ [React Documentation](https://react.dev)

---

**Pronto para começar!** 🎉

Qualquer dúvida, abra uma issue no GitHub ou consulte os docs.
