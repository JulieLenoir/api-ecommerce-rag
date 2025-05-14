import { OllamaEmbeddings } from "@langchain/ollama";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Document } from "langchain/document";

dotenv.config();

// Connexion MongoDB
const client = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

console.log("Connexion à MongoDB...");
await mongoose.connect(client, { dbName });
console.log("Connecté à MongoDB");

// Accès à la base
const db = mongoose.connection.db;
const productsCollection = db.collection("products");
const ordersCollection = db.collection("orders");

// Création de l'embedder avec Ollama
console.log("Initialisation du modèle d'embedding avec Ollama...");
const embeddings = new OllamaEmbeddings({
    model: "mxbai-embed-large",
    baseUrl: "http://127.0.0.1:11434",
});
console.log("Embedder initialisé");

// Récupération des produits
console.log("Chargement des produits...");
const products = await productsCollection.find({}).toArray();
console.log(`${products.length} produits chargés`);

const orders = await ordersCollection.find({}).toArray();
console.log(`${orders.length} commandes chargées`);



// Initialisation du Vector Store avec la collection des produits
console.log("Initialisation du vector store...");
const vectorStoreOrders = new MongoDBAtlasVectorSearch(embeddings, {
    collection: ordersCollection,
    indexName: "vector_index", // Doit correspondre à celui dans MongoDB Atlas
    textKey: "text",
    embeddingKey: "embedding",
});
console.log("Vector store prêt");
for (const [index, order] of orders.entries()) {

    const text = [
        order.userId,
        order.dat,
        order.products.join(" "),
        order.total
    ].filter(Boolean).join(" ");
    console.log(`(${index + 1}/${orders.length}) Génération de l'embedding pour la commande : ${order.id || "sans id"}`);

    try {
        const embedding = await embeddings.embedQuery(text);

        // Création du document avec les métadonnées
        const doc = new Document({
            pageContent: text,
            metadata: {
                id: orders.id, // Identifiant du produit
                userId: orders.userId,
                date: orders.date,
                product: orders.products,
                total: orders.total
            }
        });
        // Mise à jour de la commande dans MongoDB
        await ordersCollection.updateOne(
            { _id: order._id },
            { $set: { embedding: embedding, text: text } }
        );

        console.log(`Commande ${order._id} mise à jour avec embedding`);


        // Ajouter ce document au vector store
        await vectorStoreOrders.addDocuments([doc]); // Ajouter le document avec embedding et métadonnées
    } catch (err) {
        console.error(`Erreur sur le produit ${order._id} :`, err);
    }

}

// Initialisation du Vector Store avec la collection des produits
console.log("Initialisation du vector store...");
const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection: productsCollection,
    indexName: "vector_index", // Doit correspondre à celui dans MongoDB Atlas
    textKey: "text",
    embeddingKey: "embedding",
});
console.log("Vector store prêt");
// Boucle sur chaque produit
for (const [index, product] of products.entries()) {
    const text = [
        product.name,
        product.description,
        product.category,
        product.price
    ].filter(Boolean).join(" "); // Fusionne les champs en une seule chaîne de texte

    console.log(`(${index + 1}/${products.length}) Génération de l'embedding pour le produit : ${product.name || "sans nom"}`);

    try {
        // Génération de l'embedding via Ollama
        const embedding = await embeddings.embedQuery(text);

        // Création du document avec les métadonnées
        const doc = new Document({
            pageContent: text,
            metadata: {
                id: product.id, // Identifiant du produit
                name: product.name,
                description: product.description,
                category: product.category,
                price: product.price
            }
        });

        // Mise à jour du produit dans MongoDB avec l'embedding et les métadonnées
        await productsCollection.updateOne(
            { _id: product._id },
            { $set: { embedding: embedding, text: text } }
        );

        console.log(`Produit ${product._id} mis à jour avec embedding`);

        // Ajouter ce document au vector store
        await vectorStore.addDocuments([doc]); // Ajouter le document avec embedding et métadonnées
    } catch (err) {
        console.error(`Erreur sur le produit ${product._id} :`, err);
    }
}


// Fin
console.log("Tous les produits ont été vectorisés et enregistrés.");

