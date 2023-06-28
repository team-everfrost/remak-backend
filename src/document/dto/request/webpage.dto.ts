import { IsNotEmpty, IsString } from 'class-validator';

export class WebpageDto {
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
