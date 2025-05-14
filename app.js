// app.js
import express from 'express';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import router from './routes.js';

const app = express();
connectDB();
app.use(express.json());

app.use('/api', router); // Utiliser le routeur pour les routes API

// Démarrer le serveur
app.listen(3000, () => {
    console.log("Serveur démarré sur le port 3000");
});
