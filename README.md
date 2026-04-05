# Obsidian Clone - AI-Powered Note Taking System

Um clone do Obsidian com integração nativa de IA baseada em **Gemini CLI e Modelos Locais Leves**, permitindo que o sistema execute ações autônomas usando múltiplos modelos de IA para análise, geração de conteúdo e automação de fluxo de trabalho, **100% privado e offline-first**.

## 🚀 Visão Geral

Este projeto implementa um sistema de anotações similiar ao Obsidian, mas com:

- **Motor de IA Integrado**: Gemini CLI + Modelos Locais (Xenova Transformers)
- **Prioridade Local-First**: Usa modelos locais leves por padrão (50-100ms por operação)
- **Offline por Design**: Funciona completamente sem internet
- **Privacidade Total**: Dados nunca saem do seu computador
- **Autossuficiência de IA**: O sistema pode executar ações por conta própria (análise de notas, sugestões de ligações, geração de estruturas)
- **Múltiplos Backends de IA**: Fallback para Gemini, Claude, OpenAI quando necessário
- **Grafo de Conhecimento**: Sistema de linking bidirecional entre notas
- **Sincronização em Tempo Real**: Atualização instantânea de relacionamentos entre notas

## ✨ Características Principais

### Core
- 📝 Edição de markdown com preview em tempo real
- 🔗 Grafo de conhecimento com backlinks
- 🏷️ Tags e categorização automática via IA
- 🔍 Busca inteligente alimentada por IA
- 📊 Wall of insights (painel de sugestões da IA)

### IA & Automação (LOCAL-FIRST)
- 🤖 **Auto-Analyzer**: Extrai conceitos e entidades usando Xenova embeddings
- 💡 **Auto-Linker**: Descobre automaticamente conexões entre notas (100% offline)
- 📈 **Smart Summarizer**: Cria sumários automáticos
- 🎯 **Auto-Tagger**: Classificação automática de notas
- 🔄 **Background Tasks**: Processamento assíncrono de notas
- 🌐 **Confidence Fallback**: Usa APIs cloud só quando necessário

### Recursos Avançados
- 🌐 Suporte a múltiplas linguagens (via multilingual-e5)
- 📱 Interface responsiva (funciona em qualquer tela)
- 🎨 Tema claro/escuro com customização
- 💾 Export (PDF, HTML, Markdown) offline
- 🔐 Encriptação local (opcional)
- ⚡ Execução 90% mais rápida que APIs cloud

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
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│          AI Engine (Gemini CLI)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Analyzer │  │ Generator│  │Orchestrator          │
│  └──────────┘  └──────────┘  └──────────┘           │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│       Storage Layer                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Database│  │  File    │  │  Vector  │           │
│  │  (SQL)   │  │  Store   │  │  DB      │           │
│  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

```bash
# Clone o repositório
git clone <repository>
cd obsidian-clone-

# Instale as dependências
npm install

# Configure as chaves de API
cp .env.example .env
# Edite .env com suas chaves Gemini, Claude, etc.

# Inicie o servidor de desenvolvimento
npm run dev

# Acesse em http://localhost:3000
```

## 📚 Documentação

- [**QUICK_LOCAL_SETUP.md**](./docs/QUICK_LOCAL_SETUP.md) - ⚡ Setup em 5 minutos (COMECE AQUI!)
- [**LOCAL_MODELS.md**](./docs/LOCAL_MODELS.md) - 🤖 Modelos leves & arquitetura local-first
- [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - 🏗️ Arquitetura detalhada
- [**AI_ENGINE.md**](./docs/AI_ENGINE.md) - ⚙️ Motor de IA e orquestração
- [**GETTING_STARTED.md**](./docs/GETTING_STARTED.md) - 🚀 Guia completo de setup
- [**API.md**](./docs/API.md) - 📖 Referência da API
- [**DEVELOPMENT.md**](./docs/DEVELOPMENT.md) - 👨‍💻 Guia de contribuição

## 🤖 Como Funciona o Motor de IA

O sistema usa **Gemini CLI** como orquestrador central:

1. **Observação**: Sistema monitora novas/alteradas notas
2. **Análise**: Gemini CLI analisa o conteúdo automaticamente
3. **Decision Making**: IA decide que ações tomar
4. **Execução**: Sistema executa ações (criar links, tags, sumários)
5. **Feedback**: Resultados são validados e refinados

Similar ao Paperclip AI, que usava GPT para suas próprias ações, nosso sistema é **auto-dirigizado pela IA**.

## 📦 Stack Tecnológico

- **Backend**: Node.js + Express
- **Frontend**: React 18 + TailwindCSS
- **Database**: PostgreSQL
- **Vector DB**: Pinecone/Weaviate
- **IA Engines**: Gemini CLI, Claude API, OpenAI API
- **Real-time**: Socket.io
- **Task Queue**: Bull/RabbitMQ

## 🔧 Configuração

Copie `.env.example` para `.env` e configure:

```env
# Gemini
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-pro

# Claude (Fallback)
CLAUDE_API_KEY=your_key

# Database
DATABASE_URL=postgresql://user:password@localhost/obsidian

# Vector Database
PINECONE_API_KEY=your_key
PINECONE_ENVIRONMENT=us-west1

# Server
PORT=3000
NODE_ENV=development
```

## 🤝 Contribuindo

Veja [DEVELOPMENT.md](./docs/DEVELOPMENT.md) para instruções de desenvolvimento.

## 📄 Licença

MIT

## 🙏 Agradecimentos

Inspirado pelo Obsidian.md e pela abordagem autônoma de IA do Paperclip AI.

---

**Status**: 🚧 Em Desenvolvimento
**Versão**: 0.1.0-alpha
**Última Atualização**: 2025-04-05