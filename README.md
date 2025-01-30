# Projet de gestion d'image par steganographie

## Description
Ce projet est une API crée en NestJS qui permet la gestion des utilisateurs et de leurs images par stéganographie.

## Fonctionnalités demandées
- Gestion des utilisateurs et routes (publiques ou avec authentification)
    - Authentification avec JWT
- Gestion des certificats (achat, consultation, suivi du nombre de consultation)
- Stéganographie des images
    - Création
        - incruster du texte concernant le propriétaire de l’image
        - renvoyer l’image modifiée à l’utilisateur
    - Vérification
        - Verification d’un certificat existante de fichier via un upload
- Administration de la plateforme pour un utilisateur avec des privilèges spéciaux

## Installation
1. Cloner le dépôt :
   ```sh
   git clone git@github.com:AlexHamon74/myDigitalStamp_nestjs.git
   ```
2. Installer les dépendances :
   ```sh
   npm install 
   ```
3. Configurer les variables d'environnement dans un fichier `.env.local` en s'inspirant du fichier `.env.test`

4. Générer les migrations avec le commande `npm run migration:generate`, puis les exécuter avec `npm run migration:run`

## Utilisation
1. Lancer le serveur :
   ```sh
   npm run start:dev 
   ```
2. Tester les routes suivantes avec le logiciel Postman a l'URL `localhost:3000`.

## Routes Principales
- `POST /auth/register` : Inscription d'un utilisateur.
- `POST /auth/login` : Connexion et récupération du token JWT.

- `POST /files/upload` : Upload de l'image originale et de l'image modifié avec l'id de l'utilisateur connecté.
- `POST /files/reveal` : Révele les infos de l'utilisateur à qui appartient l'image si elle est modifiée.
- `GET /files/user-images` : Récupération de toutes les images liées à l'utilisateur connecté.
- `GET /files/download/:filename` : Téléchargement d'une image modifiée.

- `GET /users` : Récupération de tous les utilisateurs.
- `DELETE /users/:id` : Suppression d'un utilisateur.

## Conclusion
Dès le début du projet j'ai oublié de créer la table certificats.
J'ai donc relier les images directement aux users.
Les routes /users ne sont protégées par un user qui à un rôle d'administrateur
