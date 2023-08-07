import {
  Document,
  DocumentType,
  PrismaClient,
  Role,
  Status,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const password = bcrypt.hashSync('password', 10);

async function createUserWithDocumentsAndTags(index: number, numDocs: number) {
  const documentData = Array.from({ length: numDocs }, (_, i) => ({
    title: `user${index} document${i + 1}`,
    type: DocumentType.MEMO,
    url: `http://example.com/document${index}${i + 1}`,
    content: `This is user${index} document${i + 1}`,
    summary: `user${index} document${index}${i + 1} summary`,
    status: Status.EMBED_PENDING,
  }));

  const createdUser = await prisma.user.create({
    data: {
      email: `example${index}@example.com`,
      password: password,
      name: `name${index}`,
      imageUrl: `http://example.com/image${index}.jpg`,
      role: Role.BASIC,
      documents: {
        create: documentData,
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

async function createEmbeddedText(documentId: bigint, userId: bigint) {
  const vec = Array.from({ length: 1536 }, () => Math.random());
  await prisma.$executeRaw`insert into embedded_text (document_id, user_id, vector)
                           values (${documentId}, ${userId}, ${JSON.stringify(
                             vec,
                           )}::vector)`;

  // 중복 문서를 검색하지 않는 기능을 테스트하기 위해 비슷한 벡터를 만듦
  // 비슷한 벡터를 만들기 위해 0.5보다 작은 값은 0.1을 더해줌
  await prisma.$executeRaw`insert into embedded_text (document_id, user_id, vector)
                           values (${documentId}, ${userId}, ${JSON.stringify(
                             vec.map((v) => (v < 0.5 ? v + 0.1 : v)),
                           )}::vector)`;
}

async function main() {
  for (let i = 0; i < 10; i++) {
    try {
      const user = await createUserWithDocumentsAndTags(i, 500);
      const docs: Document[] = user.documents;
      await Promise.all(docs.map((doc) => createEmbeddedText(doc.id, user.id)));
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
