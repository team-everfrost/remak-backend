import { Controller, Get, Logger, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { GetUid } from '../decorators/get-uid.decorator';
import { TokenThrottle } from '../decorators/token-throttle.decorator';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(private readonly chatService: ChatService) {}

  @Get('rag')
  @TokenThrottle(2000, 1) // 2초에 한번
  async retrievalAugmentedGeneration(
    @GetUid() uid: string,
    @Query('query') query: string,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const [completionsPromise, documents] = await this.chatService.rag(
      uid,
      query,
    );

    const completions = await completionsPromise;

    res.write(`event: documents\ndata: ${JSON.stringify(documents)}\n\n`);

    for await (const completion of completions) {
      const text = completion.choices[0].delta.content;
      if (text) {
        res.write(`event: chat\ndata: ${JSON.stringify({ text: text })}\n\n`);
      }
    }

    this.logger.debug(`Stream ended.`);
    res.end();
  }
}
