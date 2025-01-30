import { Controller, Post, UploadedFile, UseInterceptors, Get, Param, Res, Request, UseGuards, BadRequestException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from 'multer';
import { extname } from 'path';
import { File } from "./files.entity";
import { Public } from "../auth/decorators/public.decorator";
import { UsersService } from "../users/users.service";
import { AuthGuard } from '@nestjs/passport';

@Controller('files')
export class FilesController {
    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        private readonly usersService: UsersService,

    ) {}

    @UseGuards(AuthGuard('jwt'))
    // @Public()
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: 'src/uploads',
            filename: (req, file, cb) => {
                const name = file.originalname.split('.')[0];
                const fileExtName = extname(file.originalname);
                cb(null, `${name}${fileExtName}`);
            },
        }),
    }))
    async uploadFile(@UploadedFile() file, @Request() req) {
        if (!req.user) {
            throw new BadRequestException('User non connecté');
        }
        const user = await this.usersService.findOneById(req.user.id);
        const newFile = this.fileRepository.create({
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
            user: user,
        });
        await this.fileRepository.save(newFile);
        return { message: 'Fichier enregistré' };
    }
}