// routes/productRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/products.js'; // modèle mongoose pour "products"
import Order from './models/orders.js';     // modèle mongoose pour "orders"
import { similaritySearch } from './services/similarity.js'; // adapte le chemin si besoin
// import { getProductInfoByText } from './services/similarity.js'; // adapte le chemin si besoin
dotenv.config();

// Connexion MongoDB
const client = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;
console.log("Connexion à MongoDB...");
await mongoose.connect(client, { dbName });
console.log("Connecté à MongoDB");
const router = express.Router();

// === ROUTES ===

// Récupérer tous les produits
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        console.error("Erreur lors de la récupération des produits :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Récupérer tous les orders
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (error) {
        console.error("Erreur lors de la récupération des commandes :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Récupérer un produit par son UUID (champ `id`)
router.get('/products/:id', async (req, res) => {
    const uuid = req.params.id;
    try {
        const product = await Product.findOne({ id: uuid }); // on cherche via le champ UUID
        if (!product) {
            return res.status(404).json({ message: "Produit non trouvé" });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error("Erreur lors de la récupération du produit :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});



router.get('/orders/:id', async (req, res) => {
    const uuid = req.params.id;
    console.log(`Récupération de la commande avec l'UUID : ${uuid}`);

    try {
        const order = await Order.findOne({ id: uuid });
        console.log(`Commande trouvée : ${JSON.stringify(order)}`);


        if (!order) {
            return res.status(404).json({ message: "Commande non trouvée" });
        }

        // On récupère les produits de la commande
        const products = await Product.find({ id: { $in: order.products } });

        // Initialisation d’un tableau pour stocker les recommandations
        const recommendedProducts = [];

        for (const product of products) {
            const similar = await similaritySearch(product.embedding, 5, product.id); // on exclut le produit lui-même

            const enrichedResults = similar.map(doc => ({
                id: doc.id,
                name: doc.name,
                score: doc.score
            }));

            recommendedProducts.push({
                productId: product.id,
                productName: product.name,
                productCategory: product.category,
                similarProducts: enrichedResults
            });
        }

        res.status(200).json({ order, products, recommendedProducts });

    } catch (error) {
        console.error("Erreur lors de la récupération de la commande ou des produits similaires :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});



// Créer une nouvelle commande
router.post('/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body); // nouvelle instance à partir du body
        const savedOrder = await newOrder.save(); // insertion en base
        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("Erreur lors de la création de la commande :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

export default router;
