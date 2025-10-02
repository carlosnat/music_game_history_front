
console.log('🎵 Reproductor Musical Aleatorio - Listo');

// Configuración Spotify
const CLIENT_ID = 'e074f26de1da44d7a8da4c2c7ab9af4e'; // <--- Client ID de carlos-test-app
const REDIRECT_URI = window.location.origin + window.location.pathname;
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'code';
const SCOPES = [
	'streaming',
	'user-read-email',
	'user-read-private',
	'user-modify-playback-state',
	'user-read-playback-state'
].join(' ');

function getTokenFromUrl() {
	const hash = window.location.hash.substring(1);
	const params = new URLSearchParams(hash);
	return params.get('access_token');
}

// Función para redirigir automáticamente a Spotify cuando sea necesario
function initiateSpotifyAuth() {
	const url = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`;
	console.log('[Auth] Redirigiendo a Spotify para autenticación...');
	window.location = url;
}

// Hacer disponible globalmente
window.initiateSpotifyAuth = initiateSpotifyAuth;



// Al volver del login con OAuth code
function getCodeFromUrl() {
	const params = new URLSearchParams(window.location.search);
	return params.get('code');
}

const code = getCodeFromUrl();
if (code) {
	console.log('[OAuth] Código recibido en URL:', code);
	console.log('[OAuth] Solicitando token al backend...');
	
	// Usar la URL dinámica del servidor en lugar de localhost hardcodeado
	const serverURL = window.serverBaseURL || 'https://mysupermusicappgame.azurewebsites.net';
	console.log('[OAuth] Usando servidor:', serverURL);
	
	// Incluir el redirect_uri que se usó originalmente para obtener el code
	const redirect_uri = REDIRECT_URI;
	console.log('[OAuth] Enviando redirect_uri:', redirect_uri);
	
	fetch(`${serverURL}/auth/spotify`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ code, redirect_uri })
	})
		.then(res => {
			console.log('[OAuth] Respuesta cruda del backend:', res);
			return res.json();
		})
		.then(data => {
			console.log('[OAuth] Respuesta JSON del backend:', data);
			if (data.access_token) {
				console.log('[OAuth] ✅ Token recibido y autenticado con Spotify!');
				window.localStorage.setItem('spotify_token', data.access_token);
				// Opcional: limpiar el code de la URL
				window.history.replaceState({}, document.title, window.location.pathname);
				console.log('[OAuth] Token guardado en localStorage:', data.access_token);
				
				// Inicializar SDK inmediatamente si está disponible
				if (window.initializeSpotifySDK) {
					console.log('[OAuth] Inicializando SDK con el nuevo token...');
					window.initializeSpotifySDK();
				} else {
					console.log('[OAuth] initializeSpotifySDK no disponible aún, se inicializará automáticamente');
				}
			} else {
				console.error('[OAuth] Error al obtener token:', data.error || '');
			}
		})
		.catch(err => {
			console.error('[OAuth] Error de red o fetch:', err);
		});
} else {
	// Verificar si ya tenemos token
	const existingToken = window.localStorage.getItem('spotify_token');
	if (!existingToken) {
		console.log('[Auth] No hay token. Se requerirá autenticación al intentar reproducir música.');
	} else {
		console.log('[Auth] ✅ Token existente encontrado.');
		// Si ya hay token, intentar inicializar el SDK cuando esté listo
		if (window.initializeSpotifySDK) {
			console.log('[Auth] Inicializando SDK con token existente...');
			window.initializeSpotifySDK();
		}
	}
}
