import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({
    status: 201,
    description: 'The project has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({
    status: 200,
    description: 'A list of all projects.',
  })
  findAll() {
    return this.projectsService.findAll();
  }

  @Post(':id/documents/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document to a project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'A PDF file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The document has been successfully uploaded.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  uploadFile(
    @Param('id') projectId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.projectsService.uploadDocument(projectId, file);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get all documents for a project' })
  @ApiResponse({
    status: 200,
    description: 'A list of documents for the project.',
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  async getDocuments(@Param('id') projectId: string) {
    const documents = await this.projectsService.getDocumentsByProjectId(
      projectId,
    );
    return documents.map((doc) => ({
      id: doc.id,
      filename: doc.filename,
      status: doc.processingStatus,
    }));
  }
}

