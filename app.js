// ===== APLICACIÓN PRINCIPAL =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('[App] Inicializando aplicación unificada...');
    
    // Manejar OAuth de Spotify si hay un código en la URL
    handleSpotifyOAuth();
    
    // Inicializar router
    window.router = new Router();
    
    // Configuración global (ahora viene de config.js)
    window.appConfig = window.AppConfig || {
        serverURL: 'https://mysupermusicappgame.azurewebsites.net',
        version: '1.0.0',
        appName: 'Music Game Unified'
    };
    
    // Event listeners globales
    setupGlobalEventListeners();
    
    // Detectar si estamos en móvil
    detectMobileAndRedirect();
    
    console.log('[App] Aplicación inicializada correctamente');
});

// Manejar código OAuth de Spotify
function handleSpotifyOAuth() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
        console.log('[OAuth] Código de Spotify detectado, procesando...');
        
        const REDIRECT_URI = window.location.origin + '/fronts/';
        const serverURL = window.AppConfig?.SERVER_URL || 'https://mysupermusicappgame.azurewebsites.net';
        
        // Mostrar mensaje de procesamiento
        showGlobalMessage('Procesando autenticación de Spotify...', 'info');
        
        fetch(`${serverURL}/auth/spotify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirect_uri: REDIRECT_URI })
        })
        .then(res => res.json())
        .then(data => {
            if (data.access_token) {
                console.log('[OAuth] ✅ Token recibido exitosamente');
                window.localStorage.setItem('spotify_token', data.access_token);
                showGlobalMessage('Conectado a Spotify exitosamente', 'success');
                
                // Limpiar código de la URL y redirigir al monitor
                window.history.replaceState({}, document.title, '/fronts/#/monitor');
                
                // Dar tiempo para que el router se inicialice y luego navegar
                setTimeout(() => {
                    if (window.navigateTo) {
                        window.navigateTo('/monitor');
                    }
                }, 100);
                
            } else {
                console.error('[OAuth] Error al obtener token:', data.error || '');
                showGlobalMessage('Error al conectar con Spotify', 'error');
                // Redirigir al monitor de todas formas
                setTimeout(() => {
                    if (window.navigateTo) {
                        window.navigateTo('/monitor');
                    }
                }, 2000);
            }
        })
        .catch(err => {
            console.error('[OAuth] Error de red:', err);
            showGlobalMessage('Error de conexión con Spotify', 'error');
            // Redirigir al monitor de todas formas
            setTimeout(() => {
                if (window.navigateTo) {
                    window.navigateTo('/monitor');
                }
            }, 2000);
        });
    }
}

function setupGlobalEventListeners() {
    // Manejar errores globales
    window.addEventListener('error', function(e) {
        console.error('[App] Error global:', e.error);
        showGlobalError('Ha ocurrido un error inesperado');
    });
    
    // Manejar errores de promesas no capturadas
    window.addEventListener('unhandledrejection', function(e) {
        console.error('[App] Promise rejection no manejada:', e.reason);
        showGlobalError('Error de conexión');
    });
    
    // Manejar cambios de conectividad
    window.addEventListener('online', function() {
        showGlobalMessage('Conexión restaurada', 'success');
    });
    
    window.addEventListener('offline', function() {
        showGlobalMessage('Sin conexión a internet', 'warning');
    });
}

function detectMobileAndRedirect() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const currentPath = window.location.pathname;
    
    // Si estamos en móvil y no estamos en /control, sugerir /control
    if (isMobile && currentPath === '/') {
        setTimeout(() => {
            if (confirm('¿Te gustaría ir directamente al control móvil?')) {
                window.router.navigateTo('/control');
            }
        }, 1000);
    }
}

function showGlobalError(message) {
    showGlobalMessage(message, 'error');
}

function showGlobalMessage(message, type = 'info') {
    // Crear o actualizar notificación global
    let notification = document.getElementById('global-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'global-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 300px;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    // Aplicar estilos según el tipo
    const styles = {
        success: { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
        error: { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
        warning: { background: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' },
        info: { background: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' }
    };
    
    const style = styles[type] || styles.info;
    Object.assign(notification.style, style);
    notification.textContent = message;
    
    // Mostrar
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Utilidades globales
window.utils = {
    formatTime: function(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },
    
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
};

// Funciones de limpieza para cuando se cambie de ruta
window.addEventListener('beforeunload', function() {
    // Limpiar recursos del monitor
    if (window.MonitorApp && window.MonitorApp.destroy) {
        window.MonitorApp.destroy();
    }
    
    // Limpiar recursos del control
    if (window.ControlApp && window.ControlApp.destroy) {
        window.ControlApp.destroy();
    }
});

// Exportar funciones útiles globalmente
window.showGlobalMessage = showGlobalMessage;
window.showGlobalError = showGlobalError;