import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedAdminUser1710000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('Admin123!', saltRounds);

    await queryRunner.query(
      `INSERT INTO users (email, password_hash, full_name, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING;`,
      ['admin@dcms.com', hashedPassword, 'System Admin', true],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM users WHERE email = $1;`, [
      'admin@dcms.com',
    ]);
  }
}