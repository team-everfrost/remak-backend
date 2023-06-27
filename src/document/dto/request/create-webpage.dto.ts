import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateWebpageDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsUrl()
  url: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
