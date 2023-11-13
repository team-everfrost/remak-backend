import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class QueryDto {
  @IsNotEmpty()
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  context: string;
}
