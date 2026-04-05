# API Reference

## Visão Geral

A API do Obsidian Clone segue uma arquitetura RESTful com suporte a autenticação JWT e WebSocket para atualizações em tempo real.

**Base URL**: `http://localhost:3000/api`

**Versão**: `v1`

## Autenticação

Todas as requisições (exceto login/auth) requerem um header Authorization.

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3000/api/notes
```

## Status Codes

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado
- `400 Bad Request`: Erro de validação
- `401 Unauthorized`: Token inválido/expirado
- `404 Not Found`: Recurso não encontrado
- `429 Too Many Requests`: Rate limit excedido
- `500 Internal Server Error`: Erro do servidor

---

## Endpoints

### Authentication

#### POST /auth/register

Registrar novo usuário.

**Request**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe"
  }'
```

**Response** (201):
```json
{
  "id": "uuid-user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

#### POST /auth/login

Fazer login.

**Request**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Response** (200):
```json
{
  "id": "uuid-user-id",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

#### POST /auth/refresh

Renovar token.

**Request**:
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

---

### Notes

#### GET /notes

Listar todas as notas do usuário.

**Query Parameters**:
- `limit` (int, default: 20): Máximo de resultados
- `offset` (int, default: 0): Deslocamento de paginação
- `search` (string): Buscar por título/conteúdo
- `tags` (string, CSV): Filtrar por tags
- `sort` (string): Campo para ordenação (created, updated, title)

**Request**:
```bash
curl http://localhost:3000/api/notes?limit=10&sort=updated
```

**Response** (200):
```json
{
  "data": [
    {
      "id": "note-1",
      "title": "Note Title",
      "content": "# Note\n\nContent here",
      "createdAt": "2025-04-05T10:30:00Z",
      "updatedAt": "2025-04-05T11:00:00Z",
      "tags": ["AI", "Programming"],
      "links": ["note-2", "note-3"],
      "metadata": {
        "wordCount": 150,
        "readingTime": 2,
        "importance": 7
      }
    }
  ],
  "total": 45,
  "limit": 10,
  "offset": 0
}
```

#### POST /notes

Criar nova nota.

**Request**:
```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "My New Note",
    "content": "# Hello\n\nThis is a note with **markdown**",
    "tags": ["AI", "Learning"],
    "folder": "Projects"
  }'
```

**Response** (201):
```json
{
  "id": "note-new-id",
  "title": "My New Note",
  "content": "# Hello\n\nThis is a note with **markdown**",
  "createdAt": "2025-04-05T12:00:00Z",
  "updatedAt": "2025-04-05T12:00:00Z",
  "tags": ["AI", "Learning"],
  "links": [],
  "metadata": {
    "wordCount": 20,
    "readingTime": 1,
    "importance": 5
  }
}
```

#### GET /notes/:id

Obter detalhe de uma nota.

**Request**:
```bash
curl http://localhost:3000/api/notes/note-1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response** (200):
```json
{
  "id": "note-1",
  "title": "Note Title",
  "content": "# Note\n\nContent here",
  "createdAt": "2025-04-05T10:30:00Z",
  "updatedAt": "2025-04-05T11:00:00Z",
  "tags": ["AI", "Programming"],
  "links": ["note-2", "note-3"],
  "backlinks": ["note-4", "note-5"],
  "metadata": {
    "wordCount": 150,
    "readingTime": 2,
    "importance": 7,
    "aiAnalysis": {
      "summary": "Nota sobre IA e machine learning",
      "concepts": ["Neural Networks", "Deep Learning"],
      "sentiment": 0.75,
      "suggestedTags": ["ML", "AI"]
    }
  }
}
```

#### PUT /notes/:id

Atualizar uma nota.

**Request**:
```bash
curl -X PUT http://localhost:3000/api/notes/note-1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Updated Title",
    "content": "# Updated\n\nNew content",
    "tags": ["AI", "Updated"]
  }'
```

**Response** (200):
```json
{
  "id": "note-1",
  "title": "Updated Title",
  "content": "# Updated\n\nNew content",
  "updatedAt": "2025-04-05T13:00:00Z",
  "tags": ["AI", "Updated"],
  "links": ["note-2"],
  "metadata": {
    "wordCount": 25,
    "readingTime": 1,
    "importance": 7
  }
}
```

#### DELETE /notes/:id

Deletar uma nota.

**Request**:
```bash
curl -X DELETE http://localhost:3000/api/notes/note-1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response** (204): No Content

---

### Graph

#### GET /graph

Obter grafo completo de notas.

**Query Parameters**:
- `depth` (int, default: 2): Profundidade do grafo
- `nodeIds` (string, CSV): Filtrar por IDs de notas

**Request**:
```bash
curl http://localhost:3000/api/graph?depth=2
```

**Response** (200):
```json
{
  "nodes": [
    {
      "id": "note-1",
      "label": "Note Title",
      "importance": 7,
      "tags": ["AI"]
    }
  ],
  "edges": [
    {
      "source": "note-1",
      "target": "note-2",
      "weight": 0.85,
      "type": "auto"
    }
  ]
}
```

#### GET /graph/:noteId/neighbors

Obter vizinhos de uma nota no grafo.

**Request**:
```bash
curl http://localhost:3000/api/graph/note-1/neighbors
```

**Response** (200):
```json
{
  "direct": ["note-2", "note-3"],
  "indirect": ["note-4", "note-5", "note-6"],
  "backlinks": ["note-7"]
}
```

#### GET /graph/:noteId/path/:targetId

Encontrar caminho mais curto entre duas notas.

**Request**:
```bash
curl http://localhost:3000/api/graph/note-1/path/note-10
```

**Response** (200):
```json
{
  "path": ["note-1", "note-2", "note-5", "note-10"],
  "distance": 3,
  "totalWeight": 2.45
}
```

---

### Search

#### GET /search

Busca inteligente em todas as notas.

**Query Parameters**:
- `q` (string, required): Termo de busca
- `type` (string): 'text' | 'semantic' | 'graph' | 'all'
- `limit` (int): Máximo de resultados

**Request**:
```bash
curl "http://localhost:3000/api/search?q=machine%20learning&type=semantic&limit=20"
```

**Response** (200):
```json
{
  "results": [
    {
      "id": "note-2",
      "title": "Machine Learning Basics",
      "excerpt": "...machine learning is a subset of AI...",
      "score": 0.95,
      "type": "semantic",
      "matches": ["Machine Learning", "AI"]
    },
    {
      "id": "note-3",
      "title": "Deep Learning",
      "excerpt": "...which uses machine learning...",
      "score": 0.72,
      "type": "text",
      "matches": ["machine learning"]
    }
  ],
  "total": 2,
  "executionTime": 0.234  // em segundos
}
```

#### GET /search/suggestions

Obter sugestões de busca.

**Request**:
```bash
curl "http://localhost:3000/api/search/suggestions?q=neur"
```

**Response** (200):
```json
{
  "suggestions": [
    "Neural Networks",
    "Neuroscience",
    "Neural Architecture"
  ]
}
```

---

### Tags

#### GET /tags

Listar todas as tags.

**Query Parameters**:
- `limit` (int): Máximo de tags
- `sort` (string): 'name' | 'count'

**Request**:
```bash
curl http://localhost:3000/api/tags?sort=count
```

**Response** (200):
```json
{
  "data": [
    {
      "name": "AI",
      "count": 15,
      "color": "#FF6B6B"
    },
    {
      "name": "Learning",
      "count": 12,
      "color": "#4ECDC4"
    }
  ],
  "total": 23
}
```

#### GET /tags/:name

Obter notas com uma tag específica.

**Request**:
```bash
curl http://localhost:3000/api/tags/AI
```

**Response** (200):
```json
{
  "tag": "AI",
  "count": 15,
  "notes": ["note-1", "note-2", "note-5", ...]
}
```

---

### AI Endpoints

#### POST /ai/analyze

Analisar um texto com o motor de IA.

**Request**:
```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "Machine learning is a subset of artificial intelligence...",
    "processors": ["analyzer", "summarizer"]
  }'
```

**Response** (200):
```json
{
  "text": "Machine learning is...",
  "analysis": {
    "analyzer": {
      "concepts": [
        {"name": "Machine Learning", "confidence": 0.95},
        {"name": "Artificial Intelligence", "confidence": 0.92}
      ],
      "entities": [
        {"text": "Machine Learning", "type": "CONCEPT", "salience": 0.9}
      ],
      "sentiment": 0.7,
      "language": "en"
    },
    "summarizer": {
      "brief": "Discussão sobre ML como subconjunto de IA",
      "bulletPoints": [...]
    }
  }
}
```

#### POST /ai/suggest-links

Obter sugestões de links para uma nota.

**Request**:
```bash
curl -X POST http://localhost:3000/api/ai/suggest-links \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "noteId": "note-1"
  }'
```

**Response** (200):
```json
{
  "suggestions": [
    {
      "targetId": "note-5",
      "confidence": 0.87,
      "reason": "Discusses same concepts: Neural Networks",
      "type": "semantic"
    },
    {
      "targetId": "note-8",
      "confidence": 0.71,
      "reason": "Shares tags: #AI #Learning",
      "type": "thematic"
    }
  ]
}
```

#### POST /ai/auto-tag

Gerar tags automáticas para uma nota.

**Request**:
```bash
curl -X POST http://localhost:3000/api/ai/auto-tag \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "noteId": "note-1"
  }'
```

**Response** (200):
```json
{
  "suggestions": [
    {"tag": "AI", "confidence": 0.95, "priority": "HIGH"},
    {"tag": "Machine Learning", "confidence": 0.88, "priority": "HIGH"},
    {"tag": "Learning", "confidence": 0.72, "priority": "MEDIUM"}
  ]
}
```

#### POST /ai/summarize

Gerar sumário de uma nota.

**Request**:
```bash
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "noteId": "note-1",
    "format": "bullet_points"  # ou "paragraph" ou "brief"
  }'
```

**Response** (200):
```json
{
  "noteId": "note-1",
  "summary": {
    "brief": "Visão geral sobre machine learning",
    "bulletPoints": [
      "ML é subconjunto de IA",
      "Usa algoritmos para aprender de dados",
      "Aplicações em classificação, regressão, clustering"
    ]
  }
}
```

#### GET /ai/insights

Obter insights gerados pela IA.

**Query Parameters**:
- `type` (string): 'PATTERN' | 'ANOMALY' | 'OPPORTUNITY' | 'all'
- `limit` (int): Máximo de insights

**Request**:
```bash
curl "http://localhost:3000/api/ai/insights?type=PATTERN&limit=10"
```

**Response** (200):
```json
{
  "insights": [
    {
      "id": "insight-1",
      "type": "PATTERN",
      "description": "Padrão detectado: frequentes discussões sobre machine learning + segurança",
      "evidence": ["note-5", "note-10", "note-15"],
      "actionSuggested": "Criar colecção consolidada",
      "priority": 8
    }
  ]
}
```

#### GET /ai/status

Status do motor de IA.

**Request**:
```bash
curl http://localhost:3000/api/ai/status
```

**Response** (200):
```json
{
  "online": true,
  "primaryEngine": "gemini",
  "activeProcessors": [
    "analyzer",
    "linkSuggester",
    "summarizer"
  ],
  "queue": {
    "pending": 5,
    "processing": 2,
    "completed": 1250
  },
  "metrics": {
    "approvalRate": 0.87,
    "avgConfidence": 0.78,
    "avgExecutionTime": 234
  }
}
```

---

### WebSocket Events

Conectar para atualizações em tempo real:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
})

// Listen for real-time events
socket.on('note:created', (note) => {
  console.log('Note created:', note)
})

socket.on('note:updated', (note) => {
  console.log('Note updated:', note)
})

socket.on('link:created', (link) => {
  console.log('Link created:', link)
})

socket.on('ai:analysis-complete', (result) => {
  console.log('AI analysis:', result)
})

socket.on('ai:suggestion', (suggestion) => {
  console.log('AI suggestion:', suggestion)
})
```

---

### Error Responses

**Validação Failed** (400):
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

**Não Autenticado** (401):
```json
{
  "status": "error",
  "message": "Unauthorized",
  "code": "INVALID_TOKEN"
}
```

**Não Encontrado** (404):
```json
{
  "status": "error",
  "message": "Note not found",
  "code": "NOTE_NOT_FOUND"
}
```

**Rate Limited** (429):
```json
{
  "status": "error",
  "message": "Too many requests",
  "retryAfter": 60
}
```

---

## Rate Limiting

- **Free Tier**: 100 requests/min
- **Premium**: 1000 requests/min
- **AI Endpoints**: Partilhado com limite de Gemini API

---

## Paginação

Todas as respostas com múltiplos itens suportam paginação:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "pages": 5,
    "currentPage": 1
  }
}
```

---

**Última atualização**: 2025-04-05
