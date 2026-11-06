import { DataSource } from 'typeorm';

export const resetTestDatabase = async (dataSource: DataSource): Promise<void> => {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  
  const entities = dataSource.entityMetadatas;
  const tableNames = entities.map((entity) => `"${entity.tableName}"`).join(', ');

  if (tableNames.length > 0) {
    await dataSource.query(`TRUNCATE TABLE ${tableNames} CASCADE;`);
  }
};