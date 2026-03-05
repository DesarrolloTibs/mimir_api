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
interface Citation {
  chunkId: string;
}

interface ChatResponse {
  answer: string;    // La respuesta generada por la IA
  sessionId: string; // El ID de la sesión de chat (nuevo o existente)
  citations: Citation[]; // Colección de referencias usadas por la IA (evidence)
}
```

**Ejemplo de Respuesta:**

```json
{
  "answer": "El esquema de la base de datos para los usuarios incluye campos como `id`, `nombre`, `email`, `password_hash`, `rol` y `fecha_creacion`.",
  "sessionId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
  "citations": [
    {
      "chunkId": "f12eebc99-9c0b-4ef8-bb6d-6bb9bd380a99"
    }
  ]
}
```

#### 2.2. Endpoint: Historial de Sesiones por Proyecto

*   **URL:** `/chat/sessions/project/:projectId`
*   **Método HTTP:** `GET`
*   **Descripción:** Retorna todas las sesiones de chat iniciadas en un proyecto, ordenadas de la más reciente a la más antigua. Útil para mostrar un sidebar con el historial de chats.

**Ejemplo de Respuesta:**

```json
[
  {
    "id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    "projectId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "title": "Chat session started at 2023-10-24T18:30:00.000Z",
    "createdAt": "2023-10-24T18:30:00.000Z"
  }
]
```

#### 2.3. Endpoint: Mensajes por Sesión (Historial de Conversación)

*   **URL:** `/chat/sessions/:sessionId/messages`
*   **Método HTTP:** `GET`
*   **Descripción:** Retorna todos los mensajes (del usuario y de la IA) pertenecientes a una sesión de chat en orden cronológico. Incluye las citas generadas por la IA.

**Ejemplo de Respuesta:**

```json
[
  {
    "id": "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    "sessionId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    "role": "user",
    "content": "¿Cuál es el esquema de la base de datos?",
    "createdAt": "2023-10-24T18:30:00.000Z",
    "citations": []
  },
  {
    "id": "d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
    "sessionId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    "role": "assistant",
    "content": "El esquema de la base de datos para los usuarios incluye campos como `id`, `nombre`...",
    "createdAt": "2023-10-24T18:30:05.000Z",
    "citations": [
      {
        "id": "e1eebc99-9c0b-...",
        "messageId": "d1eebc99-9c0b-...",
        "documentChunkId": "f12eebc99-..."
      }
    ]
  }
]
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

#### 3.2. Endpoint: Historial de Estimaciones por Proyecto

*   **URL:** `/estimations/project/:projectId`
*   **Método HTTP:** `GET`
*   **Descripción:** Retorna el historial de todas las estimaciones generadas para un proyecto, ordenadas de la más reciente a la más antigua.

**Ejemplo de Respuesta:**

```json
[
  {
    "id": "uuid-del-requerimiento",
    "projectId": "uuid-del-proyecto",
    "title": "Implementar un dashboard de administración con gráficos...",
    "status": "Estimated",
    "createdAt": "2023-10-24T18:30:00.000Z",
    "totalHours": 52,
    "confidenceScore": 85,
    "tasks": [
      {
        "id": "uuid-del-item",
        "description": "Diseño de la interfaz de usuario...",
        "layer": "Frontend",
        "hours": 16,
        "reason": "Creación de wireframes y prototipos en Figma."
      }
    ]
  }
]
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

### 5. Ejemplo de Uso (React con Fetch API)

Salvo que utilices algún cliente como Axios, este es un ejemplo de cómo crear los servicios usando la Fetch API nativa en cualquier componente de React.

```typescript
// types.ts
export interface PostMessageDto {
  projectId: string;
  sessionId?: string;
  message: string;
}

export interface Citation {
  chunkId: string;
}

export interface ChatResponse {
  answer: string;
  sessionId: string;
  citations: Citation[];
}

export interface GenerateEstimationDto {
  projectId: string;
  documentId: string;
  requirementText?: string;
}

export interface EstimationTaskDto {
  description: string;
  layer: string;
  hours: number;
  reason: string;
}

export interface EstimationResponseDto {
  summary: string;
  tasks: EstimationTaskDto[];
  totalHours: number;
  confidenceScore: number;
}

// apiService.ts
const API_URL = 'http://localhost:3000'; // Reemplazar con la URL base de tu API

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('jwt_token'); // Obtener el token JWT del localstorage
  return {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`
  };
};

export const ApiService = {
  postChatMessage: async (payload: PostMessageDto): Promise<ChatResponse> => {
    const response = await fetch(\`\${API_URL}/chat/message\`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Error posteando mensaje');
    return response.json();
  },

  generateEstimation: async (payload: GenerateEstimationDto): Promise<EstimationResponseDto> => {
    const response = await fetch(\`\${API_URL}/estimations/generate\`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Error generando estimación');
    return response.json();
  },

  getProjectEstimations: async (projectId: string): Promise<any[]> => {
    const response = await fetch(\`\${API_URL}/estimations/project/\${projectId}\`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error obteniendo historial de estimaciones');
    return response.json();
  }
};
```