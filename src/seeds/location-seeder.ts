import { DataSource } from 'typeorm';
import { ConfigItem } from '../entities/config-item.entity';

export async function seedLocationData(dataSource: DataSource) {
  const configRepository = dataSource.getRepository(ConfigItem);

  // Sample location data
  const locations = [
    {
      group: 'location',
      key: 'jakarta_pusat',
      value: 'Jakarta Pusat',
      description: 'DKI Jakarta - Jakarta Pusat',
      isActive: true,
      createdBy: 'system',
    },
    {
      group: 'location', 
      key: 'jakarta_selatan',
      value: 'Jakarta Selatan',
      description: 'DKI Jakarta - Jakarta Selatan',
      isActive: true,
      createdBy: 'system',
    },
    {
      group: 'location',
      key: 'jakarta_timur',
      value: 'Jakarta Timur', 
      description: 'DKI Jakarta - Jakarta Timur',
      isActive: true,
      createdBy: 'system',
    },
    {
      group: 'location',
      key: 'jakarta_barat',
      value: 'Jakarta Barat',
      description: 'DKI Jakarta - Jakarta Barat',
      isActive: true,
      createdBy: 'system',
    },
    {
      group: 'location',
      key: 'jakarta_utara',
      value: 'Jakarta Utara',
      description: 'DKI Jakarta - Jakarta Utara',
      isActive: true,
      createdBy: 'system',
    },
    {
      group: 'location',
      key: 'surabaya',
      value: 'Surabaya',
      description: 'Jawa Timur - Surabaya',
      isActive: true,
      createdBy: 'system',
    },
    {
      group: 'location',
      key: 'bandung',
      value: 'Bandung',
      description: 'Jawa Barat - Bandung',
      isActive: true,
      createdBy: 'system',
    },
    {
      group: 'location',
      key: 'medan',
      value: 'Medan',
      description: 'Sumatera Utara - Medan',
      isActive: true,
      createdBy: 'system',
    },
    {
      group: 'location',
      key: 'semarang',
      value: 'Semarang',
      description: 'Jawa Tengah - Semarang',
      isActive: true,
      createdBy: 'system',
    },
    {
      group: 'location',
      key: 'makassar',
      value: 'Makassar',
      description: 'Sulawesi Selatan - Makassar',
      isActive: true,
      createdBy: 'system',
    }
  ];

  // Check if locations already exist, if not, create them
  for (const locationData of locations) {
    const existingLocation = await configRepository.findOne({
      where: {
        group: locationData.group,
        key: locationData.key,
      },
    });

    if (!existingLocation) {
      const location = configRepository.create(locationData);
      await configRepository.save(location);
      console.log(`✅ Created location: ${locationData.value}`);
    } else {
      console.log(`➡️ Location already exists: ${locationData.value}`);
    }
  }

  console.log('✅ Location data seeding completed!');
}