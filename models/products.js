// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: String,
    description: String,
    category: String,
    price: Number,
    stock: Number,
    embedding: [Number], // Si tu stockes des vecteurs
    text: String
}, { collection: 'products' }); // Pour que Mongoose utilise la bonne collection

const Product = mongoose.model('product', productSchema);

export default Product;
