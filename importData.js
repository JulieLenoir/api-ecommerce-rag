import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const client = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

async function importData() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(client, { dbName });

        // Lecture des fichiers JSON
        const products = JSON.parse(fs.readFileSync('./data/products.json', 'utf-8'));
        const orders = JSON.parse(fs.readFileSync('./data/orders.json', 'utf-8'));

        // Accès à la base de données
        const db = mongoose.connection.db;

        // Suppression des anciennes données et insertion des nouvelles
        await db.collection('products').deleteMany({});
        await db.collection('orders').deleteMany({});

        await db.collection('products').insertMany(products);
        await db.collection('orders').insertMany(orders);

        console.log('Data imported successfully');
    } catch (err) {
        console.error(err);
    } finally {
        // Fermeture de la connexion
        await mongoose.disconnect();
    }
}

importData();
