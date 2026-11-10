import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  online() {
    return 'Agenda Coworking API online';
  }
}
