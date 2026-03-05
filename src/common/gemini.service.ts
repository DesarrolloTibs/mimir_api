import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

interface GeminiEstimation {
  summary: string;
  tasks: {
    description: string;
    layer: 'Frontend' | 'Backend' | 'DevOps' | 'QA' | 'Documentation';
    hours: number;
    reason: string;
  }[];
  totalHours: number;
  confidenceScore: number;
}

@Injectable()
export class GeminiService {
  private geminiApi: GoogleGenerativeAI;
  private model: GenerativeModel;
  private language: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set in the environment variables.',
      );
    }
    this.geminiApi = new GoogleGenerativeAI(apiKey);
    this.model = this.geminiApi.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
    this.language = this.configService.get<string>('GEMINI_LANGUAGE', 'es');
  }

  public async generateText(prompt: string): Promise<string> {
    try {
      const generationConfig = {
        temperature: 0.2,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json', // Expecting JSON for estimations
      };
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating content from Gemini:', error);
      // It's better to throw a specific error here or handle it upstream
      throw new Error('Failed to generate content from Gemini.');
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.geminiApi.getGenerativeModel({
        model: 'gemini-embedding-001',
      });
      const result = await embeddingModel.embedContent({
        content: { role: 'user', parts: [{ text }] },
      });
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating embedding from Gemini:', error);
      throw new Error('Failed to generate embedding from Gemini.');
    }
  }
  async generateEstimation(
    requirementText: string,
    chunks: { content: string }[],
  ): Promise<GeminiEstimation> {
    console.log(
      'Generating estimation for:',
      requirementText.substring(0, 100) + '...',
    );
    console.log(`Using ${chunks.length} document chunks for context.`);

    const contextChunks = this._createContextString(chunks);
    const prompt = `
      Based on the following requirement text and context documents, please generate a work estimation.
      The output must be a JSON object with the following structure:
      {
        "summary": "A brief summary of the project",
        "tasks": [
          {
            "description": "A description of the task",
            "layer": "Frontend" | "Backend" | "DevOps" | "QA" | "Documentation",
            "hours": "Estimated hours for the task",
            "reason": "A brief justification for the estimation"
          }
        ],
        "totalHours": "Total estimated hours for the project",
        "confidenceScore": "A score from 0 to 100 representing the confidence in the estimation"
      }

      Requirement:
      ${requirementText}

      Context Documents:
      ${contextChunks}

      Provide the values for "summary", "description", and "reason" in ${this.language === 'es' ? 'Spanish' : 'English'}.
    `;

    const response = await this.generateText(prompt);
    try {
      const estimation: GeminiEstimation = JSON.parse(response);
      console.log('AI estimation generated successfully.');
      return estimation;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        summary: 'Error parsing Gemini response',
        tasks: [],
        totalHours: 0,
        confidenceScore: 0,
      };
    }
  }

  public async generateChatText(prompt: string): Promise<string> {
    try {
      const generationConfig = {
        temperature: 0.2,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: 'text/plain',
      };
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating content from Gemini:', error);
      throw new Error('Failed to generate chat content from Gemini.');
    }
  }

  async generateChatResponse(
    question: string,
    chunks: { id: string, chunkIndex: number, content: string, metadata: any }[],
  ): Promise<{ answer: string; citations: { chunkId: string }[] }> {
    console.log(
      'Generating chat response for:',
      question.substring(0, 100) + '...',
    );
    console.log(`Using ${chunks.length} document chunks for context.`);

    // Attach unique IDs to text to let the AI quote them
    const contextChunks = chunks
      .map((chunk) => `[CHUNK_ID: ${chunk.id}]\n${chunk.content}`)
      .join('\n\n---\n\n');

    const prompt = `
      Answer the following question based on the provided context documents.
      If the answer is not in the context, say that you cannot answer.
      Provide the answer in ${this.language === 'es' ? 'Spanish' : 'English'}.
      
      You MUST return a JSON object with the following structure:
      {
        "answer": "Your detailed answer",
        "citationIds": ["The CHUNK_ID(s) of the context blocks you used to answer the question"]
      }

      Question:
      ${question}

      Context (EACH CHUNK HAS A CHUNK_ID):
      ${contextChunks}
    `;

    try {
      const generationConfig = {
        temperature: 0.2,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json', // Requesting JSON
      };
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });
      const response = await result.response;
      const jsonStr = response.text();
      const parsed = JSON.parse(jsonStr);

      console.log('AI chat response generated successfully.');

      return {
        answer: parsed.answer || 'No se pudo estructurar la respuesta.',
        citations: (parsed.citationIds || []).map((id: string) => ({ chunkId: id }))
      };
    } catch (error) {
      console.error('Error generating chat content from Gemini:', error);
      return { answer: 'Ocurrió un error al procesar la respuesta con IA.', citations: [] };
    }
  }

  private _createContextString(chunks: { content: string }[]): string {
    return chunks.map((chunk) => chunk.content).join('\n---\n');
  }
}
