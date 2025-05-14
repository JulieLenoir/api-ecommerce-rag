// services/similarity.js
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OllamaEmbeddings } from "@langchain/ollama";
import Product from '../models/products.js'; // modèle mongoose pour "products"



// Fonction de recherche vectorielle avec MongoDB Aggregate
export async function similaritySearch(query, k = 5, excludeId = null) {
    // Génère l'embedding à partir du texte ou retourne directement s'il est déjà vectorisé
    const embeddings = new OllamaEmbeddings({
        model: "mxbai-embed-large",
        baseUrl: "http://127.0.0.1:11434",
    });

    const vector = Array.isArray(query) ? query : await embeddings.embedQuery(query);

    // Construction de l'agrégation
    const pipeline = [
        {
            // On utilise $search pour la recherche vectorielle
            $vectorSearch: {
                index: "vector_index", // nom de ton index MongoDB Atlas
                path: "embedding",     // champ vecteur dans la collection
                queryVector: vector,
                numCandidates: 100,
                limit: k, // on récupère un de plus au cas où on doit filtrer excludeId
                similarity: "cosine"
            }
        },
        {
            // On filtre les résultats pour exclure le produit lui-même
            $match: excludeId
                ? { id: { $ne: excludeId } } // exclure le produit lui-même
                : {}
        },
        {
            $project: {
                _id: 0,
                id: 1,
                name: 1,
                description: 1,
                category: 1,
                price: 1,
                score: { $meta: "vectorSearchScore" }
            }
        },
        {
            $group: {
                _id: "$id",
                doc: { $first: "$$ROOT" }
            }
        },
        {
            $replaceRoot: { newRoot: "$doc" }
        },
        {
            // On peut trier par score si nécessaire
            $sort: { score: -1 }
        },
        {
            // On limite le nombre de résultats à k
            $limit: k
        }
    ];

    // Exécution sur la collection `Product`
    const results = await Product.aggregate(pipeline).exec();
    return results;
}
