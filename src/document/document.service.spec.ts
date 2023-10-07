import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentType, Role, Status } from '@prisma/client';
import { AwsService } from '../aws/aws.service';
import { OpenAiService } from '../openai/open-ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let documentService: DocumentService;
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
    status: Status.EMBED_PENDING,
    thumbnailUrl: 'test thumbnail url',
    userId: BigInt(2),
    summary: 'test summary',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        ConfigService,
        UserService,
        {
          provide: OpenAiService,
          useValue: {
            summarize: jest.fn(),
          },
        },
        {
          provide: AwsService,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
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

    documentService = module.get<DocumentService>(DocumentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(documentService).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('findOne', () => {
    it('docid로 문서를 찾을 수 없는 경우 NotFoundException을 발생시킨다.', async () => {
      (prisma.document.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(documentService.findOne(uid, docId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateMemo', () => {
    it('docid로 문서를 찾을 수 없는 경우 NotFoundException을 발생시킨다.', async () => {
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(null);
      await expect(
        documentService.updateMemo(uid, docId, {
          content: 'test content',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('docid로 찾은 문서의 uid와 입력받은 uid가 일치하지 않는 경우 UnauthorizedException을 발생시킨다.', async () => {
      const uid = 'different-uid';
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument);
      await expect(
        documentService.updateMemo(uid, docId, {
          content: 'test content',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateWebpage', () => {
    it('docid로 문서를 찾을 수 없는 경우 NotFoundException을 발생시킨다.', async () => {
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(null);
      await expect(
        documentService.updateWebpage(uid, docId, {
          title: 'test title',
          url: 'test url',
          content: 'test content',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('docid로 찾은 문서의 uid와 입력받은 uid가 일치하지 않는 경우 UnauthorizedException을 발생시킨다.', async () => {
      const uid = 'different-uid';
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument);
      await expect(
        documentService.updateWebpage(uid, docId, {
          title: 'test title',
          url: 'test url',
          content: 'test content',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deleteOne', () => {
    it('docid로 문서를 찾을 수 없는 경우 NotFoundException을 발생시킨다.', async () => {
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(null);
      await expect(documentService.deleteOne(uid, docId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('docid로 찾은 문서의 uid와 입력받은 uid가 일치하지 않는 경우 UnauthorizedException을 발생시킨다.', async () => {
      const uid = 'different-uid';
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDocument);
      await expect(documentService.deleteOne(uid, docId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('findByCursor', () => {
    it('cursor가 없는 경우 현재 시각이 cursor로 설정된다.', async () => {
      const mockDate = new Date();
      const take = 20;

      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => {
        return mockDate as Date;
      });

      jest.spyOn(prisma.document, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      await documentService.findByCursor(uid, null, docId, take);
      expect(dateSpy).toHaveBeenCalled();
      expect(dateSpy).toHaveReturnedWith(mockDate);
    });

    it('limit에 20보다 큰 숫자가 들어가면 20으로 설정된다.', async () => {
      jest.spyOn(prisma.document, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      const mathSpy = jest.spyOn(Math, 'min');

      await documentService.findByCursor(uid, new Date(), docId, 50);

      expect(mathSpy).toHaveBeenCalled();
      expect(mathSpy).toHaveReturnedWith(20);
    });
  });
});
