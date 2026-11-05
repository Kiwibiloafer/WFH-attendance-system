import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { FileStreamResult, StoredFileResult, UploadableFile } from './storage.interface.js';

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    const region = this.configService.get<string>('S3_REGION', 'us-east-1');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY', 'minio_admin');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY', 'minio_dev_password');
    const forcePathStyle =
      this.configService.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true';

    this.bucket = this.configService.get<string>('S3_BUCKET', 'wfh-attendance-photos');

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle,
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`MinIO bucket '${this.bucket}' is ready.`);
    } catch (err: any) {
      if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') {
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          this.logger.log(`Created MinIO bucket '${this.bucket}'.`);
        } catch (createErr) {
          this.logger.error(`Failed to create bucket '${this.bucket}':`, createErr);
        }
      } else {
        this.logger.warn(`MinIO HeadBucket warning: ${err?.message || err}`);
      }
    }
  }

  async uploadPhoto(file: UploadableFile): Promise<StoredFileResult> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const rawUuid = randomUUID();
    const sanitizedOriginal = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);

    const fileName = `${rawUuid}-${sanitizedOriginal}${ext}`;
    const storagePath = `photos/${year}/${month}/${day}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: encodeURIComponent(file.originalname),
      },
    });

    await this.s3Client.send(command);

    return {
      storagePath,
      fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
    };
  }

  async deletePhoto(storagePath: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storagePath,
        }),
      );
      this.logger.log(`Cleaned up orphaned storage object: ${storagePath}`);
    } catch (err) {
      this.logger.error(`Error deleting storage object '${storagePath}':`, err);
    }
  }

  async getPhotoStream(storagePath: string): Promise<FileStreamResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    });

    const response = await this.s3Client.send(command);

    return {
      stream: response.Body as NodeJS.ReadableStream,
      contentType: response.ContentType || 'image/jpeg',
      contentLength: response.ContentLength,
    };
  }
}
