# API de Imágenes - N8N Dashboard Backend

## Endpoints Disponibles

### 1. Subir una sola imagen
**POST** `/api/images/upload`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
- `image`: Archivo de imagen (requerido)
- Cualquier otro campo adicional como metadatos

**Ejemplo con JavaScript:**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('description', 'Mi imagen');

fetch('http://localhost:5000/api/images/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Imagen subida y procesada correctamente",
  "data": {
    "filename": "image-1702123456789-123456789.jpg",
    "originalName": "mi-foto.jpg",
    "mimetype": "image/jpeg",
    "size": 1024000,
    "path": "/uploads/image-1702123456789-123456789.jpg",
    "url": "/uploads/image-1702123456789-123456789.jpg",
    "timestamp": "2024-12-09T10:30:45.123Z",
    "source": "dashboard",
    "n8nResponse": { ... }
  }
}
```

### 2. Subir múltiples imágenes
**POST** `/api/images/upload-multiple`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
- `images`: Múltiples archivos de imagen (máximo 10)
- Cualquier otro campo adicional como metadatos

**Ejemplo con JavaScript:**
```javascript
const formData = new FormData();
Array.from(fileInput.files).forEach(file => {
  formData.append('images', file);
});
formData.append('description', 'Múltiples imágenes');

fetch('http://localhost:5000/api/images/upload-multiple', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### 3. Verificar estado de N8N
**GET** `/api/images/status`

**Respuesta:**
```json
{
  "success": true,
  "message": "N8N Images webhook está funcionando correctamente",
  "status": "connected",
  "url": "https://jairquispe.app.n8n.cloud/webhook-test/...",
  "timestamp": "2024-12-09T10:30:45.123Z"
}
```

### 4. Health Check
**GET** `/api/images/health`

**Respuesta:**
```json
{
  "success": true,
  "service": "images",
  "status": "OK",
  "timestamp": "2024-12-09T10:30:45.123Z",
  "endpoints": { ... },
  "n8nUrl": "https://jairquispe.app.n8n.cloud/webhook-test/..."
}
```

### 5. Acceder a imágenes subidas
**GET** `/uploads/:filename`

**Ejemplo:**
```
http://localhost:5000/uploads/image-1702123456789-123456789.jpg
```

## Tipos de archivo soportados

- JPEG (.jpeg, .jpg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)
- SVG (.svg)

## Límites

- **Tamaño máximo por archivo:** 10MB
- **Número máximo de archivos simultáneos:** 10
- **Tipos de archivo:** Solo imágenes

## Códigos de Error

### 400 - Bad Request
- No se envió ningún archivo
- Tipo de archivo no válido
- Archivo demasiado grande
- Demasiados archivos

### 503 - Service Unavailable
- N8N no está disponible

### 502 - Bad Gateway
- URL de N8N no válida

### 504 - Gateway Timeout
- N8N tardó demasiado en responder

## Integración con N8N

Las imágenes se envían automáticamente al webhook de N8N configurado en:
```
N8N_IMAGES_WEBHOOK_URL=https://jairquispe.app.n8n.cloud/webhook-test/0dffbc94-131f-4fda-bbd3-f199010d86c0
```

Los datos enviados a N8N incluyen:
- Información del archivo (nombre, tamaño, tipo)
- URL para acceder a la imagen
- Metadatos adicionales del formulario
- Timestamp y source

## Estructura de datos enviados a N8N

### Para una imagen:
```json
{
  "filename": "image-1702123456789-123456789.jpg",
  "originalName": "mi-foto.jpg",
  "mimetype": "image/jpeg",
  "size": 1024000,
  "path": "/path/to/file",
  "url": "/uploads/image-1702123456789-123456789.jpg",
  "timestamp": "2024-12-09T10:30:45.123Z",
  "source": "dashboard",
  "metadata": { ... } // Datos adicionales del formulario
}
```

### Para múltiples imágenes:
```json
{
  "files": [
    {
      "filename": "image-1702123456789-123456789.jpg",
      "originalName": "foto1.jpg",
      // ... más datos del archivo
    },
    {
      "filename": "image-1702123456789-987654321.png",
      "originalName": "foto2.png",
      // ... más datos del archivo
    }
  ],
  "totalFiles": 2,
  "timestamp": "2024-12-09T10:30:45.123Z",
  "source": "dashboard",
  "metadata": { ... }
}
```
