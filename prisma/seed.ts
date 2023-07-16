import { DocumentType, PrismaClient, Role, Status } from '@prisma/client';

const prisma = new PrismaClient();

async function createUserWithDocumentsAndTags(index: number) {
  const createdUser = await prisma.user.create({
    data: {
      email: `email${index}@email.com`,
      password: 'password',
      name: `name${index}`,
      imageUrl: `http://example.com/image${index}.jpg`,
      role: Role.BASIC,
      documents: {
        create: [
          {
            title: `user${index} document1`,
            type: DocumentType.MEMO,
            url: `http://example.com/document${index}`,
            content: `This is user${index} document1`,
            summary: `user${index} document${index} summary`,
            status: Status.EMBED_PENDING,
          },
          {
            title: `user${index} document2`,
            type: DocumentType.WEBPAGE,
            url: `http://example.com/document${index}`,
            content: `This is user${index} document2`,
            summary: `user${index} document${index} summary`,
            status: Status.EMBED_PENDING,
          },
        ],
      },
    },
    include: {
      documents: true,
    },
  });

  await Promise.all(
    createdUser.documents.map((doc) =>
      prisma.document.update({
        where: {
          id: doc.id,
        },
        data: {
          tags: {
            create: [
              {
                name: `tag${index}`,
                user: {
                  connect: {
                    id: createdUser.id,
                  },
                },
              },
            ],
          },
        },
      }),
    ),
  );

  return createdUser;
}

async function main() {
  for (let i = 0; i < 10; i++) {
    try {
      await createUserWithDocumentsAndTags(i);
    } catch (e) {
      console.error(`Error occurred while creating user with index ${i}: ${e}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(`Error occurred in main function: ${e}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
