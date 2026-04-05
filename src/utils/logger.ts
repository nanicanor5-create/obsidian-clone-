/**
 * Logger Configuration
 * 
 * Configuração centralizada de logging usando Pino
 */

import pino from 'pino'

// Criar logger base
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: false,
            messageFormat: '{levelLabel} - {msg}',
          },
        }
      : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
})

// Criar loggers especializados
export const aiLogger = logger.child({ module: 'ai-engine' })
export const dbLogger = logger.child({ module: 'database' })
export const apiLogger = logger.child({ module: 'api' })

export default logger
