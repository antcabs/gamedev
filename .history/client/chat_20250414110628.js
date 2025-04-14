// Classe pour gérer le chat en jeu
class GameChat {
    constructor(gameContainer) {
        this.gameContainer = gameContainer;
        this.chatContainer = null;
        this.messagesContainer = null;
        this.chatInput = null;
        this.chatSendBtn = null;
        this.isInitialized = false;
    }
    
    // Initialiser le chat
    init() {
        if (this.isInitialized) return;
        
        // Cloner le template de chat
        const template = document.getElementById('chat-template');
        const chatElement = template.content.cloneNode(true);
        
        // Ajouter le chat au conteneur de jeu
        this.gameContainer.appendChild(chatElement);
        
        // Récupérer les éléments du DOM
        this.chatContainer = document.getElementById('chat-container');
        this.messagesContainer = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSendBtn = document.getElementById('chat-send');
        
        // Ajouter les écouteurs d'événements
        this.chatSendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Écouter les messages de chat entrants
        socket.on('chat-message', (data) => {
            this.receiveMessage(data);
        });
        
        this.isInitialized = true;
    }
    
    // Envoyer un message
    sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (message && currentPlayer && socket.game) {
            // Envoyer le message au serveur
            socket.emit('send-chat', {
                gameId: socket.game.id,
                message: message
            });
            
            // Ajouter le message localement (optimiste)
            this.addMessageToChat(currentPlayer.username, message, true);
            
            // Vider l'input
            this.chatInput.value = '';
        }
    }
    
    // Recevoir un message du serveur
    receiveMessage(data) {
        const { username, message } = data;
        const isSelf = username === currentPlayer.username;
        
        // Ne pas afficher à nouveau nos propres messages (déjà ajoutés optimistiquement)
        if (!isSelf) {
            this.addMessageToChat(username, message, isSelf);
        }
    }
    
    // Ajouter un message à l'interface
    addMessageToChat(username, message, isSelf) {
        // Créer les éléments du message
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isSelf ? 'self' : 'other'}`;
        
        const usernameElement = document.createElement('div');
        usernameElement.className = 'chat-username';
        usernameElement.textContent = username;
        
        const textElement = document.createElement('div');
        textElement.className = 'chat-text';
        textElement.textContent = message;
        
        // Assembler le message
        messageElement.appendChild(usernameElement);
        messageElement.appendChild(textElement);
        
        // Ajouter au conteneur des messages
        this.messagesContainer.appendChild(messageElement);
        
        // Faire défiler vers le bas
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    // Afficher le chat
    show() {
        if (!this.isInitialized) {
            this.init();
        }
        this.chatContainer.style.display = 'flex';
    }
    
    // Masquer le chat
    hide() {
        if (this.chatContainer) {
            this.chatContainer.style.display = 'none';
        }
    }
    
    // Vider le chat
    clear() {
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = '';
        }
    }
}

// Créer une instance du chat
const gameChat = new GameChat(gameContainer);

// Initialiser le chat lorsqu'une partie commence
socket.on('match-found', (data) => {
    // Initialiser et afficher le chat
    gameChat.clear();
    gameChat.show();
});

// Masquer le chat lorsque la partie se termine
socket.on('game-over', (data) => {
    // Masquer le chat
    gameChat.hide();
});