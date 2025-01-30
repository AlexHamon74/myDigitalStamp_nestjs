import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1738234615232 implements MigrationInterface {
    name = 'Migration1738234615232'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`files\` ADD \`verificationCount\` int NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`files\` DROP COLUMN \`verificationCount\``);
    }

}
