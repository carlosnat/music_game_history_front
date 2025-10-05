// ===== COMPONENTE CONTROL =====
window.ControlApp = {
    baseUrl: window.AppConfig?.SERVER_URL || 'https://mysupermusicappgame.azurewebsites.net',
    currentView: 'scanner',
    sessionId: null,
    clientId: null,
    clientName: null,
    heartbeatInterval: null,
    userProfile: null,
    selectedGenres: [],
    selectedDecades: {},
    availableGenres: [],
    availableYears: [],
    
    init() {
        console.log('[Control] Inicializando control móvil...');
        this.render();
        this.setupEventListeners();
        this.checkURLParams();
    },
    
    render() {
        const container = document.getElementById('control-view');
        container.innerHTML = `
            <div class="control-container">
                <!-- Scanner View -->
                <div id="scanner-view" class="control-card">
                    <div class="control-icon">📱</div>
                    <h2>Control Móvil de Spotify</h2>
                    <p>Para usar esta aplicación, escanea el código QR desde la pantalla principal con la cámara de tu teléfono</p>
                    
                    <div class="info-card">
                        <p><strong>📋 Instrucciones:</strong></p>
                        <ol style="text-align: left; margin: 1rem 0;">
                            <li>Ve a la pantalla principal (/monitor)</li>
                            <li>Busca el código QR en pantalla</li>
                            <li>Escanéalo con la cámara de tu dispositivo</li>
                            <li>Serás redirigido automáticamente aquí</li>
                        </ol>
                    </div>
                    
                    <div id="scanner-status" class="status-message info"></div>
                </div>
                
                <!-- Register View -->
                <div id="register-view" class="control-card hidden">
                    <button class="btn btn-secondary mb-2" onclick="ControlApp.showView('scanner')">← Volver</button>
                    
                    <div class="control-icon">✅</div>
                    <h2>¡QR Detectado!</h2>
                    <p>Tu dispositivo está listo para conectarse. Solo ingresa un nombre para identificarlo en la pantalla principal.</p>
                    
                    <div id="session-info" class="info-card">
                        <h4>Sesión Detectada:</h4>
                        <p id="session-display">Cargando...</p>
                    </div>
                    
                    <input type="text" id="client-name-input" placeholder="Ej: iPhone de Carlos, Samsung Galaxy, etc.">
                    <button id="register-btn" class="control-button">🎵 Conectar al Control de Música</button>
                    
                    <div id="register-status" class="status-message"></div>
                </div>
                
                <!-- Profile Setup View -->
                <div id="profile-setup-view" class="control-card hidden">
                    <button class="btn btn-secondary mb-2" onclick="ControlApp.disconnect()">🔌 Desconectar</button>
                    
                    <div class="control-icon">👤</div>
                    <h2>Configurar tu Perfil Musical</h2>
                    <p>Para darte mejores recomendaciones, cuéntanos sobre tus gustos musicales</p>
                    
                    <div id="profile-setup-steps">
                        <div id="genre-step">
                            <h3>📀 Selecciona tus géneros favoritos</h3>
                            <div id="genres-list" class="selection-grid"></div>
                            
                            <div class="mb-3">
                                <label for="songs-limit">🎵 Canciones por género:</label>
                                <select id="songs-limit">
                                    <option value="10">10 canciones por género</option>
                                    <option value="20" selected>20 canciones por género</option>
                                    <option value="30">30 canciones por género</option>
                                    <option value="50">50 canciones por género</option>
                                    <option value="100">100 canciones por género</option>
                                    <option value="-1">Todas las canciones disponibles</option>
                                </select>
                            </div>
                            
                            <button id="create-profile-btn" class="control-button hidden">Crear mi Perfil 🎵</button>
                        </div>
                    </div>
                    
                    <div id="profile-setup-status" class="status-message"></div>
                </div>
                
                <!-- Control View -->
                <div id="music-control-view" class="control-card hidden">
                    <button class="btn btn-secondary mb-2" onclick="ControlApp.disconnect()">🔌 Desconectar</button>
                    
                    <div id="client-info" class="info-card">
                        <h4>Dispositivo Conectado</h4>
                        <p id="client-info-text">Conectando...</p>
                    </div>
                    
                    <div class="control-icon">🎵</div>
                    <h2>Control de Música</h2>
                    <p>¡Descubre música increíble de forma aleatoria!</p>
                    
                    <button id="start-music-btn" class="control-button">
                        🎲 Iniciar Música Aleatoria
                    </button>
                    
                    <div id="current-song-info" class="hidden">
                        <h4>🎵 Reproduciendo:</h4>
                        <div id="song-details">
                            <p class="song-title">-</p>
                            <p class="song-artist">-</p>
                        </div>
                        
                        <div class="control-buttons">
                            <button id="previous-btn" class="btn">⏮️</button>
                            <button id="pause-btn" class="btn">⏸️</button>
                            <button id="play-btn" class="btn">▶️</button>
                            <button id="next-btn" class="btn">⏭️</button>
                        </div>
                        
                        <button id="another-random-btn" class="btn btn-secondary">
                            🎲 Otra Canción Aleatoria
                        </button>
                    </div>
                    
                    <div id="control-status" class="status-message"></div>
                </div>
            </div>
        `;
    },
    
    setupEventListeners() {
        // Register button
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.registerClient());
        }
        
        // Profile creation
        const createProfileBtn = document.getElementById('create-profile-btn');
        if (createProfileBtn) {
            createProfileBtn.addEventListener('click', () => this.createProfile());
        }
        
        // Music controls
        const startMusicBtn = document.getElementById('start-music-btn');
        if (startMusicBtn) {
            startMusicBtn.addEventListener('click', () => this.sendCommand('random'));
        }
        
        ['previous-btn', 'pause-btn', 'play-btn', 'next-btn', 'another-random-btn'].forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    const command = btnId.replace('-btn', '').replace('another-random', 'random');
                    this.sendCommand(command);
                });
            }
        });
    },
    
    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionParam = urlParams.get('session');
        const nameParam = urlParams.get('name');
        
        if (sessionParam) {
            this.sessionId = sessionParam;
            document.getElementById('session-display').textContent = sessionParam;
            
            if (nameParam) {
                document.getElementById('client-name-input').value = decodeURIComponent(nameParam);
            }
            
            this.showView('register');
        } else {
            this.showView('scanner');
        }
    },
    
    showView(viewName) {
        console.log(`[Control] Mostrando vista: ${viewName}`);
        
        // Ocultar todas las vistas
        const views = ['scanner-view', 'register-view', 'profile-setup-view', 'music-control-view'];
        views.forEach(viewId => {
            const element = document.getElementById(viewId);
            if (element) element.classList.add('hidden');
        });
        
        // Mostrar la vista solicitada
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.remove('hidden');
            this.currentView = viewName;
        }
    },
    
    async registerClient() {
        const nameInput = document.getElementById('client-name-input');
        const name = nameInput.value.trim();
        
        if (!name) {
            this.showStatus('register-status', 'Por favor ingresa un nombre para tu dispositivo', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/register-client`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    clientName: name
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.clientId = data.clientId;
                this.clientName = name;
                
                // Verificar si tiene perfil
                const hasProfile = localStorage.getItem(`profile_${this.clientId}`);
                if (hasProfile) {
                    this.userProfile = JSON.parse(hasProfile);
                    this.showView('music-control');
                    this.startHeartbeat();
                } else {
                    this.loadGenres();
                    this.showView('profile-setup');
                }
                
                this.showStatus('register-status', data.message || 'Conectado exitosamente', 'success');
            } else {
                this.showStatus('register-status', data.error || 'Error al conectar', 'error');
            }
        } catch (error) {
            console.error('[Control] Error registering:', error);
            this.showStatus('register-status', 'Error de conexión', 'error');
        }
    },
    
    async loadGenres() {
        try {
            const response = await fetch(`${this.baseUrl}/api/profiler/genres`);
            const data = await response.json();
            
            // Extraer el array de géneros del objeto respuesta
            this.availableGenres = data.genres || [];
            console.log('[Control] Géneros cargados:', this.availableGenres.length);
            this.renderGenres();
        } catch (error) {
            console.error('[Control] Error loading genres:', error);
            this.availableGenres = [];
        }
    },
    
    renderGenres() {
        const container = document.getElementById('genres-list');
        
        if (!this.availableGenres || !Array.isArray(this.availableGenres) || this.availableGenres.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay géneros disponibles</p>';
            return;
        }
        
        container.innerHTML = this.availableGenres.map(genre => `
            <button class="selection-item" data-genre="${genre}" onclick="ControlApp.toggleGenre('${genre}')">
                ${genre}
            </button>
        `).join('');
    },
    
    toggleGenre(genre) {
        const btn = document.querySelector(`[data-genre="${genre}"]`);
        const index = this.selectedGenres.indexOf(genre);
        
        if (index > -1) {
            this.selectedGenres.splice(index, 1);
            btn.classList.remove('selected');
        } else {
            this.selectedGenres.push(genre);
            btn.classList.add('selected');
        }
        
        const createBtn = document.getElementById('create-profile-btn');
        if (this.selectedGenres.length > 0) {
            createBtn.classList.remove('hidden');
        } else {
            createBtn.classList.add('hidden');
        }
    },
    
    async createProfile() {
        if (this.selectedGenres.length === 0) {
            this.showStatus('profile-setup-status', 'Selecciona al menos un género', 'error');
            return;
        }
        
        const songsLimit = document.getElementById('songs-limit').value;
        
        try {
            const response = await fetch(`${this.baseUrl}/api/profiler/create-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: this.clientId,
                    genres: this.selectedGenres,
                    songsLimit: parseInt(songsLimit)
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.userProfile = data.profile;
                localStorage.setItem(`profile_${this.clientId}`, JSON.stringify(this.userProfile));
                
                this.showView('music-control');
                this.startHeartbeat();
                this.showStatus('profile-setup-status', 'Perfil creado exitosamente', 'success');
            } else {
                this.showStatus('profile-setup-status', data.message || 'Error creando perfil', 'error');
            }
        } catch (error) {
            console.error('[Control] Error creating profile:', error);
            this.showStatus('profile-setup-status', 'Error de conexión', 'error');
        }
    },
    
    async sendCommand(command) {
        try {
            const response = await fetch(`${this.baseUrl}/commands`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command: command,
                    clientId: this.clientId,
                    clientName: this.clientName,
                    timestamp: Date.now()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showStatus('control-status', `Comando "${command}" enviado`, 'success');
            } else {
                this.showStatus('control-status', 'Error enviando comando', 'error');
            }
        } catch (error) {
            console.error('[Control] Error sending command:', error);
            this.showStatus('control-status', 'Error de conexión', 'error');
        }
    },
    
    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            try {
                await fetch(`${this.baseUrl}/heartbeat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientId: this.clientId,
                        sessionId: this.sessionId
                    })
                });
            } catch (error) {
                console.error('[Control] Heartbeat failed:', error);
            }
        }, 10000);
    },
    
    disconnect() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.sessionId = null;
        this.clientId = null;
        this.clientName = null;
        this.userProfile = null;
        this.selectedGenres = [];
        
        this.showView('scanner');
        this.showStatus('scanner-status', 'Desconectado', 'info');
    },
    
    showStatus(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = `status-message ${type}`;
        }
    },
    
    destroy() {
        this.disconnect();
    }
};