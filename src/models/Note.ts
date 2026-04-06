/**
 * Note Entity
 * 
 * Representa uma nota no sistema, inspirado no conceito de "Page" do Knowledge Nexus
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, ManyToOne } from 'typeorm'
import { Tag } from './Tag'
import { Entity as ConceptEntity } from './ConceptEntity'

export enum NoteSource {
  FILESYSTEM = 'filesystem',
  NOTION = 'notion',
  WEB = 'web',
  MANUAL = 'manual'
}

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  slug!: string

  @Column()
  title!: string

  @Column('text')
  content!: string

  @Column('text', { nullable: true })
  excerpt?: string

  @Column({ default: NoteSource.MANUAL })
  source!: NoteSource

  @Column({ nullable: true })
  sourceId?: string // ID na fonte original (ex: page_id do Notion)

  @Column({ nullable: true })
  filePath?: string // Caminho absoluto no filesystem

  @Column({ nullable: true })
  url?: string // URL se veio da web

  @Column('simple-json', { nullable: true })
  metadata?: Record<string, any>

  @Column({ default: false })
  isProcessed!: boolean // Se já passou pelo pipeline de IA

  @Column({ nullable: true })
  processedAt?: Date

  @Column({ nullable: true })
  lastSyncedAt?: Date // Última vez que foi sincronizado com a fonte

  @Column({ default: 0 })
  version!: number // Para controle de mudanças incrementais

  @ManyToMany(() => Tag, tag => tag.notes, { cascade: true })
  tags!: Tag[]

  @ManyToMany(() => ConceptEntity, entity => entity.notes, { cascade: true })
  entities!: ConceptEntity[]

  @ManyToOne(() => Note, { nullable: true })
  parent?: Note // Para hierarquia (ex: child pages do Notion)

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @Column({ nullable: true })
  checksum?: string // Hash do conteúdo para detectar mudanças

  /**
   * Verifica se a nota foi modificada desde o último processamento
   */
  hasChanged(newChecksum: string): boolean {
    return this.checksum !== newChecksum
  }

  /**
   * Extrai preview do conteúdo (primeiros 200 caracteres)
   */
  generateExcerpt(): string {
    const plainText = this.content
      .replace(/#+\s/g, '') // Remove headers
      .replace(/\*\*|__|\*|_/g, '') // Remove bold/italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .trim()
    
    return plainText.length > 200 
      ? plainText.substring(0, 200) + '...' 
      : plainText
  }
}
