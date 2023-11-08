import { Controller, Get, Logger, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { GetUid } from '../decorators/get-uid.decorator';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(private readonly chatService: ChatService) {}

  @Get('rag')
  async retrievalAugmentedGeneration(
    @GetUid() uid: string,
    @Query('query') query: string,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const completions = await this.chatService.rag(uid, query);

    let ret = '';

    for await (const completion of completions) {
      const text = completion.choices[0].delta.content;
      if (text) {
        res.write(`data: ${text}\n\n`);
        this.logger.debug(text);
        ret += text;
      }
    }

    this.logger.debug(`ret: ${ret}`);

    res.end();
  }
}
