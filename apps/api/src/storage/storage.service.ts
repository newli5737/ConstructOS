import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

export interface StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private localUploadDir = path.resolve(process.cwd(), 'public', 'uploads');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }
  }

  async getConfig(): Promise<StorageConfig> {
    const settings = await this.prisma.setting.findMany({
      where: {
        key: {
          in: [
            'r2_account_id',
            'r2_access_key_id',
            'r2_secret_access_key',
            'r2_bucket_name',
            'r2_public_domain',
          ],
        },
      },
    });

    const configMap = new Map(settings.map((s) => [s.key, s.value]));

    return {
      accountId: configMap.get('r2_account_id') || process.env.R2_ACCOUNT_ID || '',
      accessKeyId: configMap.get('r2_access_key_id') || process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: configMap.get('r2_secret_access_key') || process.env.R2_SECRET_ACCESS_KEY || '',
      bucketName: configMap.get('r2_bucket_name') || process.env.R2_BUCKET_NAME || 'constructos-storage',
      publicDomain: configMap.get('r2_public_domain') || process.env.R2_PUBLIC_DOMAIN || '',
    };
  }

  private getR2Client(cfg: StorageConfig): S3Client | null {
    if (!cfg.accountId || !cfg.accessKeyId || !cfg.secretAccessKey) {
      return null;
    }

    return new S3Client({
      region: 'auto',
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });
  }

  async uploadFile(file: Express.Multer.File, folder = 'products') {
    const cfg = await this.getConfig();
    const r2Client = this.getR2Client(cfg);

    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${Date.now()}-${safeName}`;

    // 1. If Cloudflare R2 is configured, upload directly to R2
    if (r2Client && cfg.bucketName) {
      try {
        const command = new PutObjectCommand({
          Bucket: cfg.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        });

        await r2Client.send(command);

        const publicUrl = cfg.publicDomain
          ? `${cfg.publicDomain.replace(/\/$/, '')}/${key}`
          : `https://${cfg.bucketName}.${cfg.accountId}.r2.cloudflarestorage.com/${key}`;

        this.logger.log(`Uploaded file to Cloudflare R2: ${key}`);

        return {
          success: true,
          storage: 'cloudflare_r2',
          key,
          url: publicUrl,
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        };
      } catch (err: any) {
        this.logger.error(`Error uploading to Cloudflare R2: ${err.message}. Falling back to local storage.`);
      }
    }

    // 2. Fallback to local storage if R2 is not yet configured
    const localFileName = `${Date.now()}-${safeName}`;
    const localFilePath = path.join(this.localUploadDir, localFileName);
    fs.writeFileSync(localFilePath, file.buffer);

    return {
      success: true,
      storage: 'local_fallback',
      key: `local/${localFileName}`,
      url: `/uploads/${localFileName}`,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      notice: 'Lưu trữ fallback tại máy chủ. Vui lòng cấu hình Cloudflare R2 trong Cài đặt hệ thống để lưu trực tiếp lên R2.',
    };
  }

  async testConnection(customConfig?: Partial<StorageConfig>) {
    const cfg = {
      ...(await this.getConfig()),
      ...(customConfig || {}),
    };

    if (!cfg.accountId || !cfg.accessKeyId || !cfg.secretAccessKey || !cfg.bucketName) {
      return {
        success: false,
        message: 'Thiếu thông tin cấu hình Cloudflare R2 (Account ID, Access Key ID, Secret Key, Bucket Name).',
      };
    }

    try {
      const client = new S3Client({
        region: 'auto',
        endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: cfg.accessKeyId,
          secretAccessKey: cfg.secretAccessKey,
        },
      });

      await client.send(new HeadBucketCommand({ Bucket: cfg.bucketName }));

      return {
        success: true,
        message: `Kết nối Cloudflare R2 tới Bucket "${cfg.bucketName}" thành công!`,
        bucket: cfg.bucketName,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Kết nối Cloudflare R2 thất bại: ${err.message}`,
      };
    }
  }

  async saveConfig(data: Partial<StorageConfig>) {
    const entries: [string, string | undefined][] = [
      ['r2_account_id', data.accountId],
      ['r2_access_key_id', data.accessKeyId],
      ['r2_secret_access_key', data.secretAccessKey],
      ['r2_bucket_name', data.bucketName],
      ['r2_public_domain', data.publicDomain],
    ];

    for (const [key, val] of entries) {
      if (val !== undefined) {
        await this.prisma.setting.upsert({
          where: { key },
          update: { value: val },
          create: {
            key,
            value: val,
            description: `Cloudflare R2 ${key}`,
          },
        });
      }
    }

    return this.getConfig();
  }
}

