import 'reflect-metadata';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'dcms_user',
  password: process.env.DB_PASSWORD || 'dcms_secure_password',
  database: process.env.DB_NAME || 'dcms_db',

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],

  synchronize: false,
});

export default dataSource;