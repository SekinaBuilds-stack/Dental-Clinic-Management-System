import { vi } from 'vitest';

// Fake TypeORM QueryRunner + EntityManager.
// create(Entity, data) returns a copy of data; save(...) returns the saved object.
export function makeQueryRunner() {
  const manager = {
    create: vi.fn((_entity: any, data: any) => ({ ...data })),
    save: vi.fn(async (a: any, b?: any) => b ?? a),
    findOne: vi.fn(),
  };
  const queryRunner = {
    connect: vi.fn(),
    startTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
    release: vi.fn(),
    manager,
  };
  const dataSource = { createQueryRunner: vi.fn(() => queryRunner) };
  return { manager, queryRunner, dataSource };
}