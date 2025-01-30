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
import * as steganographie from 'steganographie';
import * as fs from 'fs';
import { createReadStream } from 'fs';
import { Response } from 'express';

@Controller('files')
export class FilesController {
    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        private readonly usersService: UsersService,

    ) {}

    @UseGuards(AuthGuard('jwt'))
    @Get('user-images')
    async getUserImages(@Request() req) {
        if (!req.user) {
            throw new BadRequestException('User non connecté');
        }
        const user = await this.usersService.findOneById(req.user.id);
        const files = await this.fileRepository.find({ where: { user: user }, relations: ['user'] });

        return files.map(file => ({
            firtname: file.user.firstName,
            lastname: file.user.lastName,
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
        }));
    }

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
    async uploadFile(@UploadedFile() file, @Request() req, @Res() res: Response) {
        if (!req.user) {
            throw new BadRequestException('User non connecté');
        }
        const user = await this.usersService.findOneById(req.user.id);
        
        // Lire l'image originale
        const originalImage = fs.readFileSync(file.path);

        // Générer le message à cacher (ID de l'utilisateur)
        const message = `UserID: ${user.id}`;

        // Définir le chemin pour l'image modifiée
        const modifiedImagePath = `src/uploads/modified_${file.filename}`;

        // Créer l'image modifiée avec le message caché
        await new Promise((resolve, reject) => {
            steganographie.conceal({
                input: file.path,
                output: modifiedImagePath,
                text: message,
                method: 'simple'
            }, (err, res) => {
                if (err) {
                    reject(new BadRequestException('Erreur lors de la création de l\'image modifiée'));
                } else {
                    resolve(res);
                }
            });
        });

        // Créer un enregistrement pour l'image originale
        const originalFile = this.fileRepository.create({
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
            user: user,
        });
        await this.fileRepository.save(originalFile);

        // Créer un enregistrement pour l'image modifiée
        const modifiedFile = this.fileRepository.create({
            filename: `modified_${file.filename}`,
            path: modifiedImagePath,
            mimetype: file.mimetype,
            size: file.size,
            user: user,
        });
        await this.fileRepository.save(modifiedFile);

        // Renvoyer l'image modifiée
        const modifiedImageStream = createReadStream(modifiedImagePath);
        res.set({
            'Content-Type': file.mimetype,
            'Content-Disposition': `attachment; filename="modified_${file.filename}"`,
        });
        modifiedImageStream.pipe(res);
    }
}