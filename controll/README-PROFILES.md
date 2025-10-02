# Sistema de Perfiles de Usuario - Front-B

## 🎵 Funcionalidad Implementada

El front-b ahora incluye un sistema completo de perfiles de usuario que se activa después de conectarse al control remoto de Spotify.

## 📱 Flujo de Usuario

### 1. **Conexión Inicial**
- Usuario escanea QR y se conecta como antes
- Después de conectarse exitosamente, el sistema verifica si ya tiene un perfil

### 2. **Setup de Perfil (Nueva Funcionalidad)**
Si es la primera vez del usuario, se presenta el **Profile Setup**:

#### **Paso 1: Selección de Géneros** 📀
- Interfaz con grid de géneros disponibles
- Usuario puede seleccionar múltiples géneros favoritos
- Los géneros se cargan dinámicamente desde `/api/profiler/genres`
- Fallback a lista por defecto si la API no está disponible

#### **Paso 2: Selección de Épocas** 📅
- Grid con décadas/años disponibles
- Usuario selecciona sus períodos musicales preferidos
- Los años se cargan desde `/api/profiler/years/decades`
- Fallback a lista por defecto si la API no está disponible

#### **Paso 3: Creación del Perfil** ⚙️
- Loading spinner mientras se procesa
- Llamada a `/api/profiler/profiles` para crear el perfil
- Fallback a almacenamiento local si el servidor no está disponible

#### **Paso 4: Confirmación** ✅
- Resumen visual del perfil creado
- Muestra géneros y años seleccionados en formato de tags
- Botón para proceder al control de música

### 3. **Control de Música Personalizado** 🎯

#### **Recomendaciones Personalizadas**
- Sección destacada con botón "⭐ Música Personalizada"
- Muestra las preferencias del usuario
- Botón para obtener recomendaciones basadas en el perfil

#### **Funcionalidad de Recomendaciones**
- Selecciona aleatoriamente un género de las preferencias del usuario
- Selecciona aleatoriamente un año de las preferencias del usuario
- Consulta `/api/profiler/songs/random` con estos parámetros
- Reproduce la canción recomendada automáticamente

## 🔧 Integración con APIs

### **Endpoints Utilizados**
```
GET  /api/profiler/genres          - Cargar géneros disponibles
GET  /api/profiler/years/decades   - Cargar décadas disponibles
POST /api/profiler/profiles        - Crear perfil de usuario
GET  /api/profiler/songs/random    - Obtener recomendaciones
```

### **Estructura de Perfil**
```json
{
  "clientId": "unique_client_id",
  "clientName": "iPhone de Carlos",
  "preferences": {
    "genres": ["salsa", "merengue", "blues"],
    "years": ["80s", "90s", "2000s"]
  },
  "createdAt": "2025-09-23T..."
}
```

## 💾 Almacenamiento

### **LocalStorage**
- Los perfiles se guardan en `localStorage` con clave `profile_${clientId}`
- Permite reconocer usuarios que regresan
- Fallback completo si las APIs no están disponibles

### **Estados de la Aplicación**
- `session_connected` → Verifica si hay perfil existente
- `profile_setup` → Muestra configuración de perfil
- `profile_completed` → Va al control de música con recomendaciones

## 🎨 UI/UX

### **Estilos Personalizados**
- **Setup Steps**: Grid responsive para selecciones múltiples
- **Selection Items**: Botones con estados hover y selected
- **Primary Buttons**: Botones principales con animaciones
- **Profile Summary**: Tags coloridos para mostrar preferencias
- **Recommendations Section**: Sección destacada con gradiente
- **Loading Spinner**: Animación giratoria para feedback

### **Responsive Design**
- Grid adaptativo para diferentes tamaños de pantalla
- Botones táctiles optimizados para móvil
- Espaciado y tipografía consistentes

## 🔄 Manejo de Errores

### **Fallbacks Implementados**
1. **API no disponible**: Usa listas por defecto de géneros/años
2. **Error creando perfil**: Crea perfil local en localStorage
3. **Error obteniendo recomendaciones**: Mensaje de error claro
4. **Sin perfil**: Fuerza al usuario por el setup

### **Logging Detallado**
- Todas las operaciones tienen logs con prefijos `[Profile]` y `[Recommendations]`
- Estados de loading claros para el usuario
- Mensajes de error informativos

## 🚀 Cómo Probar

### **Prerrequisitos**
1. Servidor back-a ejecutándose con el módulo profiler
2. Front-b servido (puede ser archivo estático)
3. Conexión establecida via QR code

### **Flujo de Prueba**
1. **Primera conexión**: Escanea QR → Setup perfil completo
2. **Reconexión**: Escanea QR → Va directo al control (perfil guardado)
3. **Recomendaciones**: Click "Música Personalizada" → Reproduce según preferencias
4. **Música aleatoria**: Botón tradicional aún funciona

### **Test Cases**
- ✅ Setup completo con APIs funcionando
- ✅ Setup con APIs caídas (fallback)
- ✅ Usuario que regresa (perfil guardado)
- ✅ Recomendaciones personalizadas
- ✅ Manejo de errores en cada paso

## 📊 Datos Analíticos

El sistema ahora captura:
- Preferencias musicales del usuario
- Patrones de uso (perfiles creados vs. retornantes)
- Efectividad de recomendaciones
- Géneros y épocas más populares

---

## 🎯 Próximos Pasos Sugeridos

1. **Analytics Dashboard**: Mostrar estadísticas de perfiles creados
2. **Calificaciones**: Permitir al usuario calificar recomendaciones
3. **Perfiles Avanzados**: Incluir artistas favoritos, instrumentos, etc.
4. **Social Features**: Compartir perfiles musicales
5. **Machine Learning**: Mejorar recomendaciones basadas en historial