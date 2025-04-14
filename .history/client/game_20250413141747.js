const socket = io();
let currentPlayer = null;
let gameBoard = null;
let currentTurn = null;
let gameInProgress = false;

// DOM Elements
const loginContainer = document.getElementById('login-container');
const lobbyContainer = document.getElementById('lobby-container');
const gameContainer = document.getElementById('game-container');
const gameOverContainer = document.getElementById('game-over-container');

const usernameInput = document.getElementById('username');
const loginBtn = document.getElementById('login-btn');
const playerNameSpan = document.getElementById('player-name');
const playerRankSpan = document.getElementById('player-rank');
const playerEloSpan = document.getElementById('player-elo');
const findMatchBtn = document.getElementById('find-match-btn');
const matchStatusDiv = document.getElementById('match-status');

const player1NameSpan = document.getElementById('player1-name');
const player1RankSpan = document.getElementById('player1-rank');
const player2NameSpan = document.getElementById('player2-name');
const player2RankSpan = document.getElementById('player2-rank');
const boardDiv = document.getElementById('board');
const turnIndicatorDiv = document.getElementById('turn-indicator');
const forfeitBtn = document.getElementById('forfeit-btn');

const winnerMessageP = document.getElementById('winner-message');
const rankChangeP = document.getElementById('rank-change');
const backToLobbyBtn = document.getElementById('back-to-lobby-btn');

// Login
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        socket.emit('login', { username });
    }
});

// Matchmaking
findMatchBtn.addEventListener('click', () => {
    socket.emit('find-match');
    findMatchBtn.disabled = true;
    matchStatusDiv.textContent = 'Recherche d\'un adversaire...';
});

// Game
document.querySelectorAll('.column-selector').forEach(column => {
    column.addEventListener('click', (e) => {
        if (gameInProgress && currentTurn === currentPlayer.id) {
            const columnIndex = parseInt(e.target.dataset.column);
            socket.emit('make-move', { column: columnIndex });
        }
    });
});

forfeitBtn.addEventListener('click', () => {
    if (gameInProgress) {
        socket.emit('forfeit');
    }
});

backToLobbyBtn.addEventListener('click', () => {
    gameOverContainer.classList.add('hidden');
    lobbyContainer.classList.remove('hidden');
    findMatchBtn.disabled = false;
    matchStatusDiv.textContent = '';
});

// Render board
function renderBoard() {
    boardDiv.innerHTML = '';
    
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            const value = gameBoard[row][col];
            if (value === 1) {
                cell.classList.add('player1');
            } else if (value === 2) {
                cell.classList.add('player2');
            }
            
            boardDiv.appendChild(cell);
        }
    }
}

// Update turn indicator
function updateTurnIndicator() {
    if (currentTurn === currentPlayer.id) {
        turnIndicatorDiv.textContent = 'Votre tour';
    } else {
        turnIndicatorDiv.textContent = 'Tour de l\'adversaire';
    }
}

// Socket event handlers
socket.on('login-success', (data) => {
    currentPlayer = data.player;
    loginContainer.classList.add('hidden');
    lobbyContainer.classList.remove('hidden');
    
    playerNameSpan.textContent = currentPlayer.username;
    playerRankSpan.textContent = currentPlayer.rank;
    playerEloSpan.textContent = currentPlayer.elo;
});

socket.on('match-found', (data) => {
    lobbyContainer.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    gameInProgress = true;
    gameBoard = data.board;
    currentTurn = data.currentTurn;
    
    // Set player info
    const players = data.players;
    const opponent = players.find(p => p.id !== currentPlayer.id);
    
    if (players[0].id === currentPlayer.id) {
        player1NameSpan.textContent = currentPlayer.username;
        player1RankSpan.textContent = currentPlayer.rank;
        player2NameSpan.textContent = opponent.username;
        player2RankSpan.textContent = opponent.rank;
    } else {
        player1NameSpan.textContent = opponent.username;
        player1RankSpan.textContent = opponent.rank;
        player2NameSpan.textContent = currentPlayer.username;
        player2RankSpan.textContent = currentPlayer.rank;
    }
    
    renderBoard();
    updateTurnIndicator();
});

socket.on('game-update', (data) => {
    gameBoard = data.board;
    currentTurn = data.currentTurn;
    
    renderBoard();
    updateTurnIndicator();
});

socket.on('game-over', (data) => {
    gameInProgress = false;
    gameContainer.classList.add('hidden');
    gameOverContainer.classList.remove('hidden');
    
    // Update player info with new rank/elo
    currentPlayer = data.player;
    playerRankSpan.textContent = currentPlayer.rank;
    playerEloSpan.textContent = currentPlayer.elo;
    
    // Display game result
    if (data.winner) {
        if (data.winner === currentPlayer.id) {
            winnerMessageP.textContent = 'Vous avez gagné !';
        } else {
            winnerMessageP.textContent = 'Vous avez perdu !';
        }
    } else {
        winnerMessageP.textContent = 'Match nul !';
    }
    
    // Display rank change
    if (data.eloChange > 0) {
        rankChangeP.textContent = `+${data.eloChange} points ELO`;
    } else if (data.eloChange < 0) {
        rankChangeP.textContent = `${data.eloChange} points ELO`;
    } else {
        rankChangeP.textContent = 'Aucun changement de points ELO';
    }
});