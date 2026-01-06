1. Visión General
MIMIR es un asistente técnico basado en IA que ayuda al equipo de desarrollo a reducir la incertidumbre en la etapa de análisis. El sistema ingesta documentación técnica (PDFs), "memoriza" el contexto y asiste en la generación de estimaciones de tiempo y resolución de dudas técnicas.

MÓDULO 1: GESTIÓN DE PROYECTOS
📝 HU-01: Creación de Proyecto (Onboarding)
Descripción: Como Líder Técnico, quiero un formulario en un modal para registrar un nuevo proyecto, definiendo su contexto tecnológico, para que MIMIR sepa qué reglas aplicar al estimar.
Criterios de Aceptación (Funcionales):
1.	El nombre del proyecto es obligatorio (min 5, max 50 caracteres).
2.	El campo "Tech Stack" es un input de texto libre (Ej: "React, Node, AWS") pero obligatorio.
3.	Al guardar correctamente, el modal se cierra y la lista de proyectos se actualiza sin recargar la página (Optimistic UI).
4.	Si el Backend devuelve error, mostrar un Toast rojo en la esquina superior derecha.
Detalle UI/UX (React + Tailwind):
•	Componente: ProjectCreateModal.tsx
•	Estilo: Usar un fondo desenfocado (backdrop-blur-sm). El botón de "Crear" debe tener estado de carga (disabled + spinner) mientras la petición viaja.
•	Colores: Botón principal en bg-indigo-600 hover:bg-indigo-700.
Contrato Técnico (Endpoint):
•	POST /api/projects
•	Body: { "name": "string", "client": "string", "techStack": "string" }
•	Response (201): { "id": "uuid", "name": "...", "createdAt": "ISO-Date" }
________________________________________
MÓDULO 2: EL CODEX (INGESTA)
📝 HU-02: Carga de Documentos con Drag & Drop
Descripción: Como Desarrollador, quiero arrastrar archivos PDF a un área designada dentro del detalle del proyecto para subirlos al servidor y que comience su análisis.
Criterios de Aceptación:
1.	Restricción: Solo permitir archivos .pdf. Si el usuario arrastra un .jpg o .docx, mostrar borde rojo y mensaje de error inmediato.
2.	Tamaño: Máximo 10MB por archivo. Validar en el cliente (Frontend) antes de enviar.
3.	Feedback Visual: Mostrar una barra de progreso real (0% a 100%) usando el evento onUploadProgress de Axios.
4.	Al terminar la subida, el documento aparece en la lista con estado "Procesando" (Icono amarillo animado).
Detalle UI/UX:
•	Librería sugerida: react-dropzone.
•	Estilos Tailwind: Zona de drop con borde punteado (border-dashed border-2 border-gray-600) que cambia de color (bg-gray-800) cuando pasas el archivo por encima (hover).
Contrato Técnico:
•	POST /api/projects/:id/documents/upload
•	Header: Content-Type: multipart/form-data
•	Body: file: (Binary)
•	Response (200): { "documentId": "uuid", "status": "Pending" }
________________________________________
📝 HU-03: Visualización de Estado de Ingesta (Polling)
Descripción: Como Usuario, quiero ver cuando el documento pase de "Procesando" a "Listo" automáticamente, para saber cuándo puedo empezar a hacer preguntas.
Contexto Técnico: La vectorización en el Backend (NestJS + Gemini) tarda unos 5-10 segundos. El frontend no debe quedarse "congelado".
Criterios de Aceptación:
1.	El Frontend debe consultar el estado de los documentos cada 5 segundos (Polling) mientras haya alguno en estado Pending o Processing.
2.	Cuando el estado cambie a Ready, detener el polling para ese ítem y cambiar el icono a un "Check Verde" (text-green-500).
3.	Si cambia a Error, mostrar un icono de alerta rojo y permitir ver el mensaje de error en un tooltip.
Contrato Técnico:
•	GET /api/projects/:id/documents
•	Response:
JSON
[
  {
    "id": "uuid",
    "filename": "Requerimientos.pdf",
    "status": "Processing" // Frontend reacciona a este string
  }
]
________________________________________
MÓDULO 3: EL ORÁCULO (ESTIMACIÓN)
📝 HU-04: Generación de Estimación Técnica (El Core)
Descripción: Como Líder, quiero ingresar un requerimiento en lenguaje natural y recibir una tabla estructurada con tareas, horas y justificación técnica.
Criterios de Aceptación:
1.	Input: Un textarea grande que permita saltos de línea.
2.	Loading State: Mientras Mimir "piensa" (consulta RAG + Gemini), mostrar una animación de "Esqueleto" (Skeleton Loader) simulando que se están escribiendo filas en la tabla. Esto reduce la ansiedad de espera (que puede durar 15-20 segundos).
3.	Output: Renderizar una tabla con las columnas: Tarea, Capa (Front/Back), Horas Sugeridas, Confianza.
4.	Confidence Score:
o	Si confianza < 50%: Mostrar badge Rojo.
o	Si confianza 50-80%: Badge Amarillo.
o	Si confianza > 80%: Badge Verde.
Detalle UI/UX:
•	Tabla: Usar componentes de tabla limpios (ej. shadcn/ui o tabla nativa HTML con clases w-full text-left border-collapse).
•	Efecto: Mimir debe parecer que está "escribiendo" (Typewriter effect) si es posible, o simplemente mostrar el bloque completo al terminar.
Contrato Técnico (Vital para el Dev):
•	POST /api/estimations/generate
•	Body: { "projectId": "uuid", "requirement": "Necesito un login con Google" }
•	Response (JSON esperado):
JSON
{
  "summary": "Implementación de Auth0 con Guardias en NestJS",
  "tasks": [
    {
      "description": "Configurar Estrategia Google OAuth en NestJS",
      "layer": "Backend",
      "hours": 4,
      "reason": "Documento de arquitectura pág 5 especifica PassportJS"
    },
    {
      "description": "Botón de Login y Redirección en React",
      "layer": "Frontend",
      "hours": 3,
      "reason": "Componente estándar reutilizable"
    }
  ],
  "totalHours": 7,
  "confidenceScore": 85
}
________________________________________
MÓDULO 4: CHAT RAG (Q&A)
📝 HU-05: Chat Contextual con Citas
Descripción: Como Desarrollador, quiero preguntar dudas técnicas y recibir respuestas que incluyan la fuente exacta (página del PDF) para verificar la información.
Criterios de Aceptación:
1.	Interfaz tipo Chat (burbujas a la derecha para usuario, izquierda para Mimir).
2.	Citas: Al final de la respuesta de Mimir, deben aparecer pequeños "chips" o enlaces que digan: [Fuente: Requerimientos.pdf - Pág 4].
3.	Al hacer clic en la cita, idealmente abrir un modal con el texto crudo de ese fragmento (Opcional para MVP, pero deseable).
4.	El chat debe mantener el historial de la sesión actual.
Contrato Técnico:
•	POST /api/chat/message
•	Response:
JSON
{
  "answer": "El campo RFC es varchar(13) y requiere validación regex.",
  "citations": [
    { "docName": "DiccionarioDatos.pdf", "page": 12, "similarity": 0.89 }
  ]
}


Estructura de Base de datos 

-- =========================================================
-- CONFIGURACIÓN INICIAL
-- =========================================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. CAPA DE ORGANIZACIÓN (Usuarios y Proyectos)
-- =========================================================

-- Necesitamos saber QUIÉN subió el documento o quién validó la estimación
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    role VARCHAR(50) DEFAULT 'Developer', -- 'Admin', 'Architect', 'Developer'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    client_name VARCHAR(150), -- Importante para consultoras
    description TEXT,
    
    -- Stack Tecnológico base para que Mimir sepa qué contexto usar
    tech_stack_context TEXT, -- Ej: "Backend: .NET 8, DB: SQL Server, Front: Angular 17"
    
    status VARCHAR(50) DEFAULT 'Active', -- 'Planning', 'Active', 'Maintenance', 'Closed'
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 2. EL CEREBRO / RAG (Documentos y Vectores)
-- =========================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Ruta en Blob Storage / S3 / MinIO
    file_type VARCHAR(50), -- pdf, docx, txt, md
    
    -- ESTADOS CRÍTICOS: La vectorización no es instantánea.
    -- 'Pending': Subido. 'Processing': Mimir lo está leyendo. 'Ready': Listo para buscar. 'Error': Falló.
    processing_status VARCHAR(20) DEFAULT 'Pending', 
    error_message TEXT,
    
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    
    chunk_index INT NOT NULL, -- Para reconstruir el orden del texto si es necesario
    content TEXT NOT NULL, -- El fragmento de texto real
    
    -- Metadata en JSONB: Esto es vital.
    -- Aquí guardas: { "page": 5, "section": "Requisitos de Seguridad", "tokens": 120 }
    metadata JSONB DEFAULT '{}',
    
    -- El Vector (Dimensiones: 768 para Google Gemini / Vertex AI Gecko)
    embedding vector(768) 
);

-- Índice HNSW para búsqueda ultrarrápida (Vital para rendimiento)
CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- =========================================================
-- 3. MOTOR DE ESTIMACIÓN (Lo que da valor al negocio)
-- =========================================================

-- Un proyecto tiene "Historias de Usuario" o "Requerimientos Macro"
CREATE TABLE requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL, -- Ej: "Módulo de Facturación"
    original_text TEXT, -- El texto extraído del documento que originó esto
    status VARCHAR(50) DEFAULT 'Identified', -- 'Identified', 'Estimated', 'Approved'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- El desglose técnico detallado (Aquí es donde Mimir brilla)
CREATE TABLE estimation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    
    task_description VARCHAR(500) NOT NULL, -- Ej: "Crear SP de cálculo de impuestos"
    layer VARCHAR(50), -- 'Backend', 'Frontend', 'Database', 'DevOps', 'QA'
    
    -- La predicción de la IA
    ai_suggested_hours DECIMAL(10,2),
    ai_confidence_score INT, -- 0 a 100 (Qué tan seguro está Mimir)
    ai_reasoning TEXT, -- "Basado en la complejidad de la tabla X..."
    
    -- La validación humana (Tu equipo corrige a la IA)
    human_adjusted_hours DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 4. INTERACCIÓN Y TRAZABILIDAD (Chat & Citas)
-- =========================================================

CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id), -- Quién está preguntando
    title VARCHAR(150), -- "Dudas sobre integración SAP"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    
    role VARCHAR(20) CHECK (role IN ('user', 'assistant')), 
    content TEXT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA NUEVA: CITAS (Evidence)
-- Para que cuando Mimir responda, te diga: "Lo saqué de la página 4 del PDF X"
CREATE TABLE message_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    document_chunk_id UUID REFERENCES document_chunks(id),
    relevance_score FLOAT -- Qué tanto se parece (Distancia del vector)
);


