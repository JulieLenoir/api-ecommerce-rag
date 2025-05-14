// models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    id: { type: String, required: true }, // UUID ou string unique
    userId: { type: String, required: true }, // ID de l'utilisateur
    date: { type: Date, required: true }, // Date de commande
    products: { type: Array, required: true }, // Liste des produits (à typer finement si besoin)
    total: { type: Number, required: true }, // Total de la commande
    embedding: [Number], // Vecteur sémantique si utilisé pour RAG
    text: { type: String } // Texte brut utilisé pour les embeddings ou la recherche
}, { collection: 'orders' }); // Assure que Mongoose utilise bien la collection "orders"

const Order = mongoose.model('order', orderSchema);

export default Order;
