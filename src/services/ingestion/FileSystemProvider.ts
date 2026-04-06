/**
 * FileSystem Ingestion Provider
 * 
 * Ingere notas markdown do sistema de arquivos local
 * Inspirado no conceito de "Pluggable Data Providers" do Knowledge Nexus
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { createHash } from 'crypto'
import { logger } from '../../utils/logger'

export interface FileMetadata {
  filePath: string
  size: number
  modifiedAt: Date
  createdAt: Date
  checksum: string
}

export interface ParsedMarkdown {
  title: string
  content: string
  tags: string[]
  links: string[] // Links para outras notas [[link]]
  frontmatter: Record<string, any>
}

export class FileSystemProvider {
  private supportedExtensions = ['.md', '.markdown', '.mdx']

  /**
   * Calcula checksum do conteúdo para detecção de mudanças
   */
  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex')
  }

  /**
   * Verifica se é um arquivo markdown suportado
   */
  private isMarkdownFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase()
    return this.supportedExtensions.includes(ext)
  }

  /**
   * Escaneia diretório recursivamente em busca de markdowns
   */
  async scanDirectory(rootPath: string): Promise<FileMetadata[]> {
    const files: FileMetadata[] = []
    
    try {
      const scan = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          if (entry.isDirectory()) {
            // Ignora node_modules, .git, etc
            if (['node_modules', '.git', '.next', 'dist'].includes(entry.name)) {
              continue
            }
            await scan(fullPath)
          } else if (entry.isFile() && this.isMarkdownFile(fullPath)) {
            const stats = await fs.stat(fullPath)
            const content = await fs.readFile(fullPath, 'utf-8')
            
            files.push({
              filePath: fullPath,
              size: stats.size,
              modifiedAt: stats.mtime,
              createdAt: stats.birthtime,
              checksum: this.calculateChecksum(content)
            })
          }
        }
      }

      await scan(rootPath)
      logger.info(`📁 Scanned ${files.length} markdown files in ${rootPath}`)
      
      return files
    } catch (error) {
      logger.error(`Failed to scan directory ${rootPath}:`, error)
      throw error
    }
  }

  /**
   * Lê e faz parse de um arquivo markdown
   * Extrai título, conteúdo, tags e links
   */
  async parseMarkdown(filePath: string): Promise<ParsedMarkdown> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return this.parseMarkdownContent(content)
    } catch (error) {
      logger.error(`Failed to parse markdown ${filePath}:`, error)
      throw error
    }
  }

  /**
   * Parse do conteúdo markdown
   * Suporta frontmatter YAML e Obsidian-style links [[link]]
   */
  parseMarkdownContent(content: string): ParsedMarkdown {
    let frontmatter: Record<string, any> = {}
    let body = content

    // Extrai frontmatter YAML (se existir)
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/)
    if (frontmatterMatch) {
      const yamlContent = frontmatterMatch[1]
      try {
        // Parse YAML simples (em produção usar js-yaml)
        frontmatter = this.parseSimpleYAML(yamlContent)
        body = content.replace(frontmatterMatch[0], '')
      } catch (e) {
        logger.warn('Failed to parse frontmatter:', e)
      }
    }

    // Extrai título (primeiro H1 ou do frontmatter)
    const title = frontmatter.title || 
                  body.match(/^#\s+(.+)$/m)?.[1] ||
                  'Untitled'

    // Extrai tags (#tag ou tags: no frontmatter)
    const tags = [
      ...(frontmatter.tags || []),
      ...(body.match(/#(\w[-\w]*)/g) || []).map(t => t.substring(1))
    ]

    // Extrai links Obsidian-style [[link]]
    const links = (body.match(/\[\[([^\]]+)\]\]/g) || [])
      .map(l => l.replace(/\[\[|\]\]/g, ''))

    return {
      title,
      content: body.trim(),
      tags: [...new Set(tags)], // Remove duplicatas
      links,
      frontmatter
    }
  }

  /**
   * Parse YAML simples para frontmatter
   * (Em produção, usar biblioteca js-yaml)
   */
  private parseSimpleYAML(yaml: string): Record<string, any> {
    const result: Record<string, any> = {}
    
    const lines = yaml.split('\n')
    for (const line of lines) {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim()
        let value = line.substring(colonIndex + 1).trim()
        
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        
        // Parse arrays [item1, item2]
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(s => s.trim())
        }
        
        // Parse booleans
        if (value === 'true') value = true
        if (value === 'false') value = false
        
        result[key] = value
      }
    }
    
    return result
  }

  /**
   * Gera slug único a partir do título ou nome do arquivo
   */
  generateSlug(filePath: string, title?: string): string {
    const baseName = title || path.basename(filePath, path.extname(filePath))
    return baseName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  /**
   * Detecta mudanças entre versão atual e anterior
   */
  detectChanges(oldChecksum: string | undefined, newChecksum: string): {
    hasChanged: boolean
    isNew: boolean
  } {
    return {
      hasChanged: oldChecksum !== newChecksum,
      isNew: !oldChecksum
    }
  }
}
