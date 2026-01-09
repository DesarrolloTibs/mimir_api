import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstimationsService } from './estimations.service';
import { EstimationsController } from './estimations.controller';
import { Requirement } from './entities/requirement.entity';
import { EstimationItem } from './entities/estimation-item.entity';
import { DocumentChunk } from '../documents/entities/document-chunk.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Requirement, EstimationItem, DocumentChunk]),
    CommonModule,
  ],
  controllers: [EstimationsController],
  providers: [EstimationsService],
})
export class EstimationsModule {}
