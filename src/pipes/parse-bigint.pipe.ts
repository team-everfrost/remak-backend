import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, Promise<bigint>> {
  async transform(value: string, metadata: ArgumentMetadata): Promise<bigint> {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('Validation failed. (number only)');
    }
    return BigInt(value);
  }
}
