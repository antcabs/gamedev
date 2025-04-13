class Game {
    constructor(players) {
        this.id = `game_${Date.now()}`;
        this.players = players;
        this.board = this.createEmptyBoard();
        this.currentTurn = players[0].id; // Player 1 starts
        this.isGameOver = false;
        this.winner = null;
    }
    
    createEmptyBoard() {
        return Array(6).fill().map(() => Array(7).fill(0));
    }
    
    makeMove(playerId, column) {
        // Check if it's the player's turn
        if (playerId !== this.currentTurn || this.isGameOver) {
            return { success: false, message: "Ce n'est pas votre tour ou la partie est terminée" };
        }
        
        // Check if the column is valid and not full
        if (column < 0 || column > 6) {
            return { success: false, message: "Colonne invalide" };
        }
        
        // Find the first empty cell from bottom to top
        let row = -1;
        for (let r = 5; r >= 0; r--) {
            if (this.board[r][column] === 0) {
                row = r;
                break;
            }
        }
        
        if (row === -1) {
            return { success: false, message: "Colonne pleine" };
        }
        
        // Place the token
        const playerNumber = playerId === this.players[0].id ? 1 : 2;
        this.board[row][column] = playerNumber;
        
        // Check for win
        if (this.checkWin(row, column, playerNumber)) {
            this.isGameOver = true;
            this.winner = playerId;
        } 
        // Check for draw
        else if (this.checkDraw()) {
            this.isGameOver = true;
        } 
        // Switch turns
        else {
            this.currentTurn = playerId === this.players[0].id ? this.players[1].id : this.players[0].id;
        }
        
        return { success: true };
    }
    
    checkWin(row, col, player) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal down-right
            [1, -1]   // diagonal down-left
        ];
        
        for (const [dr, dc] of directions) {
            let count = 1;  // Start with 1 for the current piece
            
            // Check in the positive direction
            for (let i = 1; i <= 3; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                
                if (this.isValidCell(r, c) && this.board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            // Check in the negative direction
            for (let i = 1; i <= 3; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                
                if (this.isValidCell(r, c) && this.board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= 4) {
                return true;
            }
        }
        
        return false;
    }
    
    checkDraw() {
        // Check if top row is full
        return this.board[0].every(cell => cell !== 0);
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < 6 && col >= 0 && col < 7;
    }
}

module.exports = Game;