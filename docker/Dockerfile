# Étape de build
FROM node AS build

# Dossier de travail dans le conteneur
WORKDIR /app

# Copie des fichiers package.json et package-lock.json
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code
COPY . .

# Expose le port utilisé par ton app
EXPOSE 3000

# Commande de lancement
CMD ["npm", "start"]
