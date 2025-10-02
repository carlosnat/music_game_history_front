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
        this.render();
        this.setupEventListeners();
        this.checkServerConnectivity();
        this.generateQRCode();
        this.startPolling();
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
    },
    
    async generateQRCode() {
        this.sessionId = `session_${Date.now()}`;
        
        try {
            const response = await fetch(`${this.serverBaseURL}/generate-qr-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    frontPort: window.location.port || 80
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayQR(data.qrUrl, data.mobileUrl);
                document.getElementById('current-session').textContent = this.sessionId.slice(-8);
            }
        } catch (error) {
            console.error('[Monitor] Error generando QR:', error);
            document.getElementById('qr-container').innerHTML = 
                '<p class="error">Error generando código QR</p>';
        }
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
        const authUrl = `${this.serverBaseURL}/auth/spotify`;
        window.location.href = authUrl;
    },
    
    async playRandomSong() {
        try {
            const response = await fetch(`${this.serverBaseURL}/api/random-song`);
            const data = await response.json();
            
            if (data.success) {
                this.updateCurrentSong(data.song);
                this.updateStatus('Reproduciendo canción aleatoria', 'success');
            }
        } catch (error) {
            console.error('[Monitor] Error playing random song:', error);
            this.updateStatus('Error reproduciendo canción', 'error');
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
        status.textContent = message;
        status.className = `status-message ${type}`;
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