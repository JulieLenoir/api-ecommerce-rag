async function deleteChromaCollection() {
    const url = 'http://localhost:8000/api/v2/coursesDwwm';  // URL de l'API de suppression de la collection

    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            console.log("Collection 'coursesDwwm' supprimée avec succès !");
        } else {
            console.error("Erreur lors de la suppression de la collection :", response.statusText);
        }
    } catch (err) {
        console.error("Erreur lors de la suppression de la collection :", err.message);
    }
}

deleteChromaCollection();
