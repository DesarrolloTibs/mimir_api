**Para el Programador Frontend:**

A continuación, se detalla la información necesaria para consumir los servicios de Chat y Estimaciones.

### 1. Autenticación

Todos los endpoints requieren autenticación mediante un token JWT. Este token debe ser incluido en el encabezado `Authorization` como un `Bearer Token`.

```
Authorization: Bearer <your_jwt_token>
```

### 2. Servicio de Chat

Este servicio permite interactuar con el asistente de IA para un proyecto específico.

#### 2.1. Endpoint: Enviar Mensaje

*   **URL:** `/chat/message`
*   **Método HTTP:** `POST`
*   **Descripción:** Envía un mensaje al asistente de chat y recibe una respuesta. Puede iniciar una nueva sesión de chat o continuar una existente.

**Cuerpo de la Solicitud (`Request Body`):** `application/json`

```typescript
// PostMessageDto
interface PostMessageDto {
  projectId: string; // UUID, requerido, ID del proyecto
  sessionId?: string; // UUID, opcional, ID de la sesión de chat para continuar
  message: string;   // string, requerido, el mensaje del usuario
}
```

**Ejemplo de Cuerpo de Solicitud:**

```json
{
  "projectId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "message": "¿Cuál es el esquema de la base de datos para los usuarios?"
}
```

o para continuar una sesión:

```json
{
  "projectId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "sessionId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
  "message": "¿Y cómo se relaciona con la tabla de proyectos?"
}
```

**Estructura de la Respuesta (`Response`):** `application/json`

```typescript
interface ChatResponse {
  answer: string;    // La respuesta generada por la IA
  sessionId: string; // El ID de la sesión de chat (nuevo o existente)
}
```

**Ejemplo de Respuesta:**

```json
{
  "answer": "El esquema de la base de datos para los usuarios incluye campos como `id`, `nombre`, `email`, `password_hash`, `rol` y `fecha_creacion`.",
  "sessionId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"
}
```

### 3. Servicio de Estimaciones

Este servicio permite generar estimaciones técnicas para requisitos basados en documentos.

#### 3.1. Endpoint: Generar Estimación

*   **URL:** `/estimations/generate`
*   **Método HTTP:** `POST`
*   **Descripción:** Genera una estimación de tareas y horas para un requisito específico, utilizando un documento como contexto.

**Cuerpo de la Solicitud (`Request Body`):** `application/json`

```typescript
// GenerateEstimationDto
interface GenerateEstimationDto {
  projectId: string;        // UUID, requerido, ID del proyecto
  documentId: string;       // UUID, requerido, ID del documento para la estimación
  requirementText?: string; // string, opcional, texto adicional del requisito
}
```

**Ejemplo de Cuerpo de Solicitud:**

```json
{
  "projectId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "documentId": "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
  "requirementText": "Implementar un dashboard de administración con gráficos de usuarios y ventas."
}
```

**Estructura de la Respuesta (`Response`):** `application/json`

```typescript
// EstimationTaskDto
interface EstimationTaskDto {
  description: string; // Descripción detallada de la tarea
  layer: string;       // Capa a la que pertenece la tarea (e.g., "Frontend", "Backend", "DevOps", "QA", "Documentation")
  hours: number;       // Horas estimadas para la tarea
  reason: string;      // Justificación de la estimación
}

// EstimationResponseDto
interface EstimationResponseDto {
  summary: string;           // Un resumen de la estimación
  tasks: EstimationTaskDto[]; // Lista de tareas estimadas
  totalHours: number;        // Total de horas estimadas para el proyecto
  confidenceScore: number;   // Puntuación de confianza de la estimación (0-100)
}
```

**Ejemplo de Respuesta:**

```json
{
  "summary": "Estimación para la implementación de un dashboard de administración.",
  "tasks": [
    {
      "description": "Diseño de la interfaz de usuario del dashboard",
      "layer": "Frontend",
      "hours": 16,
      "reason": "Creación de wireframes y prototipos en Figma."
    },
    {
      "description": "Desarrollo del componente de gráficos de usuarios",
      "layer": "Frontend",
      "hours": 24,
      "reason": "Implementación en Angular utilizando Chart.js para visualización de datos."
    },
    {
      "description": "Desarrollo del endpoint para obtener datos de usuarios",
      "layer": "Backend",
      "hours": 12,
      "reason": "Creación de un controlador y servicio en NestJS para servir los datos filtrados."
    }
  ],
  "totalHours": 52,
  "confidenceScore": 85
}
```

### 4. Manejo de Errores

El API devolverá códigos de estado HTTP estándar para indicar el resultado de la solicitud.

*   `2xx` (Ej. `200 OK`, `201 Created`): Éxito. La respuesta contendrá los datos esperados.
*   `400 Bad Request`: La solicitud del cliente es inválida (ej. DTOs mal formados, validación fallida).
*   `401 Unauthorized`: No se proporcionó un token JWT válido o no se proporcionó ningún token.
*   `403 Forbidden`: El usuario autenticado no tiene permisos para realizar la acción.
*   `500 Internal Server Error`: Un error inesperado en el servidor.

En caso de errores `4xx` o `5xx`, la respuesta generalmente tendrá una estructura JSON similar a:

```json
{
  "statusCode": 400,
  "message": "Mensaje de error detallado",
  "error": "Tipo de error (ej. Bad Request)"
}
```

### 5. Ejemplo de Uso (Angular con HttpClient)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface PostMessageDto {
  projectId: string;
  sessionId?: string;
  message: string;
}

interface ChatResponse {
  answer: string;
  sessionId: string;
}

interface GenerateEstimationDto {
  projectId: string;
  documentId: string;
  requirementText?: string;
}

interface EstimationTaskDto {
  description: string;
  layer: string;
  hours: number;
  reason: string;
}

interface EstimationResponseDto {
  summary: string;
  tasks: EstimationTaskDto[];
  totalHours: number;
  confidenceScore: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'YOUR_API_BASE_URL'; // Reemplazar con la URL base de tu API

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token'); // Obtener el token JWT del almacenamiento local
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  postChatMessage(payload: PostMessageDto): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat/message`, payload, { headers: this.getAuthHeaders() });
  }

  generateEstimation(payload: GenerateEstimationDto): Observable<EstimationResponseDto> {
    return this.http.post<EstimationResponseDto>(`${this.apiUrl}/estimations/generate`, payload, { headers: this.getAuthHeaders() });
  }
}
```