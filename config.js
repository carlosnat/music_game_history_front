// ===== CONFIGURACIÓN DE LA APLICACIÓN =====
window.AppConfig = {
    // Configuración del servidor
    SERVER_URL: 'https://mysupermusicappgame.azurewebsites.net',
    
    // Configuración de polling (en milisegundos)
    POLLING: {
        COMMANDS: 5000,     // 5 segundos
        CLIENTS: 10000,     // 10 segundos  
        CONNECTIVITY: 30000 // 30 segundos
    },
    
    // Configuración de la aplicación
    APP: {
        NAME: 'Music Game Unified',
        VERSION: '1.0.0',
        DEBUG: false // Cambiar a true para más logs
    },
    
    // Endpoints disponibles (para verificación)
    ENDPOINTS: {
        HEALTH_CHECK: '/',
        COMMANDS: '/commands',
        CLIENTS: '/clients',
        QR_GENERATE: '/generate-qr-url',
        REGISTER_CLIENT: '/register-client',
        HEARTBEAT: '/heartbeat',
        SPOTIFY_AUTH: '/auth/spotify',
        RANDOM_SONG: '/api/random-song',
        GENRES: '/api/profiler/genres',
        CREATE_PROFILE: '/api/profiler/create-profile'
    },
    
    // Configuración de UI
    UI: {
        NOTIFICATION_DURATION: 3000, // 3 segundos
        LOADING_MIN_TIME: 300        // 300ms mínimo de loading
    }
};

// Función para obtener URL completa de endpoint
window.AppConfig.getEndpoint = function(endpointKey) {
    const endpoint = this.ENDPOINTS[endpointKey];
    if (!endpoint) {
        console.warn(`[Config] Endpoint '${endpointKey}' no encontrado`);
        return this.SERVER_URL;
    }
    return this.SERVER_URL + endpoint;
};

// Función para logging condicional
window.AppConfig.log = function(message, level = 'info') {
    if (this.APP.DEBUG || level === 'error' || level === 'warn') {
        console[level]('[AppConfig]', message);
    }
};

console.log('[AppConfig] Configuración cargada:', window.AppConfig.SERVER_URL);