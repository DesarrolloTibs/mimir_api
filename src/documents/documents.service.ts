import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentStatus } from './entities/document-status.enum';
import { DocumentChunk } from './entities/document-chunk.entity';
import pdf from 'pdf-parse';
import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(DocumentChunk)
    private readonly documentChunkRepository: Repository<DocumentChunk>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

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
      processingStatus: DocumentStatus.PENDING,
    });

    const savedDocument = await this.documentRepository.save(document);

    // No esperar a que termine el procesamiento
    this.processDocument(savedDocument.id);

    return savedDocument;
  }

  async findAllByProjectId(projectId: string): Promise<Document[]> {
    return this.documentRepository.find({ where: { projectId } });
  }

  async getProjectChunks(projectId: string): Promise<DocumentChunk[]> {
    const documents = await this.documentRepository.find({
      where: { projectId, processingStatus: DocumentStatus.READY },
    });
    if (documents.length === 0) {
      return [];
    }
    const documentIds = documents.map((doc) => doc.id);
    return this.documentChunkRepository.find({
      where: { document: { id: In(documentIds) } },
    });
  }

  async processDocument(documentId: string): Promise<void> {
    this.logger.log(`Starting processing for document ${documentId}`);

    const document = await this.documentRepository.findOneBy({ id: documentId });
    if (!document) {
      this.logger.error(`Document with ID ${documentId} not found`);
      return;
    }

    try {
      await this.updateStatus(documentId, DocumentStatus.PROCESSING);

      const dataBuffer = fs.readFileSync(document.filePath);
      const pdfData = await pdf(dataBuffer);
      const text = pdfData.text;

      // Simple chunking strategy (by paragraphs)
      const chunks = text
        .split(/\n\s*\n/)
        .filter((chunk) => chunk.trim() !== '');
      const embeddingModel = this.genAI.getGenerativeModel({
        model: 'gemini-embedding-001',
      });

      // Batching configuration
      const BATCH_SIZE = 100; // Gemini API max batch size for embeddings
      let chunkIndex = 0;

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        this.logger.log(
          `Processing batch starting at index ${i} with ${batch.length} chunks.`,
        );

        const requests = batch.map((text) => ({
          content: { role: 'user', parts: [{ text }] },
        }));

        const result = await embeddingModel.batchEmbedContents({ requests });
        const embeddings = result.embeddings;

        for (let j = 0; j < batch.length; j++) {
          const documentChunk = this.documentChunkRepository.create({
            document: document,
            chunkIndex: chunkIndex,
            content: batch[j],
            embedding: embeddings[j].values,
            metadata: {
              page:
                pdfData.numpages > 0
                  ? (chunkIndex / chunks.length) * pdfData.numpages + 1
                  : 1, // Approximate page
            },
          });
          await this.documentChunkRepository.save(documentChunk);
          this.logger.log(
            `Saved chunk ${chunkIndex} for document ${documentId}`,
          );
          chunkIndex++;
        }

        // Add a delay between batches to further avoid rate limiting
        if (i + BATCH_SIZE < chunks.length) {
          this.logger.log('Waiting 1 second before next batch...');
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      await this.updateStatus(documentId, DocumentStatus.READY);
      this.logger.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process document ${documentId}`, error.stack);
      await this.updateStatus(documentId, DocumentStatus.ERROR, error.message);
    }
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`Attempting to delete document with ID: ${id}`);
    const document = await this.documentRepository.findOneBy({ id });

    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }

    // Delete the physical file
    try {
      await fs.promises.unlink(document.filePath);
      this.logger.log(`Successfully deleted physical file: ${document.filePath}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file ${document.filePath}: ${error.message}. Continuing to delete DB record.`,
      );
    }

    // Delete the database record. CASCADE will handle the chunks.
    const result = await this.documentRepository.delete(id);

    if (result.affected === 0) {
      // This case is unlikely if the findOneBy succeeded, but it's good practice to check.
      throw new NotFoundException(
        `Document with ID "${id}" could not be deleted.`,
      );
    }

    this.logger.log(
      `Successfully deleted document record and associated data for ID: ${id}`,
    );
  }

  private async updateStatus(
    documentId: string,
    status: DocumentStatus,
    errorMessage?: string,
  ): Promise<void> {
    await this.documentRepository.update(documentId, {
      processingStatus: status,
      errorMessage: errorMessage || null,
    });
  }
}

