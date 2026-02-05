import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requirement } from './entities/requirement.entity';
import { EstimationItem } from './entities/estimation-item.entity';
import { GenerateEstimationDto } from './dto/generate-estimation.dto';
import { EstimationResponseDto } from './dto/estimation-response.dto';
import { DocumentChunk } from '../documents/entities/document-chunk.entity';
import { GeminiService } from '../common/gemini.service';

@Injectable()
export class EstimationsService {
  constructor(
    @InjectRepository(Requirement)
    private readonly requirementRepository: Repository<Requirement>,
    @InjectRepository(EstimationItem)
    private readonly estimationItemRepository: Repository<EstimationItem>,
    @InjectRepository(DocumentChunk)
    private readonly documentChunkRepository: Repository<DocumentChunk>,
    private readonly geminiService: GeminiService,
  ) {}

  async generate(
    generateEstimationDto: GenerateEstimationDto,
  ): Promise<EstimationResponseDto> {
    const { projectId, documentId, requirementText } = generateEstimationDto;

    // 1. Fetch document chunks
    const chunks = await this.documentChunkRepository.find({
      where: { document: { id: documentId } },
      order: { chunkIndex: 'ASC' },
    });

    if (!chunks || chunks.length === 0) {
      throw new Error('No document chunks found for the given documentId.');
    }

    const documentContent = chunks.map((chunk) => chunk.content).join('\n\n');

    // Check if a requirement already exists for this project and delete it
    const existingRequirement = await this.requirementRepository.findOne({
      where: { projectId },
    });

    if (existingRequirement) {
      await this.requirementRepository.remove(existingRequirement);
    }

    // 2. Save the requirement
    const newRequirement = this.requirementRepository.create({
      projectId,
      originalText: documentContent, // Store the full document content
      title:
        (requirementText?.substring(0, 47) ??
          documentContent.substring(0, 47)) + '...', // Use user's text for title, fallback to content
      status: 'Estimated',
    });
    await this.requirementRepository.save(newRequirement);

    // 3. Generate estimation using Gemini
    const aiResponse = await this.geminiService.generateEstimation(
      requirementText ?? '',
      chunks,
    );

    // 4. Save the estimation items
    const estimationItems = aiResponse.tasks.map((task) =>
      this.estimationItemRepository.create({
        requirementId: newRequirement.id,
        taskDescription: task.description,
        layer: task.layer,
        aiSuggestedHours: task.hours,
        aiReasoning: task.reason,
        aiConfidenceScore: aiResponse.confidenceScore, // Applying overall confidence to each task
      }),
    );
    await this.estimationItemRepository.save(estimationItems);

    // 5. Return the AI-generated response
    return {
      summary: aiResponse.summary,
      tasks: aiResponse.tasks.map((task) => ({
        description: task.description,
        layer: task.layer,
        hours: task.hours,
        reason: task.reason,
      })),
      totalHours: aiResponse.totalHours,
      confidenceScore: aiResponse.confidenceScore,
    };
  }

  async findAllByRequirementId(requirementId: string): Promise<EstimationItem[]> {
    return this.estimationItemRepository.find({
      where: { requirementId },
      order: { createdAt: 'ASC' },
    });
  }
}
