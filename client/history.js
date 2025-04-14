// history.js - Gestion de l'historique des parties

// Éléments DOM
const historyContainer = document.getElementById('history-container');
const gameReplayContainer = document.getElementById('game-replay-container');
const historyTableBody = document.getElementById('history-table-body');
const historyLoading = document.getElementById('history-loading');
const historyEmpty = document.getElementById('history-empty');

const replayPlayer1Name = document.getElementById('replay-player1-name');
const replayPlayer1Rank = document.getElementById('replay-player1-rank');
const replayPlayer2Name = document.getElementById('replay-player2-name');
const replayPlayer2Rank = document.getElementById('replay-player2-rank');
const replayResult = document.getElementById('replay-result');
const replayBoard = document.getElementById('replay-board');

const viewHistoryBtn = document.getElementById('view-history-btn');
const backToLobbyFromHistoryBtn = document.getElementById('back-to-lobby-from-history');
const backToHistoryBtn = document.getElementById('back-to-history-btn');

// Variables pour stocker l'historique des parties
let gameHistory = [];
let currentReplayGame = null;

// Écouteurs d'événements
viewHistoryBtn.addEventListener('click', () => {
    loadGameHistory();
    lobbyContainer.classList.add('hidden');
    historyContainer.classList.remove('hidden');
});

backToLobbyFromHistoryBtn.addEventListener('click', () => {
    historyContainer.classList.add('hidden');
    lobbyContainer.classList.remove('hidden');
});

backToHistoryBtn.addEventListener('click', () => {
    gameReplayContainer.classList.add('hidden');
    historyContainer.classList.remove('hidden');
});

// Fonction pour charger l'historique des parties
function loadGameHistory() {
    // Afficher le chargement
    historyLoading.classList.remove('hidden');
    historyEmpty.classList.add('hidden');
    historyTableBody.innerHTML = '';
    
    // Demander l'historique au serveur
    socket.emit('get-game-history', { limit: 20 });
}

// Fonction pour afficher l'historique des parties
function displayGameHistory(games) {
    // Cacher le chargement
    historyLoading.classList.add('hidden');
    
    // Sauvegarder l'historique
    gameHistory = games;
    
    // Vérifier si l'historique est vide
    if (games.length === 0) {
        historyEmpty.classList.remove('hidden');
        return;
    }
    
    // Vider le tableau
    historyTableBody.innerHTML = '';
    
    // Ajouter chaque partie à l'historique
    games.forEach(game => {
        const row = document.createElement('tr');
        
        // Date de la partie
        const dateCell = document.createElement('td');
        dateCell.textContent = game.date;
        row.appendChild(dateCell);
        
        // Adversaire
        const opponentCell = document.createElement('td');
        opponentCell.textContent = game.opponent ? game.opponent.username : 'Inconnu';
        row.appendChild(opponentCell);
        
        // Résultat
        const resultCell = document.createElement('td');
        if (game.isDraw) {
            resultCell.textContent = 'Match nul';
            resultCell.className = 'result-draw';
        } else if (game.playerWon) {
            resultCell.textContent = 'Victoire';
            resultCell.className = 'result-win';
        } else {
            resultCell.textContent = 'Défaite';
            resultCell.className = 'result-loss';
        }
        row.appendChild(resultCell);
        
        // Changement d'ELO
        const eloCell = document.createElement('td');
        if (game.playerEloChange > 0) {
            eloCell.textContent = `+${game.playerEloChange}`;
            eloCell.className = 'elo-positive';
        } else if (game.playerEloChange < 0) {
            eloCell.textContent = game.playerEloChange;
            eloCell.className = 'elo-negative';
        } else {
            eloCell.textContent = '0';
        }
        row.appendChild(eloCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        const replayBtn = document.createElement('button');
        replayBtn.textContent = 'Voir';
        replayBtn.className = 'view-replay-btn';
        replayBtn.addEventListener('click', () => showGameReplay(game.id));
        actionsCell.appendChild(replayBtn);
        row.appendChild(actionsCell);
        
        // Ajouter la ligne au tableau
        historyTableBody.appendChild(row);
    });
}

// Fonction pour afficher le replay d'une partie
function showGameReplay(gameId) {
    // Chercher la partie dans l'historique
    const game = gameHistory.find(g => g.id === gameId);
    
    if (!game) {
        alert('Partie introuvable');
        return;
    }
    
    // Stocker la partie courante
    currentReplayGame = game;
    
    // Demander les détails complets de la partie au serveur
    socket.emit('get-game-details', { gameId });
}

// Fonction pour afficher les détails d'une partie
function displayGameDetails(game) {
    // Mettre à jour les informations des joueurs
    let player1, player2;
    
    // Déterminer quel joueur est le joueur courant
    if (game.players[0].id === currentPlayer.id) {
        player1 = game.players[0];
        player2 = game.players[1];
    } else {
        player1 = game.players[1];
        player2 = game.players[0];
    }
    
    replayPlayer1Name.textContent = player1.username;
    replayPlayer1Rank.textContent = ""; // On n'a pas le rang dans l'historique
    replayPlayer2Name.textContent = player2.username;
    replayPlayer2Rank.textContent = ""; // On n'a pas le rang dans l'historique
    
    // Afficher le résultat
    if (game.isDraw) {
        replayResult.textContent = 'Match nul';
        replayResult.className = 'draw';
    } else if (game.winner === currentPlayer.id) {
        replayResult.textContent = 'Victoire';
        replayResult.className = 'win';
    } else {
        replayResult.textContent = 'Défaite';
        replayResult.className = 'loss';
    }
    
    // Afficher le plateau
    displayReplayBoard(game.finalBoard);
    
    // Afficher le conteneur de replay
    historyContainer.classList.add('hidden');
    gameReplayContainer.classList.remove('hidden');
}

// Fonction pour afficher le plateau final
function displayReplayBoard(board) {
    // Vider le plateau
    replayBoard.innerHTML = '';
    
    // Créer les cellules du plateau
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            const value = board[row][col];
            if (value === 1) {
                cell.classList.add('player1');
            } else if (value === 2) {
                cell.classList.add('player2');
            }
            
            replayBoard.appendChild(cell);
        }
    }
}

// Écouteurs pour les réponses du serveur
socket.on('game-history', (data) => {
    displayGameHistory(data.games);
});

socket.on('game-history-error', (data) => {
    historyLoading.classList.add('hidden');
    alert(`Erreur: ${data.message}`);
});

socket.on('game-details', (data) => {
    displayGameDetails(data.game);
});

socket.on('game-details-error', (data) => {
    alert(`Erreur: ${data.message}`);
});
