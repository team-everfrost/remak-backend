import { ApiProperty } from '@nestjs/swagger';
import { Document, DocumentType, Status, Tag } from '@prisma/client';

export class DocumentDto {
  @ApiProperty({
    description: '외부 공개용 문서 UUID',
    example: 'f7a3d8e0-9a9b-4c4b-9b9b-9b9b9b9b9b9b',
  })
  docId: string;

  @ApiProperty({
    description: '문서 제목',
    example: 'Title',
  })
  title: string;

  @ApiProperty({
    description: '문서 타입',
    example: 'WEBPAGE',
  })
  type: DocumentType;

  @ApiProperty({
    description: '문서 URL',
    example: 'https://www.google.com',
  })
  url: string;

  @ApiProperty({
    description: '문서 본문 내용',
    example: 'Content',
  })
  content: string;

  @ApiProperty({
    description: '문서 요약 내용',
    example: 'Summary',
  })
  summary: string;

  @ApiProperty({
    description: '문서 상태',
    example: 'PENDING',
  })
  status: Status;

  @ApiProperty({
    description: '문서 생성일',
    example: '2021-08-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '문서 수정일',
    example: '2021-08-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '문서 태그',
    example: ['tag1', 'tag2'],
  })
  tags: string[];

  constructor(document: Document & { tags: Tag[] }) {
    this.docId = document.docId;
    this.title = document.title;
    this.type = document.type;
    this.url = document.url;
    this.content = document.content;
    this.summary = document.summary;
    this.status = document.status;
    this.createdAt = document.createdAt;
    this.updatedAt = document.updatedAt;
    this.tags = document.tags.map((tag) => tag.name);
  }
}
