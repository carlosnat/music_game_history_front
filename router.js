// ===== SISTEMA DE ROUTING =====
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.baseURL = window.location.origin;
        
        // Configurar rutas
        this.setupRoutes();
        
        // Escuchar cambios de URL (tanto pathname como hash)
        window.addEventListener('popstate', () => this.handleRoute());
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Interceptar clicks en links
        this.setupLinkInterception();
        
        // Cargar ruta inicial
        this.handleRoute();
    }
    
    setupRoutes() {
        this.routes.set('/', {
            view: 'home-view',
            title: 'Music Game - Inicio',
            handler: () => this.showHome()
        });
        
        this.routes.set('/monitor', {
            view: 'monitor-view',
            title: 'Music Game - Monitor',
            handler: () => this.showMonitor()
        });
        
        this.routes.set('/control', {
            view: 'control-view',
            title: 'Music Game - Control',
            handler: () => this.showControl()
        });
    }
    
    setupLinkInterception() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                this.navigateTo(route);
            }
        });
    }
    
    navigateTo(path) {
        if (this.currentRoute !== path) {
            // Si estamos usando hash routing, actualizar el hash
            if (window.location.hash) {
                window.location.hash = path;
            } else {
                // Usar history API para pathname routing
                history.pushState(null, '', path);
            }
            this.handleRoute();
        }
    }
    
    handleRoute() {
        // Obtener la ruta actual (puede ser pathname o hash)
        let path = this.getCurrentPath();
        const route = this.routes.get(path);
        
        // Siempre ocultar todas las vistas primero
        this.hideAllViews();
        this.hideLoading();
        
        if (route) {
            this.currentRoute = path;
            document.title = route.title;
            this.updateNavigation();
            
            // Mostrar loading
            this.showLoading();
            
            // Ejecutar handler de la ruta
            setTimeout(() => {
                route.handler();
                this.hideLoading();
                this.showView(route.view);
            }, 300);
            
        } else {
            // Ruta no encontrada
            this.show404();
        }
    }
    
    getCurrentPath() {
        // Priorizar hash routing si existe
        if (window.location.hash) {
            // Extraer la ruta del hash (ej: #/control -> /control)
            let hashPath = window.location.hash.substring(1);
            if (hashPath && hashPath.startsWith('/')) {
                // Remover query parameters del hash si existen
                const queryIndex = hashPath.indexOf('?');
                if (queryIndex !== -1) {
                    hashPath = hashPath.substring(0, queryIndex);
                }
                
                // Limpiar cualquier prefijo /fronts que pueda haber llegado
                if (hashPath.startsWith('/fronts/')) {
                    hashPath = hashPath.substring(7); // Remover '/fronts'
                    if (!hashPath.startsWith('/')) {
                        hashPath = '/' + hashPath;
                    }
                }
                
                return hashPath;
            }
        }
        
        // Usar pathname como fallback
        let pathname = window.location.pathname;
        
        // Remover query parameters del pathname si existen
        const queryIndex = pathname.indexOf('?');
        if (queryIndex !== -1) {
            pathname = pathname.substring(0, queryIndex);
        }
        
        // Limpiar cualquier prefijo /fronts que pueda haber llegado
        if (pathname.startsWith('/fronts/')) {
            pathname = pathname.substring(7); // Remover '/fronts'
            if (!pathname.startsWith('/')) {
                pathname = '/' + pathname;
            }
        }
        
        // Si pathname está vacío después de limpiar, usar '/'
        if (!pathname || pathname === '') {
            pathname = '/';
        }
        
        return pathname;
    }
    
    hideAllViews() {
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.classList.add('hidden'));
    }
    
    showView(viewId) {
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.remove('hidden');
        }
    }
    
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }
    
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }
    
    updateNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const route = link.getAttribute('data-route');
            if (route === this.currentRoute) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    showHome() {
        console.log('[Router] Mostrando página de inicio');
        // La página de inicio es estática, no necesita lógica adicional
    }
    
    showMonitor() {
        console.log('[Router] Cargando monitor...');
        if (window.MonitorApp) {
            window.MonitorApp.init();
        }
    }
    
    showControl() {
        console.log('[Router] Cargando control...');
        if (window.ControlApp) {
            window.ControlApp.init();
        }
    }
    
    show404() {
        console.log('[Router] Página no encontrada - Ruta:', this.getCurrentPath());
        this.hideAllViews();
        this.hideLoading();
        this.showView('not-found-view');
        document.title = 'Music Game - 404';
        
        // Limpiar navegación activa
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
    }
}

// Función global para navegación
function navigateTo(path) {
    if (window.router) {
        window.router.navigateTo(path);
    }
}

// Exportar para uso global
window.Router = Router;
window.navigateTo = navigateTo;