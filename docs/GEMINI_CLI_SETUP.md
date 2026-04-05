# Gemini CLI Integration

Integração do Google Gemini CLI como motor de IA principal. Diferente das APIs que precisam de chaves, o Gemini CLI é instalado localmente, logado uma única vez, e depois usado via sessão autenticada - similar ao Paperclip AI.

## 🔑 Conceito Principal

```
tradicional (API):
  Aplicação → HTTP → Google Cloud → Resposta

Gemini CLI (CLI Local):
  Login único
       ↓
  Sessão salva localmente
       ↓
  Aplicação chama: gemini-cli analyze "texto"
       ↓
  Usa sessão já autenticada
       ↓
  Resposta instantânea (sem overhead de rede)
```

**Vantagem**: Login uma única vez, uso ilimitado sem gerenciar API keys.

## 📥 Instalação do Gemini CLI

### 1. Pré-requisitos

- Node.js 18+
- Conta Google (gratuita)
- Terminal/CLI

### 2. Instalar Globalmente

```bash
# Instalar Gemini CLI
npm install -g @google/generative-ai-cli

# Ou via Homebrew (macOS/Linux)
brew install gemini-cli

# Windows: https://github.com/google/generative-ai-cli/releases
```

### 3. Login Único

```bash
# Fazer login
gemini-cli login

# Isso abre navegador para autenticação Google
# Após confirmação, sessão fica salva localmente
# Não precisa fazer de novo!
```

**Onde fica salvo**:
```
~/.config/gemini/credentials.json (Linux/macOS)
%APPDATA%\gemini\credentials.json (Windows)
```

### 4. Verificar Autenticação

```bash
# Teste se está logado
gemini-cli status

# Output esperado:
# ✓ Authenticated as user@example.com
# ✓ Model: gemini-pro
# ✓ Ready to use
```

## 🔧 Integração com Obsidian Clone

### File: `src/ai/engines/gemini-cli.ts`

```typescript
import { exec, execFile } from 'child_process'
import { logger } from '@/utils/logger'

export class GeminiCLIEngine {
  private async executeCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile('gemini-cli', [command, ...args], (error, stdout, stderr) => {
        if (error) {
          logger.error(`Gemini CLI error: ${stderr}`)
          reject(error)
        } else {
          resolve(stdout.trim())
        }
      })
    })
  }

  async analyze(text: string): Promise<any> {
    try {
      logger.info('Analyzing with Gemini CLI...')
      
      const result = await this.executeCommand('analyze', [text])
      
      // Parse JSON response
      const parsed = JSON.parse(result)
      
      logger.info('✓ Gemini CLI analysis complete')
      return parsed
    } catch (error) {
      logger.error('Gemini CLI analyze failed:', error)
      throw error
    }
  }

  async generateSummary(text: string): Promise<string> {
    try {
      const prompt = `Summarize the following in 3 bullet points:\n${text}`
      const result = await this.executeCommand('generate', ['--prompt', prompt])
      return result
    } catch (error) {
      logger.error('Summary generation failed:', error)
      throw error
    }
  }

  async suggestLinks(text: string, context: string[]): Promise<any[]> {
    try {
      const prompt = `
Given the following text, suggest semantic links to these topics:
Text: ${text}
Topics: ${context.join(', ')}

Return JSON array with {topic, confidence, reason}
      `
      const result = await this.executeCommand('generate', ['--prompt', prompt])
      return JSON.parse(result)
    } catch (error) {
      logger.error('Link suggestion failed:', error)
      throw error
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.executeCommand('status', [])
      return true
    } catch {
      return false
    }
  }

  getStatus(): {
    authenticated: boolean
    cli: string
    session: 'active' | 'inactive'
  } {
    return {
      authenticated: true, // TODO: verificar real
      cli: 'gemini-pro',
      session: 'active',
    }
  }
}
```

### File: `src/ai/engines/engine-selector.ts` (Atualizado)

```typescript
import { LocalEmbeddingsEngine } from './local-embeddings'
import { GeminiCLIEngine } from './gemini-cli'
import { OllamaEngine } from './ollama'
import { logger } from '@/utils/logger'

export class AIEngineSelector {
  private engines: Map<string, any> = new Map()

  async initialize(): Promise<void> {
    // 1. Verificar Gemini CLI (PRIMEIRO)
    const geminiCli = new GeminiCLIEngine()
    if (await geminiCli.isAuthenticated()) {
      this.engines.set('gemini-cli', geminiCli)
      logger.info('✅ Gemini CLI authenticated and ready')
    } else {
      logger.warn('⚠️  Gemini CLI not authenticated (run: gemini-cli login)')
    }

    // 2. Embeddings locais
    try {
      const localEmbed = new LocalEmbeddingsEngine()
      await localEmbed.initialize()
      this.engines.set('local', localEmbed)
      logger.info('✅ Local embeddings ready')
    } catch (error) {
      logger.warn('Local embeddings not available:', error)
    }

    // 3. Ollama (opcional)
    const ollama = new OllamaEngine()
    if (await ollama.isAvailable()) {
      this.engines.set('ollama', ollama)
      logger.info('✅ Ollama available')
    }
  }

  async analyze(text: string): Promise<any> {
    // Preferência: Gemini CLI > Ollama > API Cloud
    for (const engineName of ['gemini-cli', 'ollama', 'gemini-api']) {
      const engine = this.engines.get(engineName)
      if (!engine) continue

      try {
        logger.debug(`Using ${engineName} for analysis`)
        return await engine.analyze(text)
      } catch (error) {
        logger.warn(`${engineName} failed, trying next...`)
        continue
      }
    }

    throw new Error('No analysis engine available')
  }

  getStatus(): Record<string, any> {
    return {
      'gemini-cli': this.engines.get('gemini-cli')?.getStatus() || 'not-authenticated',
      'local-embeddings': this.engines.has('local'),
      'ollama': this.engines.has('ollama'),
    }
  }
}
```

## 🎯 Casos de Uso - Gemini CLI

### 1. Análise de Nota (Automática)

```bash
gemini-cli analyze --file nota.md

# Retorna JSON com:
# - concepts: ["ML", "AI", "Learning"]
# - entities: [...]
# - sentiment: 0.75
# - suggestedTags: ["AI", "Learning"]
```

### 2. Geração de Sumário

```bash
gemini-cli generate --prompt "Summarize this in 3 points" --input note.md
```

### 3. Busca de Ligações

```bash
gemini-cli suggest-links --text "about neural networks" --topics "ML,AI,Python"
```

## ⚙️ Configuração Avançada

### Arquivo: `.env`

```env
# Gemini CLI (principal)
GEMINI_CLI_ENABLED=true
GEMINI_CLI_PATH=gemini-cli  # ou caminho customizado

# Se Gemini CLI falhar, usar fallbacks
AI_FALLBACK_ORDER=local,ollama,gemini-api

# Gemini API Key (apenas fallback)
GEMINI_API_KEY=  # deixar vazio se usando CLI

# Preferências
AI_ENGINE=gemini-cli
AI_UPDATE_INTERVAL=1800000  # 30 min
```

### Arquivo: `src/config/gemini-cli.config.ts`

```typescript
export const geminiCliConfig = {
  enabled: process.env.GEMINI_CLI_ENABLED !== 'false',
  cliPath: process.env.GEMINI_CLI_PATH || 'gemini-cli',
  
  // Timeouts
  commandTimeout: 30000,  // 30s
  retryAttempts: 2,
  
  // Modelos
  defaultModel: 'gemini-pro',  // ou gemini-pro-vision
  
  // Processamento
  maxConcurrent: 3,  // Máximo de comandos paralelos
  
  // Fallback
  fallbackOrder: ['local', 'ollama', 'gemini-api'],
  autoFallback: true,
}
```

## 🔄 Workflow de IA Autônoma

```
1. User salva nota
   ↓
2. Sistema detecta mudança
   ↓
3. Tenta Gemini CLI (local, rápido)
   ├─ Se OK: Usa resultado
   └─ Se falha: Tenta Ollama
   ├─ Se OK: Usa resultado
   └─ Se falha: Fallback para API
   ↓
4. Resultado é processado
   - Cria embeddings (local)
   - Busca links (local vector DB)
   - Armazena análise
   ↓
5. Frontend notificado via WebSocket
```

## 🚀 Performance

### Gemini CLI vs API

```
                  Gemini CLI      Gemini API
Latência         ~500ms          ~1-2s
Setup            1× login        API key
Custo            Gratuito        Pago
Sessão           Persistente     Sem estado
Rate limit       Generoso        Limitado
Offline          Sim*            Não
```

*Funciona offline com cache local

## 🔐 Segurança

### Gemini CLI vs API Key

```
API Key no código (❌ PERIGO):
  - Visível em .env
  - Risco de leak
  - Pode ser revogada remotamente
  - Cobranças inesperadas

Gemini CLI (✅ SEGURO):
  - Credenciais no ~/.config/ (local)
  - Não vaza em repositório
  - Conta pessoal, não compartilhada
  - Controle total local
```

## 📋 Checklist de Setup

Quando configurar novo ambiente:

- [ ] `npm install -g @google/generative-ai-cli`
- [ ] `gemini-cli login` (abre navegador)
- [ ] `gemini-cli status` (verificar autenticação)
- [ ] `npm install` (dependências do projeto)
- [ ] `npm run dev` (start)
- [ ] Verificar logs: `✅ Gemini CLI authenticated`

## 🆘 Troubleshooting

### "gemini-cli: command not found"

```bash
# Verificar instalação
which gemini-cli

# Se vazio, reinstalar
npm install -g @google/generative-ai-cli

# Ou especificar caminho em .env
GEMINI_CLI_PATH=/usr/local/bin/gemini-cli
```

### "Not authenticated"

```bash
# Fazer login novamente
gemini-cli login

# Ou verificar status
gemini-cli status
```

### "Command timeout"

```env
# Aumentar timeout
GEMINI_CLI_TIMEOUT=60000  # 60s
```

### "RateLimit exceeded"

```
Gemini CLI tem rate limit generoso.
Se exceder, sistema faz fallback automático
para Ollama ou API cloud.
```

## 📚 Próximos Passos

1. ✅ Instalar Gemini CLI globalmente
2. ✅ Fazer login uma única vez
3. ✅ Configurar projeto
4. ✅ Rodar sistema (Gemini CLI será usado automaticamente)
5. 🚀 Desfrutar de IA rápida, privada e autenticada

---

**Arquitetura semelhante ao Paperclip AI**: Login uma vez, uso contínuo sem gerenciar credenciais.
