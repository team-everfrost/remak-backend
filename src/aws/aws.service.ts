import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsService {
  private readonly logger: Logger = new Logger(AwsService.name);
  private readonly config = {
    region: this.configService.get<string>('AWS_REGION'),
    credentials: () => {
      const credentialsProvider = defaultProvider();
      return credentialsProvider();
    },
  };
  private readonly s3Client: S3Client = new S3Client(this.config);
  private readonly sqsClient: SQSClient = new SQSClient(this.config);
  private readonly sesClient: SESClient = new SESClient(this.config);

  constructor(private configService: ConfigService) {}

  async getDocuemntSignedUrl(docId: string): Promise<string> {
    return await getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: this.configService.get('AWS_S3_DOCUMENTS_BUCKET_NAME'),
        Key: docId,
      }),
      { expiresIn: 60 * 60 * 24 },
    );
  }

  async putDocument(
    docId: string,
    file: Express.Multer.File,
    base64filename: string,
  ): Promise<void> {
    const res = await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.configService.get('AWS_S3_DOCUMENTS_BUCKET_NAME'),
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

  async deleteDocument(docId: string): Promise<void> {
    try {
      const res = await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.configService.get('AWS_S3_DOCUMENTS_BUCKET_NAME'),
          Key: docId,
        }),
      );

      this.logger.log(`Deleted ${docId} from S3. res: ${JSON.stringify(res)}`);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async deleteThumbnail(docId: string): Promise<void> {
    try {
      const res = await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.configService.get('AWS_S3_THUMBNAILS_BUCKET_NAME'),
          Key: docId,
        }),
      );

      this.logger.log(
        `Deleted thumbnail of ${docId} from S3. res: ${JSON.stringify(res)}`,
      );
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async deleteWebpageImages(docId: string): Promise<void> {
    try {
      // S3에서 `docId/` 폴더 내의 모든 객체를 나열
      const listObjectsResponse = await this.s3Client.send(
        new ListObjectsCommand({
          Bucket: this.configService.get('AWS_S3_WEBPAGE_IMAGES_BUCKET_NAME'),
          Prefix: `${docId}/`,
        }),
      );

      // 삭제할 객체가 없다면 바로 반환
      if (
        !listObjectsResponse.Contents ||
        listObjectsResponse.Contents.length === 0
      ) {
        this.logger.log(`No webpage images for ${docId} in S3.`);
        return;
      }

      // 나열된 객체들을 모두 삭제
      const deleteObjectsResponse = await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.configService.get('AWS_S3_WEBPAGE_IMAGES_BUCKET_NAME'),
          Delete: {
            Objects: listObjectsResponse.Contents.map((obj) => ({
              Key: obj.Key,
            })),
          },
        }),
      );

      // 삭제 결과 로깅
      if (
        deleteObjectsResponse.Errors &&
        deleteObjectsResponse.Errors.length > 0
      ) {
        this.logger.error(
          `Failed to delete some objects: ${JSON.stringify(
            deleteObjectsResponse.Errors,
          )}`,
        );
      } else {
        this.logger.log(`Deleted all images for ${docId} from S3.`);
      }
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async sendMessageToEmbedQueue(documentId: bigint): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.configService.get('AWS_SQS_EMBED_QUEUE_URL'),
      MessageBody: JSON.stringify({ documentId }),
    });
    const res = await this.sqsClient.send(command);
    this.logger.log(
      `Sent message to Embed Queue. documentId: ${documentId} res: ${JSON.stringify(
        res,
      )}`,
    );
  }

  async sendMessageToScrapeQueue(documentId: bigint): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.configService.get('AWS_SQS_SCRAPE_QUEUE_URL'),
      MessageBody: JSON.stringify({ documentId }),
    });
    const res = await this.sqsClient.send(command);
    this.logger.log(
      `Sent message to Scrape Queue. documentId: ${documentId} res: ${JSON.stringify(
        res,
      )}`,
    );
  }

  async sendEmail(
    toAddress: string,
    code: string,
    subject: string,
    bodyTemplate: string,
  ): Promise<void> {
    const fromAddress = this.configService.get<string>('AWS_SES_FROM_ADDRESS');
    const command = this.createSendEmailCommand(
      toAddress,
      fromAddress,
      code,
      subject,
      bodyTemplate,
    );

    try {
      const res = this.sesClient.send(command);
      this.logger.log(
        `Sent email with subject "${subject}" to ${toAddress}. res: ${JSON.stringify(
          res,
        )}`,
      );
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  private createSendEmailCommand(
    toAddress: string,
    fromAddress: string,
    code: string,
    subject: string,
    bodyTemplate: string,
  ): SendEmailCommand {
    return new SendEmailCommand({
      Destination: { ToAddresses: [toAddress] },
      Message: {
        Subject: { Charset: 'UTF-8', Data: subject },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: bodyTemplate.replace('%%CODE%%', code),
          },
        },
      },
      Source: fromAddress,
    });
  }
}
