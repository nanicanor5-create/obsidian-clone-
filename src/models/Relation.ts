/**
 * Relation Entity
 * 
 * Representa relações entre entidades no grafo de conhecimento
 * Inspirado nas relações do Neo4j do Knowledge Nexus
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Note } from './Note'
import { ConceptEntity } from './ConceptEntity'

export enum RelationType {
  MENTIONS = 'MENTIONS',           // Nota menciona entidade
  RELATED_TO = 'RELATED_TO',       // Entidade relacionada a outra
  SIMILAR_TO = 'SIMILAR_TO',       // Similaridade semântica
  PART_OF = 'PART_OF',             // Hierarquia (parte de)
  CONTAINS = 'CONTAINS',           // Hierarquia (contém)
  PRECEDES = 'PRECEDES',           // Relação temporal/causal
  CAUSED_BY = 'CAUSED_BY',         // Causalidade
  USED_BY = 'USED_BY',             // Ferramenta usada por projeto/pessoa
  CREATED_BY = 'CREATED_BY',       // Autoria
  TAGGED_WITH = 'TAGGED_WITH',     // Nota taggeada com conceito
  LINKS_TO = 'LINKS_TO',           // Link explícito entre notas
  EMBEDDING_SIMILAR = 'EMBEDDING_SIMILAR' // Similaridade por embedding
}

@Entity('relations')
export class Relation {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    type: 'enum',
    enum: RelationType
  })
  type!: RelationType

  @Column({ nullable: true })
  description?: string // Descrição opcional da relação

  @ManyToOne(() => Note, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_note_id' })
  sourceNote?: Note

  @ManyToOne(() => Note, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_note_id' })
  targetNote?: Note

  @ManyToOne(() => ConceptEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_entity_id' })
  sourceEntity?: ConceptEntity

  @ManyToOne(() => ConceptEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_entity_id' })
  targetEntity?: ConceptEntity

  @Column('float', { nullable: true })
  weight?: number // Peso/força da relação (0-1)

  @Column('float', { nullable: true })
  confidence?: number // Confiança na relação (0-1)

  @Column('simple-json', { nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn()
  createdAt!: Date

  /**
   * Valida se a relação tem pelo menos um par de origem/destino
   */
  isValid(): boolean {
    const hasNotes = this.sourceNote && this.targetNote
    const hasEntities = this.sourceEntity && this.targetEntity
    const hasMixed = (this.sourceNote || this.sourceEntity) && (this.targetNote || this.targetEntity)
    
    return hasNotes || hasEntities || hasMixed
  }

  /**
   * Retorna os IDs envolvidos na relação para indexação
   */
  getInvolvedIds(): { noteIds: string[], entityIds: string[] } {
    const noteIds: string[] = []
    const entityIds: string[] = []

    if (this.sourceNote?.id) noteIds.push(this.sourceNote.id)
    if (this.targetNote?.id) noteIds.push(this.targetNote.id)
    if (this.sourceEntity?.id) entityIds.push(this.sourceEntity.id)
    if (this.targetEntity?.id) entityIds.push(this.targetEntity.id)

    return { noteIds, entityIds }
  }
}
