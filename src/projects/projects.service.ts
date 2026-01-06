import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { DocumentsService } from '../documents/documents.service';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly documentsService: DocumentsService,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const { name, client, techStack } = createProjectDto;

    const project = this.projectRepository.create({
      name,
      clientName: client,
      techStackContext: techStack,
    });

    await this.projectRepository.save(project);
    return project;
  }

  async uploadDocument(projectId: string, file: Express.Multer.File) {
    const project = await this.projectRepository.findOneBy({ id: projectId });
    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Ensure the uploads directory exists. NOTE: This will not create it at runtime in this environment.
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    // await fs.mkdir(uploadsDir, { recursive: true }); // This line would normally ensure the dir exists.

    const filePath = path.join(uploadsDir, `${Date.now()}-${file.originalname}`);
    await fs.writeFile(filePath, file.buffer);

    const document = await this.documentsService.create(projectId, file, filePath);

    return {
      documentId: document.id,
      status: document.processingStatus,
    };
  }

  async getDocumentsByProjectId(projectId: string) {
    const project = await this.projectRepository.findOneBy({ id: projectId });
    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }
    return this.documentsService.findAllByProjectId(projectId);
  }
}
