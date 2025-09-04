import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';

@Entity('Usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 255 })
  nombre: string;

  @Column("varchar", { length: 255, unique: true })
  email: string;

  @Column("timestamptz", { default: 'now()' })
  created_at: Date;

  @OneToMany(() => UsuarioRol, usuarioRol => usuarioRol.usuario)
  roles: UsuarioRol[];
}

@Entity('Rol')
export class Rol {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 255, unique: true })
  nombre: string;

  @OneToMany(() => UsuarioRol, usuarioRol => usuarioRol.rol)
  usuarios: UsuarioRol[];
}

@Entity('UsuarioRol')
export class UsuarioRol {
  @PrimaryColumn()
  usuario_id: number;

  @PrimaryColumn()
  rol_id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;
}

@Entity('Product')
@Index(['name', 'category'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 255 })
  name: string;

  @Column("varchar", { length: 100 })
  category: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column("boolean", { default: true })
  active: boolean;

  @Column("text", { nullable: true })
  description: string | null;
}
