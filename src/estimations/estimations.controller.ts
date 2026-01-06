import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EstimationsService } from './estimations.service';
import { GenerateEstimationDto } from './dto/generate-estimation.dto';

@ApiTags('Estimations')
@Controller('estimations')
export class EstimationsController {
  constructor(private readonly estimationsService: EstimationsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a technical estimation for a requirement' })
  @ApiResponse({
    status: 201,
    description: 'The estimation has been successfully generated.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  generate(@Body() generateEstimationDto: GenerateEstimationDto) {
    return this.estimationsService.generate(generateEstimationDto);
  }
}
