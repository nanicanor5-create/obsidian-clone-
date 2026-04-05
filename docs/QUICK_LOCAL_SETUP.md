# Quick Setup: Obsidian Clone com IA

Guia rápido para usar o Obsidian Clone com **Gemini CLI** (login uma vez) + modelos locais.

## ⚡ Setup Mínimo (10 minutos)

### 1. Instalar Gemini CLI (1 vez)

```bash
# Instalar globalmente
npm install -g @google/generative-ai-cli

# Fazer login (abre navegador)
gemini-cli login

# Verificar
gemini-cli status
```

✅ **Pronto!** Credenciais salvas localmente. Não precisa de API key.

### 2. Preparar Projeto

```bash
cd obsidian-clone-
npm install
cp .env.example .env
```

### 3. Configurar .env

```env
# Gemini CLI (principal - login já feito acima)
GEMINI_CLI_ENABLED=true
AI_ENGINE=gemini-cli

# Embeddings locais
USE_LOCAL_EMBEDDINGS=true
LOCAL_EMBEDDING_MODEL=Xenova/multilingual-e5-small

# Sem API key necessária
GEMINI_API_KEY=  # deixar vazio
```

### 4. Iniciar (Pronto!)

```bash
npm run dev
```

✅ **Pronto!** Sistema usando Gemini CLI autenticado + embeddings locais.

---

## 🚀 Setup Completo (Com Ollama para LLMs)

Análise de texto com IA local (opcional):

### 1. Instalar & Rodar Ollama

```bash
# Instalar
brew install ollama  # macOS
# ou: curl -fsSL https://ollama.ai/install.sh | sh  # Linux
# ou: Download https://ollama.ai/download/windows

# Rodar daemon
ollama serve

# Em outro terminal, baixar modelo
ollama pull tinyllama  # 440MB - suficiente
```

### 2. Configurar .env

```env
# Gemini CLI
GEMINI_CLI_ENABLED=true
AI_ENGINE=gemini-cli

# Embeddings locais
USE_LOCAL_EMBEDDINGS=true
LOCAL_EMBEDDING_MODEL=Xenova/multilingual-e5-small

# Ollama para análise mais profunda
OLLAMA_ENABLED=true
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=tinyllama

# Preferir local
AI_PREFER_LOCAL=true
```

### 3. Iniciar

```bash
npm run dev
```

✅ **Gemini CLI + Embeddings Locais + Ollama LLM = AI Completa & Rápida**

---

## 🔧 Configurações por Máquina

### Máquina Leve (2-4GB)
```env
# Gemini CLI (sempre disponível, sem custo local)
GEMINI_CLI_ENABLED=true

# Embeddings leves
USE_LOCAL_EMBEDDINGS=true
LOCAL_EMBEDDING_MODEL=Xenova/gte-small  # 133MB, rápido

# Pular Ollama (economiza RAM)
OLLAMA_ENABLED=false
```

### Máquina Normal (4-8GB)
```env
# Gemini CLI
GEMINI_CLI_ENABLED=true
AI_ENGINE=gemini-cli

# Embeddings bons
USE_LOCAL_EMBEDDINGS=true
LOCAL_EMBEDDING_MODEL=Xenova/multilingual-e5-small  # 440MB

# Ollama para análise complexa
OLLAMA_ENABLED=true
OLLAMA_MODEL=tinyllama  # 440MB
AI_PREFER_LOCAL=true
```

### Máquina Poderosa (8GB+)
```env
# Gemini CLI
GEMINI_CLI_ENABLED=true
AI_ENGINE=gemini-cli

# Embeddings premium
USE_LOCAL_EMBEDDINGS=true
LOCAL_EMBEDDING_MODEL=Xenova/multilingual-e5-base  # 1.1GB, excelente

# Ollama premium
OLLAMA_ENABLED=true
OLLAMA_MODEL=gemma:2b  # 1.4GB, qualidade superior
AI_PREFER_LOCAL=true
```

---

## 📊 Monitorar Status

### Verificar que tudo está funcionando

```bash
# Em novo terminal
curl http://localhost:3000/api/status

# Deve retornar:
# {
#   "status": "ok",
#   "database": "connected",
#   "local_embeddings": "ready",
#   "ollama": "connected",
#   "gemini": "available (fallback)"
# }
```

### Ver logs da IA local

```bash
# Terminal onde rodou npm run dev
tail -f logs/ai-engine.log

# Deve mostrar:
# [info] Using local embeddings for content analysis
# [debug] Embedding created: 384 dimensions, 87ms
# [info] Found 3 linked notes locally
```

---

## 🎯 Casos de Uso

### Case 1: Escritor Profissional
```env
GEMINI_CLI_ENABLED=true        # IA rápida via CLI
USE_LOCAL_EMBEDDINGS=true
LOCAL_EMBEDDING_MODEL=Xenova/multilingual-e5-small
OLLAMA_ENABLED=true
OLLAMA_MODEL=phi                # Análise de qualidade
AI_PREFER_LOCAL=true
```
✅ IA rápida & offline, análise profunda local

### Case 2: Pesquisador (RAM Limitada)
```env
GEMINI_CLI_ENABLED=true        # CLI sempre funciona
USE_LOCAL_EMBEDDINGS=true
LOCAL_EMBEDDING_MODEL=Xenova/gte-small  # Leve
OLLAMA_ENABLED=false
```
✅ Busca eficiente, análise pelo CLI

### Case 3: Full Local-First
```env
GEMINI_CLI_ENABLED=true        # CLI como primário
USE_LOCAL_EMBEDDINGS=true
LOCAL_EMBEDDING_MODEL=Xenova/multilingual-e5-base
OLLAMA_ENABLED=true
OLLAMA_MODEL=gemma:2b
AI_PREFER_LOCAL=true
```
✅ Completamente offline, zero APIs externas

## 📈 Performance Esperada

### Com Gemini CLI
- Latência: ~500ms (muito rápido)
- Setup: 1× login (não repete)
- Custo: Zero (usa sessão autenticada)
- Qualidade: Excelente

### Com Embeddings Locais (Xenova)
- Primeira nota: ~2-3s (carrega modelo)
- Notas seguintes: ~50-100ms cada
- Lote de 100 notas: ~5-10s total

### Com Ollama Local
- Análise: ~200-500ms
- Geração de sumário: ~1-2s
- Qualidade: Ótima

---

## 🎓 Aprender Mais

- [GEMINI_CLI_SETUP.md](./GEMINI_CLI_SETUP.md) - Setup detalhado do CLI
- [LOCAL_MODELS.md](./LOCAL_MODELS.md) - Documentação técnica de modelos
- [AI_ENGINE.md](./AI_ENGINE.md) - Arquitetura do motor de IA

---

## ✅ Checklist Final

- [ ] `npm install -g @google/generative-ai-cli`
- [ ] `gemini-cli login` (abre navegador)
- [ ] `gemini-cli status` (deve mostrar "Authenticated")
- [ ] `npm install` (dependências)
- [ ] Configurar `.env` com valores acima
- [ ] `npm run dev` (start)
- [ ] Ver logs: `✅ Gemini CLI authenticated`
- [ ] Criar primeira nota (IA processará automaticamente)

---

**Pronto!** Obsidian Clone está rodando com IA autêntica, rápida e privada. 🚀
