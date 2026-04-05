/**
 * Main Entry Point
 * 
 * Inicializa a aplicação e todos os serviços
 */

import 'dotenv/config'
import { logger } from './utils/logger'
import { createServer } from './server'
import { initializeAIEngine } from './ai/orchestrator'
import { initializeDatabase } from './config/database'

async function bootstrap(): Promise<void> {
  try {
    logger.info('🚀 Starting Obsidian Clone...')

    // 1. Connect to database
    logger.info('📊 Initializing database...')
    await initializeDatabase()
    logger.info('✅ Database connected')

    // 2. Create Express server
    logger.info('🔧 Creating API server...')
    const { app, server } = createServer()

    // 3. Initialize AI Engine
    logger.info('🤖 Initializing AI Engine...')
    const aiEngine = await initializeAIEngine()
    logger.info('✅ AI Engine ready')

    // 4. Start server
    const PORT = process.env.PORT || 3000
    server.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🎉 Obsidian Clone is running!                     ║
║                                                           ║
║        API:              http://localhost:${PORT}          ║
║        Docs:             http://localhost:${PORT}/docs     ║
║        AI Dashboard:     http://localhost:${PORT}/ai       ║
║                                                           ║
║        Version: 0.1.0-alpha                              ║
║        Mode: ${process.env.NODE_ENV || 'development'}                            ║
║        AI Engine: ${process.env.AI_PRIMARY_ENGINE || 'gemini'}                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `)
    })

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.warn('SIGTERM received, shutting down gracefully...')
      server.close(() => {
        logger.info('Server closed')
        process.exit(0)
      })
    })

    process.on('SIGINT', async () => {
      logger.warn('SIGINT received, shutting down gracefully...')
      server.close(() => {
        logger.info('Server closed')
        process.exit(0)
      })
    })
  } catch (error) {
    logger.error('Failed to start application:', error)
    process.exit(1)
  }
}

bootstrap()
