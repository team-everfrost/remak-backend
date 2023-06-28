import { DocumentType, PrismaClient, Role, Status } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      email: 'user1@example.com',
      password: 'securepassword1',
      name: 'User 1',
      imageUrl: 'http://example.com/image1.jpg',
      role: Role.BASIC,
    },
    {
      email: 'user2@example.com',
      password: 'securepassword2',
      name: 'User 2',
      imageUrl: 'http://example.com/image2.jpg',
      role: Role.BASIC,
    },
    // add more users as needed
  ];

  // Create users
  const createdUsers = await prisma.user.createMany({
    data: users,
    skipDuplicates: true, // skips records if already exist
  });

  const foundUsers = await prisma.user.findMany();

  const documents = [
    {
      title: 'Document 1',
      type: DocumentType.MEMO,
      url: 'http://example.com/document1',
      content: 'This is Document 1',
      summary: 'Document 1 summary',
      status: Status.APPROVED,
      userId: foundUsers[0].id, // assuming this document belongs to the first user
    },
    {
      title: 'Document 2',
      type: DocumentType.WEBPAGE,
      url: 'http://example.com/document2',
      content: 'This is Document 2',
      summary: 'Document 2 summary',
      status: Status.PENDING,
      userId: foundUsers[1].id, // assuming this document belongs to the second user
    },
    // add more documents as needed
  ];

  // Create documents
  const createdDocuments = await prisma.document.createMany({
    data: documents,
    skipDuplicates: true, // skips records if already exist
  });

  console.log({ createdUsers, createdDocuments });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
