import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async create(
    projectId: string,
    file: Express.Multer.File,
    filePath: string,
  ): Promise<Document> {
    const document = this.documentRepository.create({
      projectId,
      filename: file.originalname,
      fileType: file.mimetype,
      filePath,
      processingStatus: 'Pending',
    });

    return this.documentRepository.save(document);
  }

  async findAllByProjectId(projectId: string): Promise<Document[]> {
    return this.documentRepository.find({ where: { projectId } });
  }
}
