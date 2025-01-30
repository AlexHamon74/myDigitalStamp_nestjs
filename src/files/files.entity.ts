import { User } from '../users/users.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity('files')
export class File {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    filename: string;

    @Column()
    path: string;

    @Column()
    mimetype: string;

    @Column()
    size: number;

    @ManyToOne(() => User, (user) => user.files, { onDelete: 'CASCADE' })
    user: User;

    @Column({ default: 0 })
    verificationCount: number;
}