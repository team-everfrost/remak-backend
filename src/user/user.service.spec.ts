import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, PrismaService, ConfigService],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTotalFileSize', () => {
    it('sum 결과가 null인 경우 0을 반환해야 함', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: BigInt(1),
        uid: 'user-uid',
        email: 'user-email',
        password: 'user-password',
        name: 'user-name',
        imageUrl: 'user-imageUrl',
        role: Role.BASIC,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest
        .spyOn(prisma.document, 'aggregate')
        .mockResolvedValue({ _sum: { fileSize: null } } as any);

      expect(await service.getTotalFileSize('user-id')).toEqual(BigInt(0));
    });
  });

  describe('checkUploadAvailable', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      await expect(
        service.checkUploadAvailable('non-existent-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it.each([
      [Role.BASIC, 5000, true],
      [Role.BASIC, 1024 * 1024 * 1024, false],
      [Role.PLUS, 1024 * 1024 * 1024 + 1, true],
      [Role.PLUS, 1024 * 1024 * 1024 * 10, false],
      [Role.ADMIN, 10000, true],
      [Role.ADMIN, 1024 * 1024 * 1024 * 20, true],
      [Role.ADMIN, 1024 * 1024 * 1024 * 1024, false],
    ])(
      '유저 role이 %s이고, 파일 사이즈가 %s일 때, %s를 반환해야 함',
      async (role, fileSize, expectedResult) => {
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
          id: BigInt(1),
          uid: 'user-uid',
          email: 'user-email',
          password: 'user-password',
          name: 'user-name',
          imageUrl: 'user-imageUrl',
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        jest
          .spyOn(prisma.document, 'aggregate')
          .mockResolvedValue({ _sum: { fileSize: BigInt(fileSize) } } as any);

        expect(await service.checkUploadAvailable('user-id')).toEqual(
          expectedResult,
        );
      },
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
