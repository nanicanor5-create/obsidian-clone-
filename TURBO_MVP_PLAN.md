# 🚀 TURBO MVP IMPLEMENTATION PLAN

## Visão: Rodar em PC Carroça (2GB RAM, CPU Fraco, Sem GPU)

### Princípios "Pika e Foda"
1. **Leveza Extrema** - Cada MB de RAM conta
2. **Lazy Loading** - Carrega só o necessário
3. **Cloud Offload** - IA pesada no Gemini CLI (nuvem grátis)
4. **Local Rápido** - IA leve local apenas para embeddings (4MB)
5. **Zero Bloat** - Sem dependências desnecessárias

---

## 📦 STACK OTIMIZADA

| Componente | Tecnologia | Peso | Por que? |
|------------|-----------|------|----------|
| Runtime | Node.js 18+ | ~30MB | Já temos, DX bom |
| Database | Better-SQLite3 | ~2MB | Mais rápido que TypeORM+SQLite |
| IA Local | @xenova/transformers | ~30MB | Embeddings quantizados INT8 |
| IA Cloud | Gemini CLI | 0MB local | Offload gratuito |
| Parser | Regex nativo + nom-style | <1MB | Zero dependências |
| API | Express minimalista | ~10MB | Só o essencial |

---

## 🎯 ITERAÇÕES (Sprints de 1 dia cada)

### **ITERAÇÃO 1: API Core Funcional** (HOJE)
- [ ] Criar rotas API essenciais (`/ingest`, `/graph`, `/search`)
- [ ] Implementar `EntityExtractor.ts` (regex-based, sem ML pesado)
- [ ] Implementar `AutoLinker.ts` (baseado em similaridade de texto)
- [ ] Migrar de TypeORM para Better-SQLite3 puro (10x mais rápido)
- [ ] Scripts SQL diretos (zero ORM overhead)

### **ITERAÇÃO 2: IA Híbrida** (AMANHÃ)
- [ ] Integração Gemini CLI (cloud) para entity extraction pesado
- [ ] Xenova Transformers apenas para embeddings (local)
- [ ] Orquestrador decide: local vs cloud baseado no tamanho
- [ ] Cache agressivo de resultados

### **ITERAÇÃO 3: Performance Turbo** (DIA 3)
- [ ] Substituir TypeORM por queries SQL puras
- [ ] Implementar WAL mode no SQLite
- [ ] Índices compostos para busca rápida
- [ ] Background jobs com worker threads

### **ITERAÇÃO 4: Frontend Minimalista** (DIA 4-5)
- [ ] Preact + Vite (<15KB gzipped)
- [ ] Sigma.js para grafo (WebGL, aguenta 10k nós)
- [ ] Editor markdown simples
- [ ] Busca instantânea

---

## 📊 METAS DE PERFORMANCE (PC CARROÇA)

| Métrica | Meta Atual | Meta Turbo | Como? |
|---------|------------|------------|-------|
| RAM Idle | ~150MB | **<30MB** | Better-SQLite3 + lazy load |
| Startup | ~3-5s | **<1s** | Zero ORM, cache quente |
| Ingestão (1k notas) | ~15s | **<2s** | Parallel processing + SQL direto |
| Busca Semântica | ~200ms | **<50ms** | Índices + cache |
| Bundle Frontend | ~300KB | **<50KB** | Preact + tree shaking |

---

## 🔥 MUDANÇAS CRÍTICAS vs PLANO ORIGINAL

### ❌ REMOVER (Bloat)
- TypeORM (lento, pesado)
- Neo4j (overkill para MVP)
- Redis (complexidade desnecessária)
- RabbitMQ/Bull (worker threads resolvem)
- LangChain (fazemos mais leve)

### ✅ MANTER (Essencial)
- Express (API simples)
- Xenova (embeddings locais)
- Gemini CLI (IA cloud grátis)
- SQLite (database)

### ⚡ ADICIONAR (Turbo)
- Better-SQLite3 (sync, mais rápido)
- Worker Threads (processamento paralelo)
- LRU Cache em memória
- SQL queries otimizadas

---

## 📁 ESTRUTURA FINAL OTIMIZADA

```
/workspace/
├── src/
│   ├── api/
│   │   └── routes/
│   │       ├── ingest.ts      # POST /ingest
│   │       ├── graph.ts       # GET /graph
│   │       ├── search.ts      # GET /search?q=...
│   │       ├── notes.ts       # CRUD notas
│   │       └── query.ts       # POST /query (Q&A)
│   ├── core/                  # NOVO: Core otimizado
│   │   ├── database.ts        # Better-SQLite3 puro
│   │   ├── parser.ts          # Markdown parser turbo
│   │   └── cache.ts           # LRU cache em memória
│   ├── services/
│   │   ├── ingestion/
│   │   │   └── FileSystemProvider.ts  # Otimizado
│   │   ├── ai/
│   │   │   ├── EntityExtractor.ts     # NOVO: Regex + Gemini
│   │   │   ├── AutoLinker.ts          # NOVO: Similaridade
│   │   │   ├── EmbeddingService.ts    # Xenova (keep)
│   │   │   └── HybridOrchestrator.ts  # NOVO: Local vs Cloud
│   │   └── graph/
│   │       └── GraphEngine.ts         # SQL puro
│   └── utils/
│       └── logger.ts
├── scripts/
│   ├── migrate.sql            # SQL direto
│   └── seed.sql
├── package.json               # Deps mínimas
└── .env.example
```

---

## 🛠️ DEPENDÊNCIAS FINAIS (Minimalistas)

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "better-sqlite3": "^9.0.0",
    "@xenova/transformers": "^2.10.0",
    "dotenv": "^16.3.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "tsx": "^4.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/express": "^4.17.0",
    "@types/uuid": "^9.0.0"
  }
}
```

**Total deps:** 5 produção + 4 dev = **9 packages** (vs 50+ do plano original)

---

## 🚀 QUICK START (3 COMANDOS)

```bash
# 1. Instalar (leve!)
npm install

# 2. Inicializar DB
npm run db:init

# 3. Rodar
npm run dev

# Acessar http://localhost:3000
```

---

## ✅ CRITÉRIOS DE ACEITE TURBO

1. **RAM < 50MB** em idle
2. **Startup < 1 segundo**
3. **Ingestão 100 notas/sec**
4. **Busca < 50ms**
5. **Funciona offline** (exceto Gemini CLI)
6. **Setup < 5 minutos**

---

**PRÓXIMO PASSO:** Começar Iteração 1 AGORA
- Criar estrutura Better-SQLite3
- Implementar API routes
- Entity Extractor + AutoLinker
