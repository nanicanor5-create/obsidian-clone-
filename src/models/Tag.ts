/**
 * Tag Entity
 * 
 * Tags para categorização de notas
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany } from 'typeorm'
import { Note } from './Note'

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  name!: string

  @Column({ nullable: true })
  color?: string // Cor hex para UI

  @Column({ nullable: true })
  description?: string

  @Column({ default: 0 })
  usageCount!: number // Quantas notas usam esta tag

  @ManyToMany(() => Note, note => note.tags)
  notes!: Note[]

  @CreateDateColumn()
  createdAt!: Date

  /**
   * Formata o nome da tag com # prefix
   */
  get formattedName(): string {
    return `#${this.name}`
  }

  /**
   * Normaliza o nome para comparação
   */
  static normalizeName(name: string): string {
    return name.replace(/^#/, '').toLowerCase().trim().replace(/\s+/g, '-')
  }
}
