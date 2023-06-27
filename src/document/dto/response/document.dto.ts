import { ApiProperty } from '@nestjs/swagger';
import { DocumentType, Status } from '@prisma/client';

export class DocumentDto {
  @ApiProperty({
    description: 'Document ID',
    example: 1,
  })
  id: number;

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
}
