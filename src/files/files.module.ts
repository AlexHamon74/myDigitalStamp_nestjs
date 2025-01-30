import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from "./files.controller";
import { File } from "./files.entity";

@Module({
    imports: [TypeOrmModule.forFeature([File])],
    controllers: [FilesController],
})
export class FilesModule {}