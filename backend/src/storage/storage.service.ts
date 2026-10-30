// backend/src/storage/storage.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME') || 'dcms-clinical-files';
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('MINIO_ENDPOINT') || 'http://localhost:9000',
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
        secretAccessKey: this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async uploadFile(file: { originalname: string; buffer: Uint8Array; mimetype: string }, folder: string = 'xrays'): Promise<{ fileUrl: string; fileName: string }> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
      const endpoint = this.configService.get<string>('MINIO_ENDPOINT') || 'http://localhost:9000';
      const fileUrl = `${endpoint}/${this.bucketName}/${fileName}`;
      return { fileUrl, fileName };
    } catch (error) {
      console.error('MinIO upload error:', error);
      throw new InternalServerErrorException('Failed to upload file to object storage.');
    }
  }
}