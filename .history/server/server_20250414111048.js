const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const Database = require('./database');
const Game = require('./game');
const Matchmaking = require('./matchmaking');
const RankSystem = require('./rankSystem');

// Initialize services
const db = new Database();
const rankSystem = new RankSystem();
const matchmaking = new Matchmaking(db, rankSystem);

// Create Express app, HTTP server and Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Nouvelle connexion: ${socket.id}`);
    
    // Handle register
    socket.on('register', async (data) => {
        const { username, password } = data;
        console.log(`Tentative d'inscription pour: ${username}`);
        
        try {
            // Enregistrer l'utilisateur dans la base de données
            const result = await db.registerUser(username, password);
            
            if (result.success) {
                // Stocker les informations du joueur dans la session socket
                socket.player = result.player;
                
                // Envoyer la réponse de succès
                socket.emit('register-success', { player: result.player });
                console.log(`Inscription réussie pour ${result.player.username}`);
            } else {
                // Envoyer l'erreur
                socket.emit('register-error', { message: result.message });
                console.log(`Échec de l'inscription pour ${username}: ${result.message}`);
            }
        } catch (error) {
            console.error(`Erreur lors de l'inscription de ${username}:`, error);
            socket.emit('register-error', { message: "Erreur lors de l'inscription" });
        }
    });
    
    // Handle login
    socket.on('login', async (data) => {
        const { username, password } = data;
        console.log(`Tentative de connexion pour: ${username}`);
        
        try {
            // Authentifier l'utilisateur
            const result = await db.loginUser(username, password);
            
            if (result.success) {
                // Stocker les informations du joueur dans la session socket
                socket.player = result.player;
                
                // Envoyer la réponse de succès
                socket.emit('login-success', { player: result.player });
                console.log(`Connexion réussie pour ${result.player.username}`);
            } else {
                // Envoyer l'erreur
                socket.emit('login-error', { message: result.message });
                console.log(`Échec de la connexion pour ${username}: ${result.message}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la connexion de ${username}:`, error);
            socket.emit('login-error', { message: "Erreur lors de la connexion" });
        }
    });
    socket.on('logout', () => {
        console.log(`Déconnexion de l'utilisateur: ${socket.player ? socket.player.username : 'inconnu'}`);
        
        try {
            // Remove from matchmaking queue if present
            if (socket.player) {
                console.log(`Retrait de ${socket.player.username} de la file d'attente suite à déconnexion manuelle`);
                matchmaking.removeFromQueue(socket);
            }
            
            // Clean up player reference
            socket.player = null;
            
            // Send confirmation
            socket.emit('logout-success');
            console.log(`Déconnexion réussie`);
        } catch (error) {
            console.error(`Erreur lors de la déconnexion:`, error);
        }
    });
    
    // Handle matchmaking
    socket.on('find-match', () => {
        console.log(`Recherche de match pour: ${socket.player ? socket.player.username : 'joueur inconnu'}`);
        
        if (socket.player) {
            try {
                matchmaking.addToQueue(socket);
                console.log(`${socket.player.username} ajouté à la file d'attente`);
            } catch (error) {
                console.error(`Erreur lors de l'ajout à la file d'attente:`, error);
                socket.emit('matchmaking-error', { message: "Erreur lors de la recherche de match" });
            }
        } else {
            console.error('Erreur: Tentative de recherche de match sans être connecté');
            socket.emit('matchmaking-error', { message: "Veuillez vous connecter d'abord" });
        }
    });
    
    // Handle game moves
    socket.on('make-move', (data) => {
        const { column } = data;
        console.log(`${socket.player ? socket.player.username : 'Joueur inconnu'} tente de jouer dans la colonne ${column}`);
        
        if (socket.game && socket.player) {
            try {
                const result = socket.game.makeMove(socket.player.id, column);
                
                if (result.success) {
                    console.log(`Coup réussi en colonne ${column} par ${socket.player.username}`);
                    
                    // Broadcast game update to both players
                    io.to(socket.game.id).emit('game-update', {
                        board: socket.game.board,
                        currentTurn: socket.game.currentTurn
                    });
                    console.log(`Mise à jour du jeu envoyée, tour de: ${socket.game.currentTurn}`);
                    
                    // Check if game is over
                    if (socket.game.isGameOver) {
                        console.log(`Partie terminée, gagnant: ${socket.game.winner || 'match nul'}`);
                        handleGameOver(socket.game);
                    }
                } else {
                    console.log(`Coup invalide: ${result.message}`);
                    socket.emit('move-error', { message: result.message });
                }
            } catch (error) {
                console.error(`Erreur lors du coup:`, error);
                socket.emit('move-error', { message: "Erreur lors du coup" });
            }
        } else {
            console.error('Erreur: Tentative de jouer sans partie active');
            socket.emit('move-error', { message: "Aucune partie active" });
        }
    });
    
    // Gestion des messages de chat
    socket.on('send-chat', (data) => {
        const { gameId, message } = data;
        
        // Vérifier que le joueur est dans une partie
        if (!socket.player || !socket.game || socket.game.id !== gameId) {
            console.log('Tentative d\'envoi de message hors partie');
            return;
        }
        
        console.log(`Chat: ${socket.player.username} dans le jeu ${gameId}: ${message}`);
        
        // Limiter la longueur du message pour éviter les abus
        const sanitizedMessage = message.trim().substring(0, 200);
        
        // Émettre le message à tous les joueurs dans la partie
        io.to(gameId).emit('chat-message', {
            username: socket.player.username,
            message: sanitizedMessage,
            timestamp: Date.now()
        });
    });
    
    // Handle forfeit
    socket.on('forfeit', () => {
        console.log(`${socket.player ? socket.player.username : 'Joueur inconnu'} abandonne la partie`);
        
        if (socket.game && socket.player) {
            try {
                // Set opponent as winner
                const opponent = socket.game.players.find(p => p.id !== socket.player.id);
                console.log(`Adversaire ${opponent.username} déclaré vainqueur par forfait`);
                
                socket.game.winner = opponent.id;
                socket.game.isGameOver = true;
                
                // End the game
                handleGameOver(socket.game);
            } catch (error) {
                console.error(`Erreur lors de l'abandon:`, error);
            }
        } else {
            console.error('Erreur: Tentative d\'abandon sans partie active');
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`Déconnexion: ${socket.id}, joueur: ${socket.player ? socket.player.username : 'inconnu'}`);
        
        try {
            // Remove from matchmaking queue if present
            if (socket.player) {
                console.log(`Retrait de ${socket.player.username} de la file d'attente`);
                matchmaking.removeFromQueue(socket);
            }
            
            // Forfeit game if in progress
            if (socket.game && socket.player && !socket.game.isGameOver) {
                console.log(`Abandon automatique de la partie pour ${socket.player.username} (déconnexion)`);
                
                // Simulate forfeit
                const opponent = socket.game.players.find(p => p.id !== socket.player.id);
                if (opponent) {
                    socket.game.winner = opponent.id;
                    socket.game.isGameOver = true;
                    handleGameOver(socket.game);
                }
            }
        } catch (error) {
            console.error(`Erreur lors de la déconnexion:`, error);
        }
    });
});

// Function to handle game over
function handleGameOver(game) {
    console.log(`Traitement de fin de partie, ID: ${game.id}`);
    
    try {
        // Calculate new ELO ratings
        const p1 = game.players[0];
        const p2 = game.players[1];
        
        console.log(`Joueurs: ${p1.username}(${p1.elo}) vs ${p2.username}(${p2.elo})`);
        
        let p1EloChange = 0;
        let p2EloChange = 0;
        
        if (game.winner) {
            // Someone won
            const winner = game.players.find(p => p.id === game.winner);
            const loser = game.players.find(p => p.id !== game.winner);
            
            console.log(`Gagnant: ${winner.username}, Perdant: ${loser.username}`);
            
            const result = rankSystem.calculateNewRatings(winner.elo, loser.elo);
            console.log(`Changements ELO calculés: Gagnant +${result.winnerChange}, Perdant ${result.loserChange}`);
            
            if (winner.id === p1.id) {
                p1EloChange = result.winnerChange;
                p2EloChange = result.loserChange;
            } else {
                p1EloChange = result.loserChange;
                p2EloChange = result.winnerChange;
            }
        } else {
            // Draw
            console.log(`Match nul entre ${p1.username} et ${p2.username}`);
            
            const result = rankSystem.calculateDrawRatings(p1.elo, p2.elo);
            console.log(`Changements ELO pour match nul: P1 ${result.player1Change}, P2 ${result.player2Change}`);
            
            p1EloChange = result.player1Change;
            p2EloChange = result.player2Change;
        }
        
        // Update player ratings in database
        console.log(`Mise à jour des ELO: ${p1.username} ${p1.elo} -> ${p1.elo + p1EloChange}, ${p2.username} ${p2.elo} -> ${p2.elo + p2EloChange}`);
        
        db.updatePlayerRating(p1.id, p1.elo + p1EloChange);
        db.updatePlayerRating(p2.id, p2.elo + p2EloChange);
        
        // Get updated player data
        const updatedP1 = db.getPlayer(p1.id);
        const updatedP2 = db.getPlayer(p2.id);
        
        console.log(`Données joueurs mises à jour: ${updatedP1.username}(${updatedP1.elo}), ${updatedP2.username}(${updatedP2.elo})`);
        
        // Send game over event to players
        const socketsInRoom = io.sockets.adapter.rooms.get(game.id);
        if (socketsInRoom) {
            console.log(`Envoi des résultats aux ${socketsInRoom.size} joueurs dans la room`);
            
            for (const socketId of socketsInRoom) {
                const socket = io.sockets.sockets.get(socketId);
                
                if (socket && socket.player) {
                    const isPlayer1 = socket.player.id === p1.id;
                    const player = isPlayer1 ? updatedP1 : updatedP2;
                    const eloChange = isPlayer1 ? p1EloChange : p2EloChange;
                    
                    console.log(`Envoi des résultats à ${player.username}: ${eloChange > 0 ? '+' : ''}${eloChange} ELO`);
                    
                    socket.emit('game-over', {
                        winner: game.winner,
                        player,
                        eloChange
                    });
                    
                    // Clean up game reference
                    socket.game = null;
                    socket.leave(game.id);
                    console.log(`${player.username} a quitté la room ${game.id}`);
                }
            }
        } else {
            console.log(`Aucun joueur trouvé dans la room ${game.id}`);
        }
    } catch (error) {
        console.error(`Erreur lors du traitement de fin de partie:`, error);
    }
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`Accessible localement sur http://localhost:${PORT}`);
    console.log(`=================================`);
});