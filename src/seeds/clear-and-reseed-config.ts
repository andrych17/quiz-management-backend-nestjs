import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { ConfigItem } from '../entities';

async function clearAndReseedConfig() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const configRepository = dataSource.getRepository(ConfigItem);
    
    // Delete all config items
    await configRepository.clear();
    console.log('✓ Cleared all config items');

    // Seed new config items
    const configs = [
      // Location config items
      {
        group: 'locations',
        key: 'surabaya',
        value: 'Surabaya',
        description: 'Surabaya location',
        order: 1,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        group: 'locations',
        key: 'jakarta',
        value: 'Jakarta',
        description: 'Jakarta location',
        order: 2,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        group: 'locations',
        key: 'makassar',
        value: 'Makassar',
        description: 'Makassar location',
        order: 3,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      // Service config items
      {
        group: 'services',
        key: 'a',
        value: 'A',
        description: 'Service A',
        order: 1,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        group: 'services',
        key: 'm',
        value: 'M',
        description: 'Service M',
        order: 2,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        group: 'services',
        key: 'am',
        value: 'AM',
        description: 'Service AM',
        order: 3,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        group: 'services',
        key: 'sm',
        value: 'SM',
        description: 'Service Management',
        order: 4,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ];

    await configRepository.save(configs);
    console.log(`✓ Seeded ${configs.length} config items`);
    console.log('✅ Config items refreshed successfully');
  } catch (error) {
    console.error('❌ Failed to refresh config items:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

clearAndReseedConfig();
