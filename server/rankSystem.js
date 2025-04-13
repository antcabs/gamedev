class RankSystem {
    constructor() {
        this.ranks = [
            { name: "Bronze", min: 0, max: 1199 },
            { name: "Argent", min: 1200, max: 1499 },
            { name: "Or", min: 1500, max: 1799 },
            { name: "Platine", min: 1800, max: 2099 },
            { name: "Diamant", min: 2100, max: 2399 },
            { name: "Maître", min: 2400, max: 2699 },
            { name: "Grand Maître", min: 2700, max: Infinity }
        ];
    }
    
    getRank(elo) {
        for (const rank of this.ranks) {
            if (elo >= rank.min && elo <= rank.max) {
                return rank.name;
            }
        }
        return "Inconnu";
    }
    
    calculateNewRatings(winnerElo, loserElo) {
        // ELO calculation constants
        const K = 32;
        
        // Calculate expected outcome
        const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
        const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
        
        // Calculate ELO changes
        const winnerChange = Math.round(K * (1 - expectedWinner));
        const loserChange = Math.round(K * (0 - expectedLoser));
        
        return { winnerChange, loserChange };
    }
    
    calculateDrawRatings(player1Elo, player2Elo) {
        // ELO calculation constants
        const K = 32;
        
        // Calculate expected outcome
        const expectedP1 = 1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
        const expectedP2 = 1 / (1 + Math.pow(10, (player1Elo - player2Elo) / 400));
        
        // For a draw, actual outcome is 0.5
        const player1Change = Math.round(K * (0.5 - expectedP1));
        const player2Change = Math.round(K * (0.5 - expectedP2));
        
        return { player1Change, player2Change };
    }
}

module.exports = RankSystem;
