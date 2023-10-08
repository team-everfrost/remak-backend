import { MetadataIndexType } from './metadata.index.type';

export type DocumentIndexType = {
  title: string;
  content: string;
} & MetadataIndexType;
