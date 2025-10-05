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
                
                <!-- Song Info Display View -->
                <div id="song-info-view" class="control-card hidden">
                    <button class="btn btn-secondary mb-2" onclick="ControlApp.disconnect()">🔌 Desconectar</button>
                    
                    <div id="client-info" class="info-card">
                        <h3>🎵 ¿Qué Canción es Esta?</h3>
                        <div id="connection-status"></div>
                    </div>
                    
                    <div id="current-song-display" class="song-display-card">
                        <div id="song-status" class="song-status">
                            <div class="waiting-message">
                                <div class="music-icon">🎶</div>
                                <h3>Esperando música...</h3>
                                <p>El reproductor está preparando la siguiente canción</p>
                            </div>
                        </div>
                        
                        <div id="song-info-content" class="song-info-content hidden">
                            <div class="album-cover">
                                <img id="song-image" src="" alt="Album Cover" style="display: none;">
                                <div id="default-cover" class="default-album-cover">🎵</div>
                            </div>
                            
                            <div class="song-details">
                                <h2 id="song-title">Título de la Canción</h2>
                                <h3 id="song-artist">Artista</h3>
                                <p id="song-album">Álbum</p>
                                <div class="song-meta">
                                    <span id="song-year" class="meta-item"></span>
                                    <span id="song-genre" class="meta-item"></span>
                                </div>
                            </div>
                            
                            <div class="guess-section">
                                <h4>¿Conoces esta canción?</h4>
                                <div class="guess-buttons">
                                    <button class="guess-btn easy" onclick="ControlApp.makeGuess('easy')">😊 Fácil</button>
                                    <button class="guess-btn medium" onclick="ControlApp.makeGuess('medium')">🤔 Regular</button>
                                    <button class="guess-btn hard" onclick="ControlApp.makeGuess('hard')">😵 Difícil</button>
                                    <button class="guess-btn unknown" onclick="ControlApp.makeGuess('unknown')">❓ No la conozco</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="client-info" class="info-card">
                        <h4>Dispositivo Conectado</h4>
                        <p id="client-info-text">Conectando...</p>
                    </div>
                    
                    <div class="control-icon">🎵</div>
                    <h2>Control de Música</h2>
                    <p>¡Descubre música increíble de forma aleatoria!</p>
                    
                    <div id="game-stats" class="stats-section">
                        <h4>📊 Tu Puntuación</h4>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-number" id="correct-guesses">0</span>
                                <span class="stat-label">Aciertos</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number" id="total-songs">0</span>
                                <span class="stat-label">Canciones</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number" id="accuracy">0%</span>
                                <span class="stat-label">Precisión</span>
                            </div>
                        </div>
                    </div>
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
        const views = ['scanner-view', 'register-view', 'profile-setup-view', 'song-info-view'];
        views.forEach(viewId => {
            const element = document.getElementById(viewId);
            if (element) element.classList.add('hidden');
        });
        
        // Mostrar la vista solicitada
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.remove('hidden');
            this.currentView = viewName;
            
            // Si es la vista de control, actualizar la info del cliente
            if (viewName === 'music-control' && this.clientName) {
                // Usar setTimeout para asegurar que el DOM esté listo
                setTimeout(() => this.updateClientInfo(), 100);
            }
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
            const response = await fetch(`${this.baseUrl}/register`, {
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
                    this.showView('song-info');
                    this.updateClientInfo();
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
            const response = await fetch(`${this.baseUrl}/api/profiler/profiles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: this.clientName,
                    favorite_genres: this.selectedGenres,
                    favorite_decades: [], // Array vacío por ahora, se puede agregar funcionalidad después
                    songsLimit: parseInt(songsLimit)
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.userProfile = data.profile;
                localStorage.setItem(`profile_${this.clientId}`, JSON.stringify(this.userProfile));
                
                this.showView('song-info');
                this.updateClientInfo();
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
    
    // Función para hacer una respuesta/adivinanza
    async makeGuess(difficulty) {
        try {
            console.log(`[Control] Enviando respuesta: ${difficulty}`);
            
            const response = await fetch(`${this.baseUrl}/guess`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    clientId: this.clientId,
                    clientName: this.clientName,
                    difficulty: difficulty,
                    songId: this.currentSongInfo?.id,
                    timestamp: Date.now()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateStats(difficulty);
                this.showGuessResult(difficulty);
            } else {
                console.error('[Control] Error al enviar respuesta:', data);
            }
        } catch (error) {
            console.error('[Control] Error al enviar respuesta:', error);
        }
    },
    
    // Actualizar estadísticas locales
    updateStats(difficulty) {
        let stats = JSON.parse(localStorage.getItem(`game_stats_${this.clientId}`) || '{"correct": 0, "total": 0}');
        
        stats.total++;
        if (difficulty !== 'unknown') {
            stats.correct++;
        }
        
        localStorage.setItem(`game_stats_${this.clientId}`, JSON.stringify(stats));
        this.renderStats(stats);
    },
    
    // Mostrar estadísticas en la UI
    renderStats(stats) {
        document.getElementById('correct-guesses').textContent = stats.correct;
        document.getElementById('total-songs').textContent = stats.total;
        document.getElementById('accuracy').textContent = stats.total > 0 ? 
            Math.round((stats.correct / stats.total) * 100) + '%' : '0%';
    },
    
    // Mostrar resultado de la adivinanza
    showGuessResult(difficulty) {
        const messages = {
            'easy': '😊 ¡Fácil! +3 puntos',
            'medium': '🤔 ¡Bien! +2 puntos', 
            'hard': '😵 ¡Impresionante! +5 puntos',
            'unknown': '❓ No pasa nada, ¡a seguir aprendiendo!'
        };
        
        // Mostrar mensaje temporal
        const guessSection = document.querySelector('.guess-section');
        if (guessSection) {
            const originalHTML = guessSection.innerHTML;
            guessSection.innerHTML = `<div class="guess-result">${messages[difficulty]}</div>`;
            
            setTimeout(() => {
                guessSection.innerHTML = originalHTML;
            }, 2000);
        }
    },
    
    // Polling para recibir información de canciones desde el monitor
    async pollForSongInfo() {
        if (!this.sessionId || !this.clientId) return;
        
        try {
            const response = await fetch(`${this.baseUrl}/current-song/${this.sessionId}`);
            const data = await response.json();
            
            if (data.success && data.song) {
                this.displaySongInfo(data.song);
            } else {
                this.showWaitingState();
            }
        } catch (error) {
            console.error('[Control] Error obteniendo info de canción:', error);
        }
    },
    
    // Mostrar información de la canción actual
    displaySongInfo(songInfo) {
        this.currentSongInfo = songInfo;
        
        // Mostrar contenido de la canción
        document.getElementById('song-info-content').classList.remove('hidden');
        document.querySelector('.waiting-message').style.display = 'none';
        
        // Llenar información
        document.getElementById('song-title').textContent = songInfo.title || 'Título desconocido';
        document.getElementById('song-artist').textContent = songInfo.artist || 'Artista desconocido';
        document.getElementById('song-album').textContent = songInfo.album || 'Álbum desconocido';
        document.getElementById('song-year').textContent = songInfo.year || '';
        document.getElementById('song-genre').textContent = songInfo.genre || '';
        
        // Manejar imagen del álbum
        const songImage = document.getElementById('song-image');
        const defaultCover = document.getElementById('default-cover');
        
        if (songInfo.image) {
            songImage.src = songInfo.image;
            songImage.style.display = 'block';
            defaultCover.style.display = 'none';
        } else {
            songImage.style.display = 'none';
            defaultCover.style.display = 'flex';
        }
    },
    
    // Mostrar estado de espera
    showWaitingState() {
        document.getElementById('song-info-content').classList.add('hidden');
        document.querySelector('.waiting-message').style.display = 'block';
    },
    
    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            try {
                // Además del heartbeat, también hacer polling de canciones
                this.pollForSongInfo();
                
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
        }, 3000); // Más frecuente para actualizar canciones
        
        // Cargar estadísticas iniciales
        const stats = JSON.parse(localStorage.getItem(`game_stats_${this.clientId}`) || '{"correct": 0, "total": 0}');
        this.renderStats(stats);
    },
    
    updateClientInfo() {
        const clientInfoText = document.getElementById('client-info-text');
        if (clientInfoText && this.clientName) {
            clientInfoText.textContent = `Conectado como: ${this.clientName}`;
        }
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