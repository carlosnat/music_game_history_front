// ===== SISTEMA DE ROUTING =====
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.baseURL = window.location.origin;
        
        // Configurar rutas
        this.setupRoutes();
        
        // Escuchar cambios de URL
        window.addEventListener('popstate', () => this.handleRoute());
        
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
            history.pushState(null, '', path);
            this.handleRoute();
        }
    }
    
    handleRoute() {
        const path = window.location.pathname;
        const route = this.routes.get(path);
        
        if (route) {
            this.currentRoute = path;
            document.title = route.title;
            this.hideAllViews();
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
        console.log('[Router] Página no encontrada');
        this.hideAllViews();
        this.hideLoading();
        this.showView('not-found-view');
        document.title = 'Music Game - 404';
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