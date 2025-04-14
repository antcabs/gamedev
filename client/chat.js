// Classe pour gérer le chat en jeu
class GameChat {
    constructor(gameContainer) {
        this.gameContainer = gameContainer;
        this.chatContainer = null;
        this.messagesContainer = null;
        this.chatInput = null;
        this.chatSendBtn = null;
        this.isInitialized = false;
        this.currentGameId = null; // Stocker l'ID de la partie courante
    }
    
    // Initialiser le chat
    init(gameId) {
        if (this.isInitialized) {
            this.currentGameId = gameId; // Mettre à jour l'ID de la partie
            return;
        }
        
        this.currentGameId = gameId; // Stocker l'ID de la partie
        
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
        
        // Ajouter un message système
        this.addSystemMessage("Chat initialisé. Vous pouvez discuter avec votre adversaire!");
    }
    
    // Envoyer un message
    sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (message && currentPlayer && this.currentGameId) {
            console.log("Envoi du message:", message, "dans la partie:", this.currentGameId);
            
            // Envoyer le message au serveur
            socket.emit('send-chat', {
                gameId: this.currentGameId,
                message: message
            });
            
            // Ajouter le message localement (optimiste)
            this.addMessageToChat(currentPlayer.username, message, true);
            
            // Vider l'input
            this.chatInput.value = '';
        } else {
            console.log("Impossible d'envoyer le message:", {
                message: !!message,
                currentPlayer: !!currentPlayer,
                gameId: this.currentGameId
            });
            
            if (!this.currentGameId) {
                this.addSystemMessage("Erreur: ID de partie manquant");
            }
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
    
    // Ajouter un message système au chat
    addSystemMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message system';
        messageElement.textContent = message;
        
        this.messagesContainer.appendChild(messageElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
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
            console.error("Le chat n'est pas initialisé");
            return;
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
    
    // Mettre à jour l'ID de la partie
    updateGameId(gameId) {
        this.currentGameId = gameId;
        console.log("ID de partie mis à jour:", gameId);
    }
}

// Créer une instance du chat
const gameChat = new GameChat(gameContainer);

// Initialiser le chat lorsqu'une partie commence
socket.on('match-found', (data) => {
    // Initialiser et afficher le chat avec l'ID de la partie
    gameChat.clear();
    gameChat.init(data.id); // Passer l'ID de la partie au chat
    gameChat.show();
    
    // Stocker également la référence du jeu dans l'objet socket
    // pour que le serveur puisse l'utiliser pour identifier la partie
    socket.game = { id: data.id };
    console.log("Partie trouvée, ID:", data.id);
});

// Masquer le chat lorsque la partie se termine
socket.on('game-over', (data) => {
    // Masquer le chat
    gameChat.hide();
    
    // Réinitialiser la référence de la partie
    gameChat.updateGameId(null);
});
