import {
  DeleteObjectCommand,
  GetObjectCommand,
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
    try {
      const res = await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
          Key: docId,
        }),
      );
      this.logger.log(`Deleted ${docId} from S3. res: ${JSON.stringify(res)}`);
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

  async sendSignupEmail(toAddress: string, signupCode: string): Promise<void> {
    const fromAddress = this.configService.get<string>('AWS_SES_FROM_ADDRESS');
    const command = this.createSignupSendEmailCommand(
      toAddress,
      fromAddress,
      signupCode,
    );
    try {
      const res = this.sesClient.send(command);
      this.logger.log(
        `Sent signup email to ${toAddress}. res: ${JSON.stringify(res)}`,
      );
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  private createSignupSendEmailCommand(
    toAddress: string,
    fromAddress: string,
    signupCode: string,
  ): SendEmailCommand {
    return new SendEmailCommand({
      Destination: {
        ToAddresses: [toAddress],
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: 'Remak 회원가입 코드',
        },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `<b>회원가입 코드는 ${signupCode} 입니다</b>`,
          },
        },
      },
      Source: fromAddress,
    });
  }
}
