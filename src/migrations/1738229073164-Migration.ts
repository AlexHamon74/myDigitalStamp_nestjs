import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1738229073164 implements MigrationInterface {
    name = 'Migration1738229073164'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`files\` ADD \`userId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`files\` ADD CONSTRAINT \`FK_7e7425b17f9e707331e9a6c7335\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`files\` DROP FOREIGN KEY \`FK_7e7425b17f9e707331e9a6c7335\``);
        await queryRunner.query(`ALTER TABLE \`files\` DROP COLUMN \`userId\``);
    }

}
