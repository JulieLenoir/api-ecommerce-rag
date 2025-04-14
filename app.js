// app.js
const express = require("express");
const connectDB = require("./config/db");
const app = express();

// Connexion à MongoDB
connectDB();

app.use(express.json());

app.listen(3000, () => {
    console.log("Serveur démarré sur le port 3000");
});
