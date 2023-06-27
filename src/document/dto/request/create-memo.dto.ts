import { IsNotEmpty } from 'class-validator';

export class CreateMemoDto {
  @IsNotEmpty()
  content: string;
}
