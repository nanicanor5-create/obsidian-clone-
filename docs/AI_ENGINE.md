# AI Engine - Motor de IA Autônomo

## Filosofia: Autossuficiência de IA

Este documento detalha como o motor de IA funciona de forma **autônoma e auto-dirigida**, similar ao Paperclip AI. O sistema não apenas responde a solicitações do usuário, mas toma **decisões e executa ações** por conta própria.

## Visão Geral

```
┌─────────────────────────────────────────┐
│   Gemini CLI Orchestrator               │
│   (Autonomous Decision Maker)            │
└────────────┬────────────────────────────┘
             │
      ┌──────┴──────┬──────────┬──────────┐
      ▼             ▼          ▼          ▼
  Analyzer      Generator   Suggester  Executor
     │              │          │         │
  (Analisa)    (Cria)    (Sugere)   (Executa)
     │              │          │         │
     └──────┬───────┴──────┬───┴────────┘
            ▼              ▼
        Decision Making   Action Queue
            │              │
            └──────┬───────┘
                   ▼
        Validation & Feedback Loop
```

## 1. Orchestrator Principal: Gemini CLI

### 1.1 Inicialização

```bash
# Instalar Gemini CLI
npm install @google/generative-ai

# Configurar credenciais
export GEMINI_API_KEY=your_api_key

# Inicializar orquestrador
./ai-engine/orchestrator.js
```

### 1.2 Loop Principal

```javascript
// Pseudocódigo do loop autonômico
async function autonomousLoop() {
  while (true) {
    // Passo 1: Observação
    const events = await eventQueue.getAll()
    
    // Passo 2: Análise
    for (const event of events) {
      const analysis = await geminiAnalyze(event)
      
      // Passo 3: Decision Making
      const decisions = await makeBatchDecisions(analysis)
      
      // Passo 4: Execução
      for (const decision of decisions) {
        if (await validateDecision(decision)) {
          await executeAction(decision)
        }
      }
    }
    
    // Passo 5: Auto-Improvement
    await evaluatePerformance()
    await updatePatterns()
    
    // Espera antes do próximo ciclo
    await sleep(30 * 60 * 1000) // 30 minutos
  }
}
```

## 2. Estratégia: Local-First com Fallback Inteligente

A arquitetura do motor de IA segue uma **estratégia progressiva** similar ao Smart Connections:

```
Prioridade 1: Local Embeddings (Xenova)
    ↓ (Se não disponível)
Prioridade 2: Ollama (Local LLM)
    ↓ (Se não disponível ou offline)
Prioridade 3: APIs Cloud (Gemini, Claude)
```

### Benefícios
- ✅ **Privacidade Total**: Dados nunca saem do dispositivo
- ⚡ **Offline**: Funciona sem internet
- 💰 **Sem Custos**: Zero cobranças de API
- 🚀 **Rápido**: Latência 50-100ms vs 500-2000ms na cloud

Para detalhes completos, veja [LOCAL_MODELS.md](./LOCAL_MODELS.md).

---

## 3. Processors de IA

### 3.1 Content Analyzer

**Responsabilidade**: Analisa notas para extrair significado

```typescript
interface ContentAnalysis {
  concepts: Concept[]
  entities: Entity[]
  sentiment: {
    score: number
    magnitude: number
  }
  keyPhrases: string[]
  language: string
  complexity: number
  suggestedCategory: string
}

interface Concept {
  name: string
  confidence: number
  relatedConcepts: string[]
}

interface Entity {
  text: string
  type: 'PERSON' | 'PLACE' | 'ORGANIZATION' | 'DATE' | 'OTHER'
  salience: number
}
```

**Fluxo**:
```
Nota → Gemini (analyze) → Concepts + Entities
         ↓
      Extract Key Phrases
         ↓
      Calculate Sentiment
         ↓
      Suggest Category
```

**Exemplo de Prompt**:
```
Analise a seguinte nota e extraia informações estruturadas:

[Nota]

Retorne JSON com:
- Conceitos principais (com confiança 0-1)
- Entidades (PERSON, PLACE, ORG, DATE)
- Sentimento geral
- Frases chave (máx 5)
- Categoria sugerida
- Complexidade (1-10)

Responda APENAS em JSON, sem explicações adicionais.
```

### 3.2 Link Suggester

**Responsabilidade**: Encontra conexões entre notas

```typescript
interface LinkSuggestion {
  sourceId: string
  targetId: string
  confidence: number
  reason: string
  type: 'semantic' | 'conceptual' | 'temporal' | 'thematic'
}
```

**Algoritmo**:

```
Para cada nota nova N:
  1. Extrair conceitos de N
  
  2. Para cada nota existente E:
     a. Calcular similaridade de conceitos
     b. Verificar overlap de entidades
     c. Analisar contexto temporal
     d. Score de relevância = weighted sum
  
  3. Ordenar E por score
  
  4. Para top 5 candidatos:
     a. Usar Gemini para validação contextual
     b. Gerar razão (reason) legível
  
  5. Retornar sugestões com confidence > threshold (0.7)
```

**Decision Making**:
```
Para cada sugestão de link:
  IF confidence > 0.85:
    AUTO-CREATE (alta confiança)
  ELIF confidence > 0.65:
    MARK AS "SUGGESTED" (review by user)
  ELSE:
    DISCARD
```

### 3.3 Tag Generator

**Responsabilidade**: Classifica e categoriza automaticamente

```typescript
interface TagSuggestion {
  name: string
  confidence: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  taxonomy?: string  // Categoria pai
}
```

**Hierarquia de Tags**:
```
📚 Knowledge
  ├─ Programming
  │   ├─ JavaScript
  │   ├─ Python
  │   └─ Rust
  ├─ Science
  │   ├─ Physics
  │   ├─ Biology
  │   └─ Chemistry
  └─ Business
      ├─ Marketing
      ├─ Sales
      └─ Product

⚡ Status
  ├─ TODO
  ├─ IN_PROGRESS
  ├─ COMPLETED
  └─ ARCHIVED

💡 Importance
  ├─ CRITICAL
  ├─ HIGH
  ├─ MEDIUM
  └─ LOW
```

**Gemini Prompt**:
```
Classifique a seguinte nota:

[Conteúdo da nota]

Retorne:
1. Tags de conhecimento (máx 5)
2. Status tag (TODO/IN_PROGRESS/COMPLETED/ARCHIVED)
3. Importância (CRITICAL/HIGH/MEDIUM/LOW)

Responda em JSON estruturado.
```

### 3.4 Summarizer

**Responsabilidade**: Cria resumos inteligentes

```typescript
interface Summary {
  brief: string      // 1 linha
  abstract: string   // 1 parágrafo
  bulletPoints: string[]  // 5-7 pontos
  keyTakeaways: string[]
}
```

**Estratégia Adaptativa**:
```
IF notaLength < 500 palavras:
  USE: Extractive summarization (key sentences)
ELIF notaLength < 2000 palavras:
  USE: Abstractive summarization (Gemini)
ELSE:
  USE: Hierarchical summarization
       - Breaks into sections
       - Summarizes cada seção
       - Merges top summaries
```

### 3.5 Insight Generator

**Responsabilidade**: Descobre padrões e gera insights

```typescript
interface Insight {
  type: 'PATTERN' | 'ANOMALY' | 'OPPORTUNITY' | 'CONNECTION'
  description: string
  evidence: string[]
  actionSuggested?: string
  priority: number
}
```

**Tipos de Insights**:

1. **Pattern Detection**
   - Tópicos que aparecem frequentemente
   - Relações causais
   - Ciclos temporais

2. **Anomaly Detection**
   - Notas muito diferentes do padrão
   - Gaps no conhecimento
   - Inconsistências

3. **Opportunity Recognition**
   - Áreas para exploração
   - Conexões não exploradas
   - Possíveis projetos

4. **Question Generation**
   - Perguntas baseadas no conteúdo
   - Desafiando suposições
   - Expandindo pensamento

**Exemplo de Insight**:
```json
{
  "type": "PATTERN",
  "description": "Você tem escrito frequentemente sobre 'machine learning' + 'segurança'",
  "evidence": [
    "Nota: 'ML Security Framework' (5 dias atrás)",
    "Nota: 'Adversarial Attacks' (3 dias atrás)",
    "Nota: 'Privacy-Preserving ML' (hoje)"
  ],
  "actionSuggested": "Criar nota consolidada sobre 'ML Security'",
  "priority": 7
}
```

## 4. Decision Making Engine

### 3.1 Árvore de Decisão

```
┌─ Evento de Mudança
│
├─ Qual tipo de nota?
│  ├─ Nota Técnica → Auto-tag como "Programming"
│  ├─ Nota Pessoal → Manual review
│  └─ Nota Bibliográfica → Auto-reference
│
├─ Deve criar links?
│  ├─ Confidence > 0.85 → YES
│  ├─ Confidence 0.65-0.85 → SUGGEST
│  └─ Confidence < 0.65 → NO
│
├─ Deve gerar insights?
│  ├─ Clusters detectados → YES
│  ├─ Padrões emergentes → YES
│  └─ Dados insuficientes → NO
│
└─ Ações a Executar
   ├─ Update DB
   ├─ Emit WebSocket event
   ├─ Add to Vector DB
   └─ Schedule background job
```

### 3.2 Validação de Decisões

Antes de executar ações, o sistema valida:

```typescript
async function validateDecision(decision: Decision): Promise<boolean> {
  // Checklist de validação
  const checks = [
    // 1. Sanidade básica
    decision.confidence > 0.5,
    
    // 2. Não duplicata
    !await aiMemory.hasSeenBefore(decision),
    
    // 3. Alinhamento com histórico
    await ml.predictUserApprovalRate(decision) > 0.6,
    
    // 4. Consistência com padrões aprendidos
    !decision.contradictsPreviousPatterns(),
    
    // 5. Recursos disponíveis
    systemResources.canExecute(decision)
  ]
  
  return checks.every(c => c === true)
}
```

## 5. Action Execution

### 4.1 Tipos de Ações

```typescript
enum ActionType {
  CREATE_LINK = 'CREATE_LINK',
  CREATE_TAG = 'CREATE_TAG',
  UPDATE_SUMMARY = 'UPDATE_SUMMARY',
  CREATE_INSIGHT = 'CREATE_INSIGHT',
  CREATE_SUGGESTION = 'CREATE_SUGGESTION',
  UPDATE_METADATA = 'UPDATE_METADATA',
  MOVE_TO_FOLDER = 'MOVE_TO_FOLDER',
}

interface Action {
  id: string
  type: ActionType
  payload: any
  confidence: number
  reason: string
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED'
  executedAt?: Date
  result?: any
}
```

### 4.2 Fila de Execução

```
┌─────────────────────────────────────┐
│   Action Queue (Bull/RabbitMQ)      │
└─────────────────────────────────────┘
     │
     ├─ Priority Queue (HIGH → LOW)
     │
     ├─ Deduplicate (remover duplicatas)
     │
     ├─ Batch Similar Actions
     │
     └─ Throttle (evitar overhead)
          │
          ├─ Execute with Retry Logic
          │
          ├─ Log Results
          │
          └─ Emit Events (WebSocket)
```

### 4.3 Exemplo: Criar Link Automaticamente

```javascript
async function executeCreateLink(action) {
  const {sourceId, targetId, reason, confidence} = action.payload
  
  try {
    // 1. Validar que notas existem
    const source = await noteDb.getById(sourceId)
    const target = await noteDb.getById(targetId)
    if (!source || !target) throw new Error('Note not found')
    
    // 2. Verificar se link já existe
    const existing = await linkDb.find(sourceId, targetId)
    if (existing) return // Skip
    
    // 3. Criar link
    const link = await linkDb.create({
      sourceId,
      targetId,
      type: 'auto',
      confidence,
      reason,
      createdAt: new Date()
    })
    
    // 4. Atualizar índices
    await vectorDb.updateLink(sourceId, targetId)
    await elasticsearch.updateGraph(sourceId)
    
    // 5. Notificar frontend
    io.emit('link:created', {sourceId, targetId, reason})
    
    // 6. Registrar no histórico de IA
    await aiMemory.logDecision({
      type: 'CREATE_LINK',
      sourceId,
      targetId,
      confidence,
      success: true
    })
    
    action.status = 'COMPLETED'
  } catch (error) {
    console.error('Link creation failed:', error)
    action.status = 'FAILED'
    action.error = error.message
  }
  
  return action
}
```

## 6. Feedback & Learning Loop

### 5.1 User Feedback

O sistema aprende com as ações dos usuários:

```typescript
interface UserFeedback {
  actionId: string
  type: 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'IGNORED'
  timestamp: Date
  userId: string
}
```

**Métricas de Aprendizado**:
```
Approval Rate = (Approved + Ignored) / Total
  - Se > 0.8: Aumentar confidence para ações similares
  - Se < 0.5: Revisar lógica de decisão

Precision = Approved / (Approved + Rejected)
  - Métrica de acurácia do sistema

Recall = (Approved + Modified) / Total
  - Métrica de cobertura (casos perdidos)
```

### 5.2 Auto-Improvement

```javascript
async function improveFromFeedback() {
  // 1. Coletar feedback
  const feedback = await getUserFeedback(period='24h')
  
  // 2. Analisar padrões
  const patterns = await ml.findPatterns(feedback)
  // ex: "Usuário aprova 95% de links entre 'Python' e 'ML'"
  
  // 3. Atualizar pesos
  await ml.updateWeights(patterns)
  
  // 4. Treinar modelo customizado
  const dataset = await prepareTrainingData()
  await gemini.finetuneModel(dataset)
  
  // 5. Testar em subset
  const testResults = await validateNewModel()
  
  // 6. Deploy se melhoria > 2%
  if (testResults.improvement > 0.02) {
    await deployNewModel()
    await logImprovement(testResults)
  }
}
```

## 7. Configuração do Gemini CLI

### 6.1 Inicializar Projeto

```bash
# Instalar dependências
npm install \
  @google/generative-ai \
  dotenv \
  bull \
  redis \
  pino

# Criar arquivo .env
cat > .env << EOF
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-pro
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
AI_UPDATE_INTERVAL=1800000  # 30 min em ms
AI_CONFIDENCE_THRESHOLD=0.65
EOF

# Inicializar sistema
npm run init-ai
```

### 6.2 Configuração Avançada

```javascript
// ai-engine/config.js
module.exports = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    maxTokens: 2048,
    temperature: 0.7,  // Mais criativo
    topP: 0.95,
  },
  
  processors: {
    analyzer: { enabled: true, interval: 30 * 60 * 1000 },
    linkSuggester: { enabled: true, threshold: 0.65 },
    tagGenerator: { enabled: true, autoApply: false },
    summarizer: { enabled: true },
    insightGenerator: { enabled: true, interval: 6 * 60 * 60 * 1000 },
  },
  
  fallbackEngines: {
    claude: { enabled: true, apiKey: process.env.CLAUDE_API_KEY },
    openai: { enabled: true, apiKey: process.env.OPENAI_API_KEY },
  },
  
  execution: {
    maxParallel: 5,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  
  learning: {
    autoimproveEnabled: true,
    feedbackWindow: 24 * 60 * 60 * 1000,  // 24h
    improvementThreshold: 0.02,  // 2% melhoria
  }
}
```

## 8. Monitoramento e Debugging

### 7.1 Logs estruturados

```javascript
// Usar Pino para logs
const logger = require('pino')({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

// Estruturado:
logger.info({
  action: 'CREATE_LINK',
  sourceId,
  targetId,
  confidence: 0.87,
  processor: 'LinkSuggester',
  executionTime: 234
}, 'Link created autonomously')
```

### 7.2 Métricas

```
AI Engine Metrics:
  - Actions/hour: quantidade de ações por hora
  - Approval Rate: % de ações aprovadas pelo user
  - Execution Time: tempo médio de execução
  - Error Rate: % de falhas
  - Gemini API Calls: monitorar quota
  - Confidence Distribution: histograma de confiança
```

### 7.3 Dashboard (Grafana)

```
Real-time AI Metrics:
  ┌─────────────────────────────┐
  │ Actions/hour:  234          │
  │ Approval Rate: 87.3%        │
  │ Error Rate:    1.2%         │
  │ Confidence Avg: 0.78        │
  └─────────────────────────────┘
  
  ┌─────────────────────────────┐
  │ Processing Queue            │
  │ ████░░░░░░░░  45/100       │
  │ Backlog: 3 hours           │
  └─────────────────────────────┘
```

## 9. Troubleshooting

### Problema: Links incorretos sendo criados

**Solução**:
```
1. Aumentar threshold (0.65 → 0.75)
2. Revisar prompts de validação
3. Ajustar pesos de similaridade
4. Treinar modelo com feedback do user
```

### Problema: IA muito lenta

**Solução**:
```
1. Aumentar maxParallel (5 → 10)
2. Usar batch processing
3. Cachear análises frequentes
4. Implementar rate limiting de API
```

### Problema: Quota de API excedida

**Solução**:
```
1. Monitorar gemini API calls
2. Implementar circuit breaker
3. Usar fallback engines
4. Batching requests
```

---

**Próximos Passos**:
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Setup do projeto
- [API.md](./API.md) - Referência da API de IA
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Desenvolvimento avançado
