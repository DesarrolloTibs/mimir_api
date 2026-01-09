import {
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document and its related data' })
  @ApiResponse({
    status: 204,
    description: 'The document has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Document not found.' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.documentsService.delete(id);
  }
}
