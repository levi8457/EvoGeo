import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Res() res: Response): void {
    res.status(200).json({
      success: true,
      data: {
        message: 'EvoGeo API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    });
  }
}
