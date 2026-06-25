import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Checks if the API and database are running.',
  })
  @ApiResponse({
    status: 200,
    description: 'API and database are healthy.',
  })
  check() {
    return this.healthService.check();
  }
}
