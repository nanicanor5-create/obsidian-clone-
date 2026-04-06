# Getting Started

Guia rápido para começar com o **Turbo MVP**.

## Instalação

```bash
npm install
npm run db:init
npm run dev
```

## Estrutura de Pastas

```
/workspace/
├── notes/          # Suas notas Markdown
├── data/           # Banco SQLite
├── scripts/        # Scripts utilitários
└── src/            # Código fonte
```

## Comandos Úteis

- `npm run dev` - Inicia servidor em modo desenvolvimento
- `npm run db:init` - Cria/reseta banco de dados
- `npm run ingest ./minhas-notas` - Ingestão manual

## API Endpoints

- `GET /health` - Health check
- `GET /api/graph` - Grafo completo
- `GET /api/search?q=...` - Busca
- `GET /api/notes` - Lista todas as notas
- `GET /api/notes/:id` - Nota específica

#setup #guide #documentation
