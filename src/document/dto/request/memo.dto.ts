import { IsNotEmpty, IsString } from 'class-validator';

export class MemoDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}
