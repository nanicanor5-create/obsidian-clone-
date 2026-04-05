/**
 * AI Engine Configuration
 * 
 * Configurações centralizadas do motor de IA
 */

export interface AIEngineConfig {
  gemini: {
    apiKey: string
    model: string
    maxTokens: number
    temperature: number
    topP: number
  }
  fallback: {
    claude: {
      enabled: boolean
      apiKey?: string
    }
    openai: {
      enabled: boolean
      apiKey?: string
    }
  }
  processing: {
    updateInterval: number
    confidenceThreshold: number
    suggestionThreshold: number
    maxParallelTasks: number
  }
  automation: {
    autoLink: boolean
    autoTag: boolean
    insightGeneration: boolean
  }
  learning: {
    enableLearning: boolean
    feedbackWindow: number
    improvementThreshold: number
  }
}

export const aiEngineConfig: AIEngineConfig = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '2048'),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    topP: parseFloat(process.env.GEMINI_TOP_P || '0.95'),
  },
  fallback: {
    claude: {
      enabled: !!process.env.CLAUDE_API_KEY,
      apiKey: process.env.CLAUDE_API_KEY,
    },
    openai: {
      enabled: !!process.env.OPENAI_API_KEY,
      apiKey: process.env.OPENAI_API_KEY,
    },
  },
  processing: {
    updateInterval: parseInt(process.env.AI_UPDATE_INTERVAL || '1800000'),
    confidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.65'),
    suggestionThreshold: parseFloat(process.env.AI_SUGGESTION_THRESHOLD || '0.50'),
    maxParallel Tasks: parseInt(process.env.AI_MAX_PARALLEL_TASKS || '5'),
  },
  automation: {
    autoLink: process.env.AI_AUTO_LINK_ENABLED !== 'false',
    autoTag: process.env.AI_AUTO_TAG_ENABLED === 'true',
    insightGeneration: process.env.AI_INSIGHT_GENERATION_ENABLED !== 'false',
  },
  learning: {
    enableLearning: process.env.AI_ENABLE_LEARNING_LOOP !== 'false',
    feedbackWindow: parseInt(process.env.AI_FEEDBACK_WINDOW_HOURS || '24') * 60 * 60 * 1000,
    improvementThreshold: parseFloat(process.env.AI_IMPROVEMENT_THRESHOLD || '0.02'),
  },
}

export default aiEngineConfig
