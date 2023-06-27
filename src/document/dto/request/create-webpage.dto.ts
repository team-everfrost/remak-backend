import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWebpageDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
