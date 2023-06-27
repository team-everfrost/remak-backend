import { ApiProperty } from '@nestjs/swagger';
import { Document, DocumentType, Status } from '@prisma/client';

export class DocumentDto {
  @ApiProperty({
    description: 'Document UUID',
    example: 'f7a3d8e0-9a9b-4c4b-9b9b-9b9b9b9b9b9b',
  })
  docId: string;

  @ApiProperty({
    description: 'Document Title',
    example: 'Title',
  })
  title: string;

  @ApiProperty({
    description: 'Document Type',
    example: 'WEBPAGE',
  })
  type: DocumentType;

  @ApiProperty({
    description: 'Document URL',
    example: 'https://www.google.com',
  })
  url: string;

  @ApiProperty({
    description: 'Document Content',
    example: 'Content',
  })
  content: string;

  @ApiProperty({
    description: 'Document Summary',
    example: 'Summary',
  })
  summary: string;

  @ApiProperty({
    description: 'Document Status',
    example: 'PENDING',
  })
  status: Status;

  @ApiProperty({
    description: 'Document Created Date',
    example: '2021-08-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Document Updated Date',
    example: '2021-08-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Document Tags',
    example: ['tag1', 'tag2'],
  })
  tags: string[];

  constructor(document: Document, tags: string[]) {
    this.docId = document.docId;
    this.title = document.title;
    this.type = document.type;
    this.url = document.url;
    this.content = document.content;
    this.summary = document.summary;
    this.status = document.status;
    this.createdAt = document.createdAt;
    this.updatedAt = document.updatedAt;
    this.tags = tags;
  }
}
