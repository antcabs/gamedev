// matchmaking.js (server)
const Game = require('./game');

class Matchmaking {
    constructor(db, rankSystem) {
        this.db = db;
        this.rankSystem = rankSystem;
        this.queue = [];
        console.log("Système de matchmaking initialisé");
    }
    
    addToQueue(socket) {
        // Ajouter l'horodatage d'entrée en file d'attente
        socket.enterQueueTime = Date.now();
        console.log(`Joueur ${socket.player.username} ajouté à la file d'attente à ${new Date().toLocaleTimeString()}`);
        
        // Ajouter le joueur à la file d'attente
        this.queue.push(socket);
        
        console.log(`File d'attente actuelle: ${this.queue.length} joueurs`);
        
        // Essayer de matcher des joueurs
        this.matchPlayers();
    }
    
    removeFromQueue(socket) {
        console.log(`Tentative de retrait de ${socket.id} de la file d'attente`);
        const index = this.queue.findIndex(s => s.id === socket.id);
        if (index !== -1) {
            this.queue.splice(index, 1);
            console.log(`Joueur retiré de la file d'attente, reste ${this.queue.length} joueurs`);
        } else {
            console.log(`Joueur non trouvé dans la file d'attente`);
        }
    }
    
    matchPlayers() {
        console.log("Tentative de matchmaking avec", this.queue.length, "joueurs en file d'attente");
        
        if (this.queue.length < 2) {
            console.log("Pas assez de joueurs pour matcher");
            return;
        }
        
        // Sort queue by ELO to match players with similar skill levels
        this.queue.sort((a, b) => a.player.elo - b.player.elo);
        console.log("File d'attente triée par ELO");
        
        // Match players with similar ELO
        for (let i = 0; i < this.queue.length - 1; i++) {
            const socket1 = this.queue[i];
            const socket2 = this.queue[i + 1];
            
            console.log(`Vérification de la paire: ${socket1.player.username}(${socket1.player.elo}) et ${socket2.player.username}(${socket2.player.elo})`);
            
            // Check if they are still connected
            if (!socket1.connected || !socket2.connected) {
                console.log("Un des joueurs n'est plus connecté, passage à la paire suivante");
                continue;
            }
            
            // Calculate ELO difference
            const eloDiff = Math.abs(socket1.player.elo - socket2.player.elo);
            console.log(`Différence d'ELO: ${eloDiff}`);
            
            // If ELO difference is acceptable, create a game
            // We increase acceptable difference over time to ensure players get matched
            const waitTime = Date.now() - (socket1.enterQueueTime || Date.now());
            const waitTimeInSeconds = Math.floor(waitTime / 1000);
            const acceptableDiff = Math.min(200 + waitTimeInSeconds, 500);
            
            console.log(`Joueur ${socket1.player.username} attend depuis ${waitTimeInSeconds} secondes`);
            console.log(`Différence acceptable: ${acceptableDiff}`);
            
            if (eloDiff <= acceptableDiff) {
                console.log(`Match créé entre ${socket1.player.username} et ${socket2.player.username}`);
                
                // Create game and remove players from queue
                this.createGame(socket1, socket2);
                
                // Remove both players from queue
                this.queue.splice(i, 2);
                console.log(`Deux joueurs retirés de la file d'attente, reste ${this.queue.length} joueurs`);
                
                // Restart matching after creating a game
                this.matchPlayers();
                return;
            } else {
                console.log(`Différence d'ELO trop grande (${eloDiff} > ${acceptableDiff}), pas de match`);
            }
        }
        
        console.log("Aucun match n'a pu être créé pour le moment");
    }
    
    createGame(socket1, socket2) {
        try {
            console.log(`Création d'une partie entre ${socket1.player.username} et ${socket2.player.username}`);
            
            const players = [socket1.player, socket2.player];
            const game = new Game(players);
            
            console.log(`Partie créée avec ID: ${game.id}`);
            
            // Join both sockets to a room
            socket1.join(game.id);
            socket2.join(game.id);
            console.log(`Les deux joueurs ont rejoint la room ${game.id}`);
            
            // Store game reference in sockets
            socket1.game = game;
            socket2.game = game;
            
            // Notify both players that a match was found
            const gameData = {
                id: game.id,
                players,
                board: game.board,
                currentTurn: game.currentTurn
            };
            
            socket1.emit('match-found', gameData);
            socket2.emit('match-found', gameData);
            console.log(`Événement match-found envoyé aux deux joueurs`);
            
            return true;
        } catch (error) {
            console.error(`Erreur lors de la création de la partie:`, error);
            return false;
        }
    }
}

module.exports = Matchmaking;