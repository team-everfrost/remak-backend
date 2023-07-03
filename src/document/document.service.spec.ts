import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentType, Role, Status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let prisma: PrismaService;

  const uid = 'test-uid';
  const docId = 'test-docId';

  const mockUser = {
    id: BigInt(1),
    uid,
    email: 'test@asd.com',
    password: 'test password',
    name: 'test name',
    imageUrl: 'test image url',
    role: Role.BASIC,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDocument = {
    id: BigInt(1),
    docId,
    title: 'test title',
    content: 'test content',
    type: DocumentType.MEMO,
    url: 'test image url',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: Status.PENDING,
    userId: BigInt(2),
    summary: 'test summary',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            document: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should throw NotFoundException if document not found', async () => {
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(null);
      await expect(service.findOne(uid, docId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException if user not match', async () => {
      const uid = 'different-uid';

      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument);

      await expect(service.findOne(uid, docId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('createMemo', () => {
    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      await expect(
        service.createMemo(uid, {
          content: 'test content',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMemo', () => {
    it('should throw NotFoundException if document not found', async () => {
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(null);
      await expect(
        service.updateMemo(uid, docId, {
          content: 'test content',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user not match', async () => {
      const uid = 'different-uid';

      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument);

      await expect(
        service.updateMemo(uid, docId, {
          content: 'test content',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createWebpage', () => {
    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      await expect(
        service.createWebpage(uid, {
          title: 'test title',
          url: 'test url',
          content: 'test content',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateWebpage', () => {
    it('should throw NotFoundException if document not found', async () => {
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(null);
      await expect(
        service.updateWebpage(uid, docId, {
          title: 'test title',
          url: 'test url',
          content: 'test content',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user not match', async () => {
      const uid = 'different-uid';

      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument);

      await expect(
        service.updateWebpage(uid, docId, {
          title: 'test title',
          url: 'test url',
          content: 'test content',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deleteOne', () => {
    it('should throw NotFoundException if document not found', async () => {
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(null);
      await expect(service.deleteOne(uid, docId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException if user not match', async () => {
      const uid = 'different-uid';

      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument);

      await expect(service.deleteOne(uid, docId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
