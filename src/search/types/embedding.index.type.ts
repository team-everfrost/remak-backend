import { MetadataIndexType } from './metadata.index.type';

export type EmbeddingIndexType = {
  vector: number[];
  page: number;
  index: number;
} & MetadataIndexType;
