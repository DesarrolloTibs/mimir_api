import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requirement } from './entities/requirement.entity';
import { EstimationItem } from './entities/estimation-item.entity';
import { GenerateEstimationDto } from './dto/generate-estimation.dto';

@Injectable()
export class EstimationsService {
  constructor(
    @InjectRepository(Requirement)
    private readonly requirementRepository: Repository<Requirement>,
    @InjectRepository(EstimationItem)
    private readonly estimationItemRepository: Repository<EstimationItem>,
  ) {}

  async generate(generateEstimationDto: GenerateEstimationDto) {
    const { projectId, requirement: requirementText } = generateEstimationDto;

    // 1. Save the requirement
    const newRequirement = this.requirementRepository.create({
      projectId,
      originalText: requirementText,
      title: requirementText.substring(0, 50) + '...', // Simple title
      status: 'Estimated',
    });
    await this.requirementRepository.save(newRequirement);

    // 2. Mock the AI response
    const mockAiResponse = {
      summary: 'Implementación de Auth0 con Guardias en NestJS',
      tasks: [
        {
          description: 'Configurar Estrategia Google OAuth en NestJS',
          layer: 'Backend',
          hours: 4,
          reason: 'Documento de arquitectura pág 5 especifica PassportJS',
        },
        {
          description: 'Botón de Login y Redirección en React',
          layer: 'Frontend',
          hours: 3,
          reason: 'Componente estándar reutilizable',
        },
      ],
      totalHours: 7,
      confidenceScore: 85,
    };

    // 3. Save the estimation items
    const estimationItems = mockAiResponse.tasks.map((task) =>
      this.estimationItemRepository.create({
        requirementId: newRequirement.id,
        taskDescription: task.description,
        layer: task.layer,
        aiSuggestedHours: task.hours,
        aiReasoning: task.reason,
        aiConfidenceScore: mockAiResponse.confidenceScore, // Applying overall confidence to each task
      }),
    );
    await this.estimationItemRepository.save(estimationItems);

    // 4. Return the mocked response
    return mockAiResponse;
  }
}
