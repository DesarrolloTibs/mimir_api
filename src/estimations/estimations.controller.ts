import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { EstimationsService } from './estimations.service';
import { GenerateEstimationDto } from './dto/generate-estimation.dto';
import { EstimationResponseDto } from './dto/estimation-response.dto';
import { EstimationItem } from './entities/estimation-item.entity';

@ApiTags('Estimations')
@Controller('estimations')
export class EstimationsController {
  constructor(private readonly estimationsService: EstimationsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a technical estimation for a requirement' })
  @ApiResponse({
    status: 201,
    description: 'The estimation has been successfully generated.',
    type: EstimationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  generate(
    @Body() generateEstimationDto: GenerateEstimationDto,
  ): Promise<EstimationResponseDto> {
    return this.estimationsService.generate(generateEstimationDto);
  }

  @Get('requirement/:requirementId')
  @ApiOperation({ summary: 'Get estimation items by requirement ID' })
  @ApiParam({ name: 'requirementId', description: 'The ID of the requirement' })
  @ApiResponse({
    status: 200,
    description: 'List of estimation items associated with the requirement.',
    type: [EstimationItem],
  })
  findAllByRequirementId(@Param('requirementId') requirementId: string) {
    return this.estimationsService.findAllByRequirementId(requirementId);
  }
}
