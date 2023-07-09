import { DocumentType, PrismaClient, Role, Status } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  for (let i = 0; i < 10; i++) {
    await prisma.user.create({
      data: {
        email: `email${i}@email.com`,
        password: 'password',
        name: `name${i}`,
        imageUrl: `http://example.com/image${i}.jpg`,
        role: Role.BASIC,
        documents: {
          create: [
            {
              title: `user${i} document1`,
              type: DocumentType.MEMO,
              url: `http://example.com/document${i}`,
              content: `This is user${i} document1`,
              summary: `user${i} document${i} summary`,
              status: Status.EMBED_PENDING,
              tags: {
                create: [
                  {
                    name: `user${i} tag1`,
                  },
                  {
                    name: `user${i} tag2`,
                  },
                ],
              },
            },
            {
              title: `user${i} document2`,
              type: DocumentType.WEBPAGE,
              url: `http://example.com/document${i}`,
              content: `This is user${i} document2`,
              summary: `user${i} document${i} summary`,
              status: Status.EMBED_PENDING,
              tags: {
                create: [
                  {
                    name: `user${i} tag1`,
                  },
                  {
                    name: `user${i} tag2`,
                  },
                ],
              },
            },
          ],
        },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
