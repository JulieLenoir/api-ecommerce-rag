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


