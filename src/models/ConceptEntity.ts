/**
 * Concept Entity
 * 
 * Representa entidades/conceitos extraídos das notas (inspirado no Knowledge Nexus)
 * Exemplos: "Machine Learning", "TypeScript", "Graph Database"
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm'
import { Note } from './Note'

export enum EntityType {
  TOPIC = 'topic',        // Assuntos gerais: "AI", "Programming"
  PERSON = 'person',      // Pessoas mencionadas
  ORGANIZATION = 'organization', // Empresas, instituições
  LOCATION = 'location',  // Lugares
  EVENT = 'event',        // Eventos
  CONCEPT = 'concept',    // Conceitos abstratos
  TOOL = 'tool',          // Ferramentas, tecnologias
  PROJECT = 'project'     // Projetos
}

@Entity('entities')
export class ConceptEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  name!: string

  @Column({ 
    type: 'enum', 
    enum: EntityType,
    default: EntityType.CONCEPT 
  })
  type!: EntityType

  @Column('text', { nullable: true })
  description?: string

  @Column('simple-array', { nullable: true })
  aliases!: string[] // Nomes alternativos para a mesma entidade

  @Column('simple-json', { nullable: true })
  metadata?: Record<string, any>

  @ManyToMany(() => Note, note => note.entities)
  @JoinTable({
    name: 'note_entities',
    joinColumn: { name: 'entity_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'note_id', referencedColumnName: 'id' }
  })
  notes!: Note[]

  @Column('float', { nullable: true })
  confidence?: number // Confiança da extração (0-1)

  @Column({ default: 0 })
  mentionCount!: number // Quantas vezes foi mencionado em todas as notas

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  /**
   * Normaliza o nome da entidade para matching
   */
  normalizeName(): string {
    return this.name.toLowerCase().trim()
  }

  /**
   * Verifica se um alias ou nome corresponde
   */
  matches(query: string): boolean {
    const normalized = query.toLowerCase().trim()
    return (
      this.normalizeName() === normalized ||
      this.aliases.some(alias => alias.toLowerCase().trim() === normalized)
    )
  }
}
