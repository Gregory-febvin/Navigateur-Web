<div align="center">
  <img src="https://github.com/user-attachments/assets/1f153cca-9730-4c3a-91db-5dee1133148e" width="200px">
  <h1>Navigateur Web</h1>
</div>

## Description
Ce projet a pour objectif d'améliorer un navigateur web personnalisé basé sur Electron et Angular. Electron repose sur Chromium et permet d'exploiter et d'enrichir les fonctionnalités de base du navigateur.

## Fonctionnalités
- **Création d'un composant "Home"** : Ajout d'un bouton permettant de retourner à la page d'accueil.
- **Personnalisation du navigateur** : Intégration de nouvelles fonctionnalités comme une barre de favoris et un bloqueur de publicités.
- **Blocage des publicités** : Implémentation d'un système basé sur la liste EasyList pour filtrer les annonces intrusives.
- **Capture d'écran** : Ajout d'une fonctionnalité pour capturer la page en cours.
- **Correction automatique des URLs** : Ajout du protocole manquant (http://) pour éviter les erreurs de chargement.
<div align="center">
  <img src="https://github.com/user-attachments/assets/3c19a2c9-7200-4e23-8c4b-6c30d050ee39" height="200px">
  <img src="https://github.com/user-attachments/assets/407e7b9d-b71d-4480-a7a0-f3890798a36b" height="200px">
</div>

## Prérequis
- Node.js et npm installés
- [Angular CLI](https://github.com/angular/angular-cli) installé

## Installation
- Cloner le projet
```bash
git clone https://github.com/Gregory-febvin/Navigateur-Web.git
cd Navigateur-Web
```
- Installer les dépendances
```bash
npm install
```
- Lancer l'application
```bash
# Avec Angular
npm run start

# Avec Electron (Cette commande doit être redémarrée si vous modifiez l'un des fichiers source)
npm run start:electron
```

## Construction de l'application
### Avec Angular
Pour construire le projet :
```bash
npm run build
```
Les artefacts de construction seront stockés dans le répertoire `dist/`.
### Avec Electron
Suivant votre système d'exploitation, pour empaqueter et construire le projet en tant qu'application autonome : 
```bash
npm run build:mac
# ou
npm run build:win
# ou
npm run build:linux
```
L'application compilée sera disponible dans le répertoire `releases/`. 
Cette commande doit être redémarrée si vous modifiez l'un des fichiers source.

## Technologies utilisées
- **Framework** : Angular
- **Environnement** : Electron
- **Base de données locale** : Stockage des favoris dans `localStorage`
- **API** : EasyList pour le blocage des publicités
