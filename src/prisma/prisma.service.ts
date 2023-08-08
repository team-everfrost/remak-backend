import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { format } from 'sql-formatter';

type QueryEventListener = (
  eventType: 'query',
  callback: (e: Prisma.QueryEvent) => void,
) => void;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger: Logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'stdout',
          level: 'error',
        },
        {
          emit: 'stdout',
          level: 'info',
        },
        {
          emit: 'stdout',
          level: 'warn',
        },
      ],
    });
    (this.$on as QueryEventListener)('query', (e) => this.logQuery(e));
  }

  async onModuleInit() {
    await this.$connect();

    const indexExists: number = await this
      .$executeRaw`SELECT 1 FROM pg_indexes WHERE indexname = 'document_gin';`;

    if (!indexExists) {
      await this
        .$executeRaw`CREATE INDEX "document_gin" ON "document" USING gin ("content" gin_bigm_ops, "title" gin_bigm_ops);`;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private logQuery(e: Prisma.QueryEvent) {
    this.logger.log(`Query: \n${format(e.query, { language: 'postgresql' })}`);
    this.logger.verbose(`Params: ${e.params}`);
    this.logger.debug(`Duration: ${e.duration}ms`);
  }
}
