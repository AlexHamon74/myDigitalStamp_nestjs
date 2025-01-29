import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './users/users.entity';

dotenv.config({ path: '.env.local' });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User],
  migrations: ['src/migrations/*.ts'],
});
