// Fichier : rag_script.js
import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

import fetch from "node-fetch";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { Document } from "langchain/document";

const CHROMA_URL = "http://localhost:8000";
const DATA_PATH = "./data.json";
const CACHE_PATH = "./cache.json";

// Lecture des données de cours depuis data.json
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

// Initialiser le cache local
let cache = fs.existsSync(CACHE_PATH)
    ? JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"))
    : {};

async function checkChromaConnection() {
    try {
        const res = await fetch(`${CHROMA_URL}/api/v2`);
        if (!res.ok) throw new Error(`Statut HTTP ${res.status}`);
        const data = await res.json();
        console.log("Connexion à ChromaDB réussie. Collections existantes :", data);
    } catch (err) {
        console.error("Erreur de connexion à ChromaDB :", err.message);
        process.exit(1);
    }
}

const llm = new ChatOllama({
    model: "gemma:2b",
    baseUrl: "http://127.0.0.1:11434",
    temperature: 0.3,
});

const promptTemplate = PromptTemplate.fromTemplate(`
Tu es un assistant pédagogique expert.
Utilise le contexte suivant pour répondre à la question de manière claire et pédagogique, soit explicite, et sourcée.

Instructions :
- Identifie les passages pertinents du contexte.
- Pour chaque information importante, indique la provenance en mentionnant le module, le titre du cours et le chapitre.
- Lorsque cela est possible, propose un lien officiel ou une source reconnue.

Contexte :
{context}

Question :
{question}
`);

function detectModuleInQuestion(question) {
    const modules = Object.keys(coursDwwm);
    return modules.find(module => question.toUpperCase().includes(module));
}

async function getHtmlTitle(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Page inaccessible");
        const html = await res.text();
        const $ = cheerio.load(html);
        return $("title").text().trim();
    } catch (err) {
        console.warn(`Erreur lors de la récupération du titre pour ${url} :`, err.message);
        return null;
    }
}

async function run() {
    await checkChromaConnection();
    const allSplits = [];

    for (const [module, coursList] of Object.entries(coursDwwm)) {
        for (const cours of coursList) {
            if (cache[cours.url]) {
                console.log(`Cours déjà dans le cache : ${cours.url}, passage...`);
                continue;
            }

            try {
                const loader = new CheerioWebBaseLoader(cours.url, { selector: "p" });
                const docs = await loader.load();

                if (!docs.length || !docs[0].pageContent.trim()) {
                    console.warn(`Contenu vide pour ${cours.url}`);
                    continue;
                }

                const title = await getHtmlTitle(cours.url);
                const splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: 1000,
                    chunkOverlap: 200,
                });

                const allChunks = await splitter.splitDocuments(docs);
                const enrichedDocs = allChunks.map((doc, i) => new Document({
                    pageContent: doc.pageContent,
                    metadata: {
                        source: cours.url,
                        courseTitle: cours.title,
                        htmlTitle: title || cours.title,
                        module: module,
                        chapter: `Chapitre ${i + 1}`,
                        page: i + 1,
                        description: cours.description,
                    },
                }));

                // 🔍 LOG : Affichage des métadonnées du premier chunk
                console.log("Exemple de métadonnées du premier chunk :", enrichedDocs[0].metadata);

                allSplits.push(...enrichedDocs);
                cache[cours.url] = true;
                console.log(`${enrichedDocs.length} documents ajoutés pour ${cours.url}`);
            } catch (err) {
                console.error(`Erreur de traitement pour ${cours.url} :`, err.message);
            }
        }
    }

    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
    console.log("Cache mis à jour.");

    const embeddings = new OllamaEmbeddings({
        model: "mxbai-embed-large",
        baseUrl: "http://127.0.0.1:11434",
    });

    const vectorStore = await Chroma.fromDocuments(allSplits, embeddings, {
        collectionName: "coursesDwwm",
        url: CHROMA_URL,
    });

    console.log("Documents ajoutés avec succès dans ChromaDB !");

    async function ragQuery(question) {
        try {
            const detectedModule = detectModuleInQuestion(question);
            console.log("Module détecté :", detectedModule ?? "aucun module détecté dans la question");

            const vectorStore = new Chroma(embeddings, {
                collectionName: "coursesDwwm",
                url: CHROMA_URL,
            });

            const retrievedDocs = await vectorStore.similaritySearch(question, 10);
            if (!retrievedDocs || retrievedDocs.length === 0) {
                console.warn("Aucun document pertinent trouvé.");
                return;
            }

            const filteredDocs = detectedModule
                ? retrievedDocs.filter(doc => doc.metadata.module === detectedModule)
                : retrievedDocs;

            const topDocs = filteredDocs.slice(0, 5);
            const context = topDocs.map(doc => `(${doc.metadata.module} - ${doc.metadata.courseTitle} - ${doc.metadata.chapter}) : ${doc.pageContent}`).join("\n\n");

            const formattedPrompt = await promptTemplate.format({
                context,
                question,
            });

            const response = await llm.invoke(formattedPrompt);
            if (!response || !response.content) {
                console.warn("Aucune réponse générée.");
                return;
            }
            console.log("Contexte utilisé pour la réponse :\n", context);
            console.log("Réponse générée :\n", response.content);
            return response.content;
        } catch (err) {
            console.error("Erreur pendant la génération RAG :", err.message);
        }
    }

    // Exemple de test
    const question = "explique moi comment fonctionne le mvc?";
    await ragQuery(question);
}

run();
