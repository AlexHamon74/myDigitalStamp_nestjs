import { Controller, Post, UploadedFile, UseInterceptors, Get, Res, Request, UseGuards, BadRequestException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from 'multer';
import { extname } from 'path';
import { File } from "./files.entity";
import { UsersService } from "../users/users.service";
import { AuthGuard } from '@nestjs/passport';
import * as fs from 'fs';
import { createReadStream } from 'fs';
import { Response } from 'express';
import { PNG } from 'pngjs';

@Controller('files')
export class FilesController {
    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        private readonly usersService: UsersService,

    ) {}

    // Route pour visualiser les images liées à l'utilisateur connecté
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

    // Route pour télécharger l'image originale et l'image modifiée par stéganographie
    // sur le serveur et en base de données
    @UseGuards(AuthGuard('jwt'))
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

        // Vérifier si le fichier est un PNG
        if (!this.isValidPng(originalImage)) {
            throw new BadRequestException("Le fichier téléchargé n'est pas un PNG");
        }

        // Générer le message à cacher (ID de l'utilisateur)
        const message = `${user.id}`;

        // Définir le chemin pour l'image modifiée
        const modifiedImagePath = `src/uploads/modified_${file.filename}`;

        // Créer l'image modifiée avec le message caché
        await this.hideMessageInImage(file.path, modifiedImagePath, message);

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

    // Route pour révéler le message caché dans l'image si elle est modifiée
    @UseGuards(AuthGuard('jwt'))
    @Post('reveal')
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
    async uploadModifiedFile(@UploadedFile() file, @Request() req, @Res() res: Response) {
        if (!req.user) {
            throw new BadRequestException("User non connecté");
        }

        // Lire l'image modifiée
        const modifiedImage = fs.readFileSync(file.path);

        // Vérifier si le fichier est un PNG valide
        if (!this.isValidPng(modifiedImage)) {
            throw new BadRequestException("Le fichier téléchargé n'est pas un PNG valide");
        }

        // Récupérer le message caché
        const hiddenMessage = this.revealMessageFromImage(file.path);

        // Vérifier si le message caché est un ID valide
        const userId = parseInt(hiddenMessage, 10);
        if (isNaN(userId)) {
            res.json({ message: "Cette image n'a pas été modifiée" });
        } else {
            const user = await this.usersService.findOneById(userId.toString() as `${string}-${string}-${string}-${string}-${string}`);
            if (!user) {
                throw new BadRequestException("Utilisateur non trouvé");
            }

            // Augmenter le compteur de vérification
            const fileRecord = await this.fileRepository.findOne({ where: { path: file.path } });
            if (fileRecord) {
                fileRecord.verificationCount += 1;
                await this.fileRepository.save(fileRecord);
            }

            res.json({
                firstName: user.firstName,
                lastName: user.lastName,
            });
        }
    }

    
    // -----------------------------------------
    // FONCTIONS UTILISES POUR LA STEGANOGRAPHIE
    // -----------------------------------------
    private async hideMessageInImage(inputPath: string, outputPath: string, message: string) {
        const png = PNG.sync.read(fs.readFileSync(inputPath));
        const messageBits = this.stringToBits(message);

        let bitIndex = 0;
        for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
                const idx = (png.width * y + x) << 2;
                if (bitIndex < messageBits.length) {
                    png.data[idx] = (png.data[idx] & 0xFE) | messageBits[bitIndex++];
                }
            }
        }

        fs.writeFileSync(outputPath, PNG.sync.write(png));
    }

    private revealMessageFromImage(inputPath: string): string {
        const png = PNG.sync.read(fs.readFileSync(inputPath));
        const bits = [];

        for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
                const idx = (png.width * y + x) << 2;
                bits.push(png.data[idx] & 1);
            }
        }

        return this.bitsToString(bits);
    }

    private bitsToString(bits: number[]): string {
        const chars = [];
        for (let i = 0; i < bits.length; i += 8) {
            const byte = bits.slice(i, i + 8).join('');
            chars.push(String.fromCharCode(parseInt(byte, 2)));
        }
        return chars.join('');
    }

    private stringToBits(str: string): number[] {
        const bits = [];
        for (let i = 0; i < str.length; i++) {
            const charBits = str.charCodeAt(i).toString(2).padStart(8, '0');
            for (let j = 0; j < charBits.length; j++) {
                bits.push(parseInt(charBits[j], 10));
            }
        }
        return bits;
    }

    private isValidPng(buffer: Buffer): boolean {
        try {
            PNG.sync.read(buffer);
            return true;
        } catch (e) {
            return false;
        }
    }
}