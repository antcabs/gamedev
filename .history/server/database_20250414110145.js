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
    
    // Méthode pour créer un nouvel utilisateur avec mot de passe
    async registerUser(username, password) {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = this.findPlayerByUsername(username);
        if (existingUser) {
            return { success: false, message: "Ce nom d'utilisateur existe déjà" };
        }
        
        // Créer un nouvel ID unique
        const id = `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const defaultElo = 1000;
        const rankSystem = new RankSystem();
        
        // Créer le joueur avec mot de passe
        // Dans une vraie application, vous devriez hacher le mot de passe
        // avec bcrypt ou une autre bibliothèque de hachage
        const player = {
            id,
            username,
            password, // En production, utilisez : await bcrypt.hash(password, 10)
            elo: defaultElo,
            rank: rankSystem.getRank(defaultElo),
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            createdAt: new Date()
        };
        
        this.players.set(id, player);
        
        // Retourner une copie du joueur sans le mot de passe
        const { password: _, ...safePlayer } = player;
        return { success: true, player: safePlayer };
    }
    
    // Méthode pour authentifier un utilisateur
    async loginUser(username, password) {
        const player = this.findPlayerByUsername(username);
        
        if (!player) {
            return { success: false, message: "Utilisateur non trouvé" };
        }
        
        // Vérifier le mot de passe
        // En production, utilisez : await bcrypt.compare(password, player.password)
        if (player.password !== password) {
            return { success: false, message: "Mot de passe incorrect" };
        }
        
        // Retourner une copie du joueur sans le mot de passe
        const { password: _, ...safePlayer } = player;
        return { success: true, player: safePlayer };
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