# 🚀 Obsidian Clone TURBO - MVP Ultra-Leve

**Sistema de anotações com grafo de conhecimento para PCs fracos**

> ⚡ **Rodando em PCs "carroça"** (2GB RAM, CPU dual-core, sem GPU)  
> 🤖 **IA Híbrida**: Local (regex) + Cloud (Gemini CLI grátis)  
> 📦 **Zero Bloat**: 9 dependências vs 50+ do plano original

---

## 🎯 Funcionalidades

- ✅ **Ingestão de Markdown** - Lê arquivos `.md` com tags `#` e links `[[ ]]`
- ✅ **Extração de Entidades** - Regex local (rápido) + Gemini CLI (preciso)
- ✅ **Auto-Linking** - Sugere conexões entre notas baseado em similaridade
- ✅ **Grafo de Conhecimento** - Visualize relações entre notas
- ✅ **Busca Full-Text** - Busca em títulos, conteúdo, tags e entidades
- ✅ **100% Offline** - Funciona sem internet (exceto Gemini CLI opcional)

---

## 🚀 Quick Start (3 Comandos)

```bash
# 1. Instalar dependências (leve!)
npm install

# 2. Copiar env
cp .env.example .env

# 3. Rodar em dev
npm run dev
```

Acesse: **http://localhost:3000**

---

## 📖 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/ingest` | Ingere notas de um diretório |
| `GET` | `/api/ingest/status` | Status da ingestão |
| `GET` | `/api/graph` | Retorna grafo completo |
| `GET` | `/api/graph/stats` | Estatísticas do grafo |
| `GET` | `/api/search?q=...` | Busca notas |
| `GET` | `/api/search/similar/:id` | Notas similares |

### Exemplo: Ingerir Notas

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"directory": "./minhas-notas"}'
```

### Exemplo: Buscar Notas

```bash
curl "http://localhost:3000/api/search?q=inteligência%20artificial"
```

---

## 🏗️ Arquitetura Turbo

```
┌─────────────────────────────────────┐
│         Frontend (futuro)           │
│      Preact + Sigma.js (<50KB)      │
└──────────────┬──────────────────────┘
               │ REST API
┌──────────────▼──────────────────────┐
│       Express Server (10MB)         │
│  /ingest  /graph  /search  /query   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Core Services                 │
│  ┌──────────┐  ┌─────────────────┐  │
│  │ Entity   │  │ AutoLinker      │  │
│  │Extractor │  │ (Similaridade)  │  │
│  │(Regex+AI)│  │ 100% local      │  │
│  └──────────┘  └─────────────────┘  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Better-SQLite3 (2MB, WAL mode)   │
│   Tables: notes, tags, entities,    │
│           relations, embeddings     │
└─────────────────────────────────────┘
```

---

## 📊 Performance (Meta PC Carroça)

| Métrica | Meta | Como? |
|---------|------|-------|
| RAM Idle | <30MB | Better-SQLite3 + lazy load |
| Startup | <1s | Zero ORM, SQL direto |
| Ingestão (1k notas) | <2s | Parallel processing |
| Busca | <50ms | Índices + cache |

---

## 🛠️ Stack Tecnológico

| Componente | Tecnologia | Por que? |
|------------|-----------|----------|
| Runtime | Node.js 18+ | DX bom, já temos |
| Database | Better-SQLite3 | 10x mais rápido que TypeORM |
| IA Local | Regex nativo | ~1ms, zero dependências |
| IA Cloud | Gemini CLI | Grátis, offload pesado |
| API | Express | Minimalista, funcional |

**Total deps:** 5 produção + 4 dev = **9 packages**

---

## 📁 Estrutura do Projeto

```
/workspace/
├── src/
│   ├── core/
│   │   └── database.ts        # Better-SQLite3 puro
│   ├── api/routes/
│   │   ├── ingest.ts          # POST /ingest
│   │   ├── graph.ts           # GET /graph
│   │   └── search.ts          # GET /search
│   ├── services/
│   │   ├── ai/
│   │   │   ├── EntityExtractor.ts  # Regex + Gemini
│   │   │   └── AutoLinker.ts       # Similaridade
│   │   └── ingestion/
│   │       └── FileSystemProvider.ts
│   └── server-turbo.ts        # Entry point
├── scripts/
├── package.json
└── README.md
```

---

## 🧪 Testando

```bash
# 1. Crie algumas notas markdown
mkdir -p ./notas-teste

cat > ./notas-teste/nota1.md << 'MARKDOWN'
# Introdução à IA

Inteligência Artificial é o futuro. [[Machine Learning]] é parte disso.
#tecnologia #ia
MARKDOWN

cat > ./notas-teste/nota2.md << 'MARKDOWN'
# Machine Learning

Machine Learning usa dados para treinar modelos.
Relacionado com [[Introdução à IA]] e #data-science.
MARKDOWN

# 2. Injera as notas
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"directory": "./notas-teste"}'

# 3. Veja o grafo
curl http://localhost:3000/api/graph

# 4. Busque
curl "http://localhost:3000/api/search?q=ia"
```

---

## 📝 Próximos Passos

- [ ] Frontend Preact + Sigma.js
- [ ] WebSocket para updates em tempo real
- [ ] Embeddings locais com Xenova (opcional)
- [ ] Export/import de backup

---

## 📄 Licença

MIT - Faça o que quiser! 🚀

---

**Feito com ❤️ para PCs carroças do mundo todo!**
