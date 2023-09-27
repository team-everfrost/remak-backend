import { Expose } from 'class-transformer';

export class DocumentIndexDto {
  @Expose({ name: 'document_vector' })
  documentVector: number[];

  title: string;

  content: string;

  @Expose({ name: 'user_id' })
  userId: bigint;

  @Expose({ name: 'collection_id' })
  documentId: bigint;

  @Expose({ name: 'document_type' })
  documentType: string;
}
