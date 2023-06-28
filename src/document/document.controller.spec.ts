import { Test, TestingModule } from '@nestjs/testing';
import { prismaMock } from '../../test/prisma.mock';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

describe('DocumentController', () => {
  let controller: DocumentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        DocumentService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    controller = module.get<DocumentController>(DocumentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
