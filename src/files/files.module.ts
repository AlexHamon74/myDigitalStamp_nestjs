import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from "./files.controller";
import { File } from "./files.entity";
import { UsersModule } from '../users/users.module';

@Module({
    imports: [TypeOrmModule.forFeature([File]), UsersModule],
    controllers: [FilesController],
    // providers: [UsersService], 
})
export class FilesModule {}