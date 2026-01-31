import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { R2StorageService } from '../services/r2-storage.service';
import { LocalStorageService } from '../services/local-storage.service';
import { STORAGE_SERVICE_TOKEN } from '../interfaces/storage.interface';

/**
 * Storage Module - Provides flexible storage abstraction
 *
 * Configured via environment variable: STORAGE_PROVIDER
 * - 'r2' (default) - Cloudflare R2
 * - 'local' - Local file system
 * - 's3' - AWS S3 (future)
 * - 'azure' - Azure Blob Storage (future)
 */
@Global()
@Module({
  providers: [
    R2StorageService,
    LocalStorageService,
    {
      provide: STORAGE_SERVICE_TOKEN,
      useFactory: (
        configService: ConfigService,
        r2Storage: R2StorageService,
        localStorage: LocalStorageService,
      ) => {
        const provider = configService.get<string>('STORAGE_PROVIDER') || 'r2';

        switch (provider.toLowerCase()) {
          case 'local':
            return localStorage;
          case 'r2':
          default:
            return r2Storage;
        }
      },
      inject: [ConfigService, R2StorageService, LocalStorageService],
    },
  ],
  exports: [STORAGE_SERVICE_TOKEN, R2StorageService, LocalStorageService],
})
export class StorageModule {}
