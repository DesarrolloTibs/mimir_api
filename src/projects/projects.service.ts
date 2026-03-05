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
  ) { }

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

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      relations: ['requirements'],
    });
  }

  async uploadDocument(projectId: string, file: Express.Multer.File) {
    const project = await this.projectRepository.findOneBy({ id: projectId });
    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Fix for filename encoding issues from multer
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    file.originalname = originalname;

    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, `${Date.now()}-${file.originalname}`);
    await fs.writeFile(filePath, file.buffer);

    const document = await this.documentsService.create(
      projectId,
      file,
      filePath,
    );

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
