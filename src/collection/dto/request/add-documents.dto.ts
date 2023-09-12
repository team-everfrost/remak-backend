import { IsArray, IsString } from 'class-validator';

export class AddDocumentsDto {
  @IsArray()
  @IsString({ each: true })
  docIds: string[];
}
