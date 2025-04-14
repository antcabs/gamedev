# Puissance 4 Online avec Matchmaking

Un jeu de Puissance 4 en ligne avec un système de matchmaking et de classement basé sur l'ELO.

## Fonctionnalités

- Jeu de Puissance 4 jouable en ligne
- Système de matchmaking pour trouver des adversaires
- Classement basé sur l'ELO
- Rangs (Bronze, Argent, Or, etc.) déterminés par les points ELO
- Interface utilisateur responsive et intuitive

## Technologies utilisées

- **Frontend** : HTML, CSS, JavaScript (vanilla)
- **Backend** : Node.js, Express
- **Communication en temps réel** : Socket.IO

## Installation

1. Clonez ce dépôt :
   ```
   git clone https://github.com/votre-nom/puissance4-online.git
   cd puissance4-online
   ```

2. Installez les dépendances :
   ```
   npm install
   ```

3. Lancez le serveur :
   ```
   npm start
   ```

4. Ouvrez votre navigateur et accédez à `http://localhost:3000`

## Développement

Pour lancer le serveur en mode développement avec redémarrage automatique :
```
npm run dev
```

## Structure du projet
```
|-- client/                     # Frontend
|   |-- index.html              # Page HTML principale
|   |-- style.css               # Styles CSS 
|   |-- auth.js                 # Nouveau: Logique d'authentification côté client
|   |-- game.js                 # Logique du jeu côté client 
|   |-- chat.js                 # Nouveau: Système de chat en partie
|   |-- matchmaking.js          # Logique de matchmaking côté client
|   |-- history.js              # Historique des partie
|
|-- server/                     # Backend
|   |-- server.js               # Point d'entrée du serveur 
|   |-- game.js                 # Logique du jeu côté serveur
|   |-- matchmaking.js          # Système de matchmaking
|   |-- database.js             # Couche d'accès aux données 
|   |-- rankSystem.js           # Système de classement ELO
|
|-- package.json                # Configuration NPM
|-- README.md                   # Documentation
```

## Système de classement

Le système de classement est basé sur l'algorithme ELO, utilisé dans les échecs et d'autres jeux compétitifs :

- Chaque joueur commence avec 1000 points ELO
- Les points gagnés ou perdus dépendent de la différence d'ELO entre les joueurs
- Les rangs sont déterminés par les plages de points ELO :
  - Bronze : 0-1199
  - Argent : 1200-1499
  - Or : 1500-1799
  - Platine : 1800-2099
  - Diamant : 2100-2399
  - Maître : 2400-2699
  - Grand Maître : 2700+

## Fonctionnalités à venir

- Historique des parties
- Statistiques détaillées des joueurs
- Mode spectateur

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

Ce projet est sous licence MIT.
