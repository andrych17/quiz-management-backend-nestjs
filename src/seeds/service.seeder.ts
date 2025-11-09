import { ConfigItem } from '../entities/config-item.entity';
import { DataSource } from 'typeorm';

export class ServiceSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const configItemRepository = this.dataSource.getRepository(ConfigItem);

    const services = [
      {
        group: 'service',
        key: 'sm',
        value: 'Service Management',
        description: 'Departemen Service Management - pengelolaan layanan pelanggan',
        order: 1,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'am',
        value: 'Account Management',
        description: 'Departemen Account Management - pengelolaan akun pelanggan',
        order: 2,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'technical_support',
        value: 'Technical Support',
        description: 'Departemen Technical Support - dukungan teknis pelanggan',
        order: 3,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'network_operation',
        value: 'Network Operation',
        description: 'Departemen Network Operation - operasional jaringan',
        order: 4,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'customer_service',
        value: 'Customer Service',
        description: 'Departemen Customer Service - layanan pelanggan',
        order: 5,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'it_support',
        value: 'IT Support',
        description: 'Departemen IT Support - dukungan teknologi informasi',
        order: 6,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'business_development',
        value: 'Business Development',
        description: 'Departemen Business Development - pengembangan bisnis',
        order: 7,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'quality_assurance',
        value: 'Quality Assurance',
        description: 'Departemen Quality Assurance - jaminan kualitas',
        order: 8,
        isActive: true,
        createdBy: 'system',
      },
      {
        group: 'service',
        key: 'all_services',
        value: 'All Services',
        description: 'Akses ke semua departemen (SuperAdmin)',
        order: 999,
        isActive: true,
        createdBy: 'system',
      },
    ];

    for (const serviceData of services) {
      try {
        // Check if service already exists
        const existingService = await configItemRepository.findOne({
          where: {
            group: serviceData.group,
            key: serviceData.key,
          },
        });

        if (existingService) {
          console.log(`➡️ Service already exists: ${serviceData.value}`);
          continue;
        }

        // Create new service
        const newService = configItemRepository.create(serviceData);
        await configItemRepository.save(newService);
        console.log(`✅ Created service: ${serviceData.value}`);
      } catch (error) {
        console.error(`❌ Error creating service ${serviceData.value}:`, error.message);
      }
    }

    console.log('✅ Service data seeding completed!');
  }
}