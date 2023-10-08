import { DocumentType } from '@prisma/client';

export type MetadataIndexType = {
  user_id: bigint;
  document_id: bigint;
  document_type: DocumentType;
};
