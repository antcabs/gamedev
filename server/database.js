// Importer le système de classement
const RankSystem = require('./rankSystem');

class Database {
    constructor() {
        // In a real application, you would connect to a real database
        // This is a simple in-memory implementation for demo purposes
        this.players = new Map();
    }
    
    async getOrCreatePlayer(username) {
        // Check if player exists
        let player = this.findPlayerByUsername(username);
        
        if (!player) {
            // Create new player with default ratings
            const id = `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const defaultElo = 1000;
            const rankSystem = new RankSystem();
            
            player = {
                id,
                username,
                elo: defaultElo,
                rank: rankSystem.getRank(defaultElo),
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0
            };
            
            this.players.set(id, player);
        }
        
        return player;
    }
    
    getPlayer(id) {
        return this.players.get(id) || null;
    }
    
    findPlayerByUsername(username) {
        for (const player of this.players.values()) {
            if (player.username.toLowerCase() === username.toLowerCase()) {
                return player;
            }
        }
        return null;
    }
    
    updatePlayerRating(id, newElo) {
        const player = this.getPlayer(id);
        if (player) {
            player.elo = newElo;
            
            // Update rank based on new ELO
            const rankSystem = new RankSystem();
            player.rank = rankSystem.getRank(newElo);
            
            return true;
        }
        return false;
    }
    
    updatePlayerStats(id, result) {
        const player = this.getPlayer(id);
        if (player) {
            player.gamesPlayed++;
            
            if (result === 'win') {
                player.wins++;
            } else if (result === 'loss') {
                player.losses++;
            } else if (result === 'draw') {
                player.draws++;
            }
            
            return true;
        }
        return false;
    }
    
    getLeaderboard(limit = 10) {
        const players = Array.from(this.players.values());
        
        // Sort by ELO (highest first)
        players.sort((a, b) => b.elo - a.elo);
        
        // Return top players
        return players.slice(0, limit);
    }
}

// Exporter la classe pour l'utiliser dans d'autres fichiers
module.exports = Database;