import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class AwsService {
  private readonly logger: Logger = new Logger(AwsService.name);
  private readonly s3Client: S3Client = new S3Client({
    region: this.configService.get<string>('AWS_REGION'),
    credentials:
      this.configService.get<string>('NODE_ENV') === 'development'
        ? {
            accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY'),
            secretAccessKey: this.configService.get<string>('AWS_SECRET_KEY'),
          }
        : undefined,
  });
  private readonly sqsClient: SQSClient = new SQSClient({
    region: this.configService.get<string>('AWS_REGION'),
    credentials:
      this.configService.get<string>('NODE_ENV') === 'development'
        ? {
            accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY'),
            secretAccessKey: this.configService.get<string>('AWS_SECRET_KEY'),
          }
        : undefined,
  });

  constructor(private configService: ConfigService) {}

  async getSignedUrlFromS3(docId: string): Promise<string> {
    return await getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
        Key: docId,
      }),
      { expiresIn: 60 * 60 * 24 },
    );
  }

  async putObjectToS3(
    docId: string,
    file: Express.Multer.File,
    base64filename: string,
  ): Promise<void> {
    const res = await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
        Key: docId,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          // S3 Metadata에 한글 못써서 base64로 인코딩
          originalname: base64filename,
        },
      }),
    );

    this.logger.log(`Uploaded ${docId} to S3. res: ${JSON.stringify(res)}`);

    if (res.$metadata.httpStatusCode !== 200) {
      throw new Error('Failed to upload file to S3');
    }
  }

  async deleteObjectFromS3(docId: string): Promise<void> {
    const res = await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
        Key: docId,
      }),
    );

    this.logger.log(`Deleted ${docId} from S3. res: ${JSON.stringify(res)}`);

    if (res.$metadata.httpStatusCode !== 204) {
      throw new Error('Failed to delete file from S3');
    }
  }
}
