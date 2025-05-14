# ECOMMERCE_API – API + Moteur RAG de Recommandation
*projet développé pendant les cours*

## Description

Ce projet combine une **API Node.js** pour gérer des produits e-commerce avec un moteur de recherche intelligent utilisant des **embeddings vectoriels**. Il permet de :

- Gérer les données produits via une API REST
- Indexer les descriptions dans une base vectorielle (test ChromaDB et mongoDb)
- Rechercher des produits similaires via un système RAG (Retrieval-Augmented Generation)

## Technologies utilisées

- **Node.js**, **Express** – pour l’API
- **MongoDB** – base de données NoSQL
- **ChromaDB** – base vectorielle pour la recherche sémantique
- **Langchain**, **sentence-transformers** – pour les embeddings
- **Docker** – conteneurisation de l’environnement

## Arborescence
ECOMMERCE_API/
│
├── config/ # Configuration de la base de données
├── data/ # Données produits brutes
├── docker/ # Fichiers de configuration Docker
├── models/ # Schémas MongoDB
├── ragLangchain/ # Moteur RAG et logique vectorielle
├── services/ # Fonctions métiers (import, similarité)
│
├── app.js # Point d’entrée de l’application
├── routes.js # Routes de l’API
├── embeddings.js # Génération des embeddings
├── importData.js # Script d'importation de données
├── .env # Variables d’environnement
└── README.md # Ce fichier
