// backend/config/db.js
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        // await mongoose.connect(process.env.MONGO_URL); #connexion en local
        await mongoose.connect(process.env.MONGO_URI); // connexion en ligne
        console.log("MongoDB Atlas connecté  !");
    } catch (err) {
        console.error("Erreur de connexion à MongoDB :", err.message);
        process.exit(1); // Quitter l'app si erreur
    }
};

module.exports = connectDB;
