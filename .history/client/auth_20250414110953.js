// Créer la connexion socket.io
const socket = io();

// Éléments DOM pour l'authentification
const loginContainer = document.getElementById('login-container');
const lobbyContainer = document.getElementById('lobby-container');
const gameContainer = document.getElementById('game-container');
const gameOverContainer = document.getElementById('game-over-container');

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginErrorDiv = document.getElementById('login-error');

const registerUsernameInput = document.getElementById('register-username');
const registerPasswordInput = document.getElementById('register-password');
const registerConfirmInput = document.getElementById('register-confirm-password');
const registerBtn = document.getElementById('register-btn');
const registerErrorDiv = document.getElementById('register-error');

const playerNameSpan = document.getElementById('player-name');
const playerRankSpan = document.getElementById('player-rank');
const playerEloSpan = document.getElementById('player-elo');

const logoutBtn = document.getElementById('logout-btn');


// Variables globales
let currentPlayer = null;

// Système d'onglets
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        // Désactiver tous les onglets
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        
        // Activer l'onglet cliqué
        btn.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        // Réinitialiser les messages d'erreur
        loginErrorDiv.textContent = '';
        registerErrorDiv.textContent = '';
    });
});

// Gestion de l'inscription
registerBtn.addEventListener('click', () => {
    const username = registerUsernameInput.value.trim();
    const password = registerPasswordInput.value;
    const confirmPassword = registerConfirmInput.value;
    
    // Validation côté client
    if (!username) {
        registerErrorDiv.textContent = "Le nom d'utilisateur est requis";
        return;
    }
    
    if (!password) {
        registerErrorDiv.textContent = "Le mot de passe est requis";
        return;
    }
    
    if (password !== confirmPassword) {
        registerErrorDiv.textContent = "Les mots de passe ne correspondent pas";
        return;
    }
    
    // Envoyer la demande d'inscription au serveur
    socket.emit('register', { username, password });
});

// Gestion de la connexion
loginBtn.addEventListener('click', () => {
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;
    
    // Validation côté client
    if (!username || !password) {
        loginErrorDiv.textContent = "Le nom d'utilisateur et le mot de passe sont requis";
        return;
    }
    
    // Envoyer la demande de connexion au serveur
    socket.emit('login', { username, password });
});

// Écouteurs d'événements pour les réponses du serveur
socket.on('register-success', (data) => {
    currentPlayer = data.player;
    loginContainer.classList.add('hidden');
    lobbyContainer.classList.remove('hidden');
    
    playerNameSpan.textContent = currentPlayer.username;
    playerRankSpan.textContent = currentPlayer.rank;
    playerEloSpan.textContent = currentPlayer.elo;
});

socket.on('register-error', (data) => {
    registerErrorDiv.textContent = data.message;
});

socket.on('login-success', (data) => {
    currentPlayer = data.player;
    loginContainer.classList.add('hidden');
    lobbyContainer.classList.remove('hidden');
    
    playerNameSpan.textContent = currentPlayer.username;
    playerRankSpan.textContent = currentPlayer.rank;
    playerEloSpan.textContent = currentPlayer.elo;
});

socket.on('login-error', (data) => {
    loginErrorDiv.textContent = data.message;
});
logoutBtn.addEventListener('click', () => {
    // Réinitialiser les variables de session
    currentPlayer = null;
    
    // Émettre un événement de déconnexion au serveur
    socket.emit('logout');
    
    // Masquer le lobby et afficher l'écran de connexion
    lobbyContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    
    // Réinitialiser les champs de formulaire
    loginUsernameInput.value = '';
    loginPasswordInput.value = '';
    registerUsernameInput.value = '';
    registerPasswordInput.value = '';
    registerConfirmInput.value = '';
    
    // Réinitialiser les messages d'erreur
    loginErrorDiv.textContent = '';
    registerErrorDiv.textContent = '';
    
    // Afficher l'onglet de connexion
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(t => t.classList.remove('active'));
    document.querySelector('.tab-btn[data-tab="login"]').classList.add('active');
    document.getElementById('login-tab').classList.add('active');
});