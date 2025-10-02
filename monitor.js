// ===== COMPONENTE MONITOR =====
window.MonitorApp = {
    serverBaseURL: window.AppConfig?.SERVER_URL || 'https://mysupermusicappgame.azurewebsites.net',
    sessionId: null,
    pollingInterval: null,
    clientsPollingInterval: null,
    connectivityInterval: null,
    currentSongInfo: null,
    
    init() {
        console.log('[Monitor] Inicializando monitor...');
        
        // Primero renderizar la interfaz
        this.render();
        this.setupEventListeners();
        
        // Luego verificar token y otros procesos que necesitan el DOM
        const params = new URLSearchParams(window.location.search);
        if (!params.get('code')) {
            this.checkExistingToken();
        }
        
        this.checkServerConnectivity();
        this.loadStats();
        this.generateQRCode();
        this.startPolling();
    },
    
    // Verificar si ya tenemos un token de Spotify
    checkExistingToken() {
        const existingToken = window.localStorage.getItem('spotify_token');
        if (existingToken) {
            console.log('[Auth] ✅ Token existente encontrado.');
            this.updateStatus('Spotify ya conectado', 'success');
        } else {
            this.updateStatus('Conecta tu cuenta de Spotify para comenzar', 'info');
        }
    },
    
    render() {
        const container = document.getElementById('monitor-view');
        container.innerHTML = `
            <div class="monitor-container">
                <!-- Header -->
                <div class="monitor-header">
                    <h1>🎵 Monitor de Música</h1>
                    <div class="connection-status">
                        <span id="connection-status" class="status-indicator">🔴 Desconectado</span>
                    </div>
                </div>
                
                <!-- Stats -->
                <div class="monitor-stats">
                    <div class="stat-card">
                        <div class="stat-number" id="total-songs">-</div>
                        <div class="stat-label">Canciones Total</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="connected-clients">0</div>
                        <div class="stat-label">Clientes Conectados</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="current-session">-</div>
                        <div class="stat-label">Sesión Actual</div>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                    <!-- Player Section -->
                    <div class="card">
                        <h2>🎵 Reproductor</h2>
                        
                        <!-- Current Song -->
                        <div id="current-song-display" class="current-song-display">
                            <div class="song-info">
                                <h3 id="song-title">No hay canción seleccionada</h3>
                                <p id="song-artist">-</p>
                                <p id="song-details">-</p>
                            </div>
                        </div>
                        
                        <!-- Controls -->
                        <div class="player-controls">
                            <button id="auth-btn" class="btn btn-secondary">🔐 Conectar Spotify</button>
                            <button id="play-random-btn" class="btn" disabled>🎲 Canción Aleatoria</button>
                            <button id="play-btn" class="btn" disabled>▶️ Reproducir</button>
                            <button id="pause-btn" class="btn" disabled>⏸️ Pausar</button>
                            <button id="next-btn" class="btn" disabled>⏭️ Siguiente</button>
                        </div>
                        
                        <!-- Status -->
                        <div id="player-status" class="status-message info">
                            Conecta tu cuenta de Spotify para comenzar
                        </div>
                    </div>
                    
                    <!-- Sidebar -->
                    <div class="card">
                        <h2>📱 Código QR</h2>
                        <div id="qr-container" class="qr-container">
                            <div class="qr-placeholder">Generando QR...</div>
                        </div>
                        
                        <h3 class="mt-3">👥 Clientes Conectados</h3>
                        <div id="clients-list" class="clients-list">
                            <p class="text-muted">No hay clientes conectados</p>
                        </div>
                        
                        <h3 class="mt-3">📊 Comandos</h3>
                        <div id="last-command" class="command-display">
                            <p class="text-muted">Sin comandos recientes</p>
                        </div>
                        
                        <h3 class="mt-3">🔧 Acciones</h3>
                        <div class="action-buttons">
                            <button id="refresh-data-btn" class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem;">
                                🔄 Recargar Datos
                            </button>
                            <button id="test-connection-btn" class="btn btn-secondary" style="width: 100%;">
                                🌐 Probar Conexión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    setupEventListeners() {
        // Botón de autenticación
        document.getElementById('auth-btn').addEventListener('click', () => {
            this.initiateSpotifyAuth();
        });
        
        // Controles del reproductor
        document.getElementById('play-random-btn').addEventListener('click', () => {
            this.playRandomSong();
        });
        
        document.getElementById('play-btn').addEventListener('click', () => {
            this.playMusic();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseMusic();
        });
        
        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextTrack();
        });
        
        // Botones de acción
        document.getElementById('refresh-data-btn').addEventListener('click', () => {
            this.refreshAllData();
        });
        
        document.getElementById('test-connection-btn').addEventListener('click', () => {
            this.testConnection();
        });
    },
    
    async loadStats() {
        try {
            // Intentar cargar estadísticas básicas
            await this.loadSongsCount();
            
            // Actualizar sesión actual
            if (this.sessionId) {
                document.getElementById('current-session').textContent = this.sessionId.slice(-8);
            }
        } catch (error) {
            console.log('[Monitor] Error loading stats:', error.message);
        }
    },
    
    async loadSongsCount() {
        try {
            // Intentar varios endpoints para obtener conteo de canciones
            const endpoints = [
                '/api/songs/count',
                '/songs/stats', // Estadísticas de canciones
                '/api/songs/stats', // Estadísticas alternativas
                '/songs/count',
                '/api/profiler/genres' // Endpoint correcto para géneros
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`${this.serverBaseURL}${endpoint}`);
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Manejar diferentes formatos de respuesta
                        if (data.totalSongs || data.total || data.count) {
                            const count = data.totalSongs || data.total || data.count;
                            document.getElementById('total-songs').textContent = count.toLocaleString();
                            return;
                        } else if (Array.isArray(data)) {
                            // Si es un array (como géneros), mostrar la cantidad
                            document.getElementById('total-songs').textContent = `${data.length} géneros`;
                            return;
                        }
                    }
                } catch (e) {
                    // Continúar con el siguiente endpoint
                    continue;
                }
            }
            
            // Si no se encuentra información, mostrar estado
            document.getElementById('total-songs').textContent = 'N/D';
            
        } catch (error) {
            console.log('[Monitor] No se pudo cargar conteo de canciones');
            document.getElementById('total-songs').textContent = '?';
        }
    },
    
    async generateQRCode() {
        this.sessionId = `session_${Date.now()}`;
        
        try {
            const response = await fetch(`${this.serverBaseURL}/generate-qr-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    frontPort: window.location.port || (window.location.protocol === 'https:' ? 443 : 80)
                })
            });
            
            if (!response.ok) {
                throw new Error(`QR generation failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Manejar la respuesta real del servidor
            if (data.mobileURL) {
                this.displayQRFromURL(data.mobileURL);
                document.getElementById('current-session').textContent = this.sessionId.slice(-8);
                console.log('[Monitor] QR URL generated:', data.mobileURL);
            } else {
                throw new Error('No mobile URL returned from server');
            }
        } catch (error) {
            console.warn('[Monitor] Error generando QR:', error.message);
            this.displayQRError();
        }
    },
    
    displayQRFromURL(mobileURL) {
        // Generar QR usando una librería online o mostrar URL directamente
        const container = document.getElementById('qr-container');
        
        // Usar una API pública para generar QR
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mobileURL)}`;
        
        container.innerHTML = `
            <div class="qr-code">
                <img src="${qrApiUrl}" alt="Código QR" style="width: 200px; height: 200px;" 
                     onerror="this.parentElement.innerHTML='<p>⚠️ Error cargando QR</p><p><a href=\\'${mobileURL}\\' target=\\'_blank\\'>${mobileURL}</a></p>'">
                <p class="text-center mt-2">Escanea para control móvil</p>
                <small class="text-muted">${mobileURL}</small>
            </div>
        `;
    },
    
    displayQRError() {
        const container = document.getElementById('qr-container');
        container.innerHTML = `
            <div class="qr-error">
                <p>⚠️ No se pudo generar el código QR</p>
                <p>Acceso directo al control:</p>
                <a href="/control?session=${this.sessionId}" target="_blank" class="btn btn-secondary">
                    📱 Abrir Control Móvil
                </a>
                <small class="text-muted">ID de sesión: ${this.sessionId.slice(-8)}</small>
            </div>
        `;
        
        // Actualizar sesión actual de todas formas
        document.getElementById('current-session').textContent = this.sessionId.slice(-8);
    },
    
    displayQR(qrUrl, mobileUrl) {
        const container = document.getElementById('qr-container');
        container.innerHTML = `
            <div class="qr-code">
                <img src="${qrUrl}" alt="Código QR" style="width: 200px; height: 200px;">
                <p class="text-center mt-2">Escanea para control móvil</p>
                <small class="text-muted">${mobileUrl}</small>
            </div>
        `;
    },
    
    startPolling() {
        // Verificar disponibilidad de endpoints primero
        this.checkEndpointAvailability();
        
        // Verificación de conectividad periódica
        this.connectivityInterval = setInterval(() => {
            this.checkServerConnectivity();
        }, window.AppConfig?.POLLING?.CONNECTIVITY || 30000);
        
        // Polling de comandos
        this.pollingInterval = setInterval(() => {
            this.checkForCommands();
        }, window.AppConfig?.POLLING?.COMMANDS || 5000);
        
        // Polling de clientes
        this.clientsPollingInterval = setInterval(() => {
            this.updateClientsList();
        }, window.AppConfig?.POLLING?.CLIENTS || 10000);
    },
    
    async checkEndpointAvailability() {
        try {
            // Verificar endpoint /clients
            const clientsResponse = await fetch(`${this.serverBaseURL}/clients`);
            if (!clientsResponse.ok) {
                console.warn('[Monitor] /clients endpoint not available, disabling client polling');
                if (this.clientsPollingInterval) {
                    clearInterval(this.clientsPollingInterval);
                    this.clientsPollingInterval = null;
                }
                this.handleClientsError(clientsResponse.status);
            }
        } catch (error) {
            console.warn('[Monitor] Server connectivity check failed:', error.message);
        }
    },
    
    async checkForCommands() {
        try {
            const response = await fetch(`${this.serverBaseURL}/commands`);
            
            if (!response.ok) {
                // Silencioso para commands ya que puede ser normal no tener comandos
                return;
            }
            
            const command = await response.json();
            
            if (command && command.command) {
                this.handleCommand(command);
                this.updateCommandDisplay(command);
            }
        } catch (error) {
            // Logging más silencioso para commands
            console.debug('[Monitor] Commands endpoint not available:', error.message);
        }
    },
    
    async updateClientsList() {
        try {
            const response = await fetch(`${this.serverBaseURL}/clients`);
            
            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                console.warn(`[Monitor] Server returned ${response.status} for /clients`);
                this.handleClientsError(response.status);
                return;
            }
            
            const data = await response.json();
            
            // Validar que data sea un array
            const clients = Array.isArray(data) ? data : (data.clients && Array.isArray(data.clients) ? data.clients : []);
            
            const clientsList = document.getElementById('clients-list');
            const connectedCount = document.getElementById('connected-clients');
            
            if (!clientsList || !connectedCount) {
                console.warn('[Monitor] Client list elements not found');
                return;
            }
            
            if (clients.length === 0) {
                clientsList.innerHTML = '<p class="text-muted">No hay clientes conectados</p>';
                connectedCount.textContent = '0';
            } else {
                clientsList.innerHTML = clients.map(client => `
                    <div class="client-item">
                        <strong>${client.name || 'Cliente sin nombre'}</strong>
                        <small>${(client.id || 'unknown').toString().slice(-8)}</small>
                    </div>
                `).join('');
                connectedCount.textContent = clients.length;
            }
        } catch (error) {
            console.error('[Monitor] Error updating clients:', error);
            this.handleClientsError('network');
        }
    },
    
    handleClientsError(errorType) {
        const clientsList = document.getElementById('clients-list');
        const connectedCount = document.getElementById('connected-clients');
        
        if (clientsList) {
            if (errorType === 400) {
                clientsList.innerHTML = '<p class="text-muted error">⚠️ Endpoint /clients no disponible</p>';
            } else if (errorType === 'network') {
                clientsList.innerHTML = '<p class="text-muted error">🔌 Error de conexión</p>';
            } else {
                clientsList.innerHTML = '<p class="text-muted error">❌ Error cargando clientes</p>';
            }
        }
        
        if (connectedCount) {
            connectedCount.textContent = '-';
        }
    },
    
    handleCommand(command) {
        console.log('[Monitor] Handling command:', command);
        
        switch (command.command) {
            case 'play':
                this.playMusic();
                break;
            case 'pause':
                this.pauseMusic();
                break;
            case 'next':
                this.nextTrack();
                break;
            case 'random':
                this.playRandomSong();
                break;
        }
    },
    
    updateCommandDisplay(command) {
        const display = document.getElementById('last-command');
        display.innerHTML = `
            <div class="command-item">
                <strong>${command.command}</strong>
                <small>de ${command.clientName || 'Cliente'}</small>
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
            </div>
        `;
    },
    
    // Métodos de Spotify (simplificados)
    initiateSpotifyAuth() {
        // Usar el flujo OAuth correcto como en app.js
        const CLIENT_ID = 'e074f26de1da44d7a8da4c2c7ab9af4e';
        // Corregir REDIRECT_URI para que apunte a la ruta correcta del SPA
        const REDIRECT_URI = window.location.origin + '/fronts/';
        const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
        const RESPONSE_TYPE = 'code';
        const SCOPES = [
            'streaming',
            'user-read-email',
            'user-read-private',
            'user-modify-playback-state',
            'user-read-playback-state'
        ].join(' ');
        
        const url = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`;
        console.log('[Auth] Redirigiendo a Spotify para autenticación...');
        console.log('[Auth] REDIRECT_URI:', REDIRECT_URI);
        window.location.href = url;
    },
    
    async playRandomSong() {
        this.updateStatus('Buscando canción aleatoria...', 'info');
        
        try {
            // Usar el endpoint correcto del servidor
            const response = await fetch(`${this.serverBaseURL}/songs/random/1`);
            
            if (response.ok) {
                const data = await response.json();
                
                // El servidor devuelve un array con las canciones
                if (Array.isArray(data) && data.length > 0) {
                    const randomSong = data[0]; // Tomar la primera canción
                    this.updateCurrentSong(randomSong);
                    this.updateStatus('Reproduciendo canción aleatoria', 'success');
                    return;
                } else {
                    this.updateStatus('No se encontraron canciones disponibles', 'warning');
                }
            } else {
                this.updateStatus('Error del servidor al obtener canción aleatoria', 'error');
            }
            
        } catch (error) {
            console.error('[Monitor] Error playing random song:', error);
            this.updateStatus('Error obteniendo canción aleatoria', 'error');
        }
    },
    
    async playMusic() {
        this.updateStatus('Reproduciendo...', 'success');
    },
    
    async pauseMusic() {
        this.updateStatus('Pausado', 'info');
    },
    
    async nextTrack() {
        this.updateStatus('Siguiente canción...', 'info');
    },
    
    updateCurrentSong(song) {
        if (song) {
            document.getElementById('song-title').textContent = song.title || 'Sin título';
            document.getElementById('song-artist').textContent = song.artist || 'Sin artista';
            document.getElementById('song-details').textContent = 
                `${song.genre || 'Sin género'} • ${song.year || 'Sin año'}`;
            this.currentSongInfo = song;
        }
    },
    
    updateStatus(message, type = 'info') {
        const status = document.getElementById('player-status');
        if (status) {
            status.textContent = message;
            status.className = `status-message ${type}`;
        } else {
            console.warn('[Monitor] updateStatus: elemento player-status no encontrado');
        }
    },
    
    async checkServerConnectivity() {
        const statusElement = document.getElementById('connection-status');
        
        try {
            // Probar conectividad básica al servidor
            const response = await fetch(`${this.serverBaseURL}/`, { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            if (response.ok || response.status === 404) {
                // 404 es OK, significa que el servidor responde pero la ruta no existe
                statusElement.textContent = '🟢 Conectado';
                statusElement.className = 'status-indicator success';
                console.log('[Monitor] Servidor conectado');
            } else {
                throw new Error(`Server responded with ${response.status}`);
            }
        } catch (error) {
            console.warn('[Monitor] Error de conectividad:', error.message);
            statusElement.textContent = '🔴 Sin conexión';
            statusElement.className = 'status-indicator error';
            
            // Mostrar mensaje al usuario
            this.updateStatus('No se puede conectar al servidor. Algunas funciones pueden no estar disponibles.', 'warning');
        }
    },
    
    async refreshAllData() {
        this.updateStatus('Refrescando datos...', 'info');
        
        try {
            await this.loadStats();
            await this.updateClientsList();
            await this.checkForCommands();
            
            this.updateStatus('Datos actualizados', 'success');
        } catch (error) {
            console.error('[Monitor] Error refreshing data:', error);
            this.updateStatus('Error refrescando datos', 'error');
        }
    },
    
    async testConnection() {
        const testBtn = document.getElementById('test-connection-btn');
        const originalText = testBtn.textContent;
        
        testBtn.textContent = '🔄 Probando...';
        testBtn.disabled = true;
        
        try {
            await this.checkServerConnectivity();
            
            // Probar algunos endpoints comunes
            const endpoints = ['/api/profiler/genres', '/api/songs', '/network-info', '/commands'];
            const results = [];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`${this.serverBaseURL}${endpoint}`, { 
                        method: 'HEAD',
                        cache: 'no-cache'
                    });
                    
                    results.push(`${endpoint}: ${response.ok ? '✅' : '❌'} (${response.status})`);
                } catch (error) {
                    results.push(`${endpoint}: ❌ Error`);
                }
            }
            
            // Mostrar resultados en el comando display
            const commandDisplay = document.getElementById('last-command');
            commandDisplay.innerHTML = `
                <div class="test-results">
                    <strong>🔧 Prueba de Conectividad</strong>
                    <div style="font-size: 0.8rem; margin-top: 0.5rem;">
                        ${results.map(result => `<div>${result}</div>`).join('')}
                    </div>
                    <small>Ejecutado: ${new Date().toLocaleTimeString()}</small>
                </div>
            `;
            
            this.updateStatus('Prueba de conexión completada', 'info');
            
        } catch (error) {
            console.error('[Monitor] Error testing connection:', error);
            this.updateStatus('Error probando conexión', 'error');
        } finally {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
        }
    },
    
    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        if (this.clientsPollingInterval) {
            clearInterval(this.clientsPollingInterval);
        }
        if (this.connectivityInterval) {
            clearInterval(this.connectivityInterval);
        }
    }
};