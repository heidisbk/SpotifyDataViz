// script.js

// Configuration Spotify
const CLIENT_ID = '2a0f07a819f94f008a0d950fb8ea84ca'; // Remplacez par votre Client ID exact
const REDIRECT_URI = 'http://127.0.0.1:8080/'; // Doit correspondre exactement
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-top-read' // Pour lire les top tracks et artistes
];

// Fonction pour obtenir le token d'accès depuis l'URL
function getTokenFromUrl() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return {
        access_token: params.get('access_token'),
        token_type: params.get('token_type'),
        expires_in: params.get('expires_in')
    };
}

// Fonction pour afficher les top 5 tracks
async function displayTopTracks(token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=5', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des top tracks');
        }

        const data = await response.json();
        const topTracks = data.items.map(track => ({
            name: track.name,
            artist: track.artists.map(artist => artist.name).join(', '),
            album: track.album.name,
            popularity: track.popularity,
            url: track.external_urls.spotify,
            cover: track.album.images[0]?.url || ''
        }));

        const topTracksList = document.getElementById('top-tracks-list');
        topTracksList.innerHTML = ''; // Réinitialiser la liste

        topTracks.forEach(track => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item');
            listItem.innerHTML = `
                <img src="${track.cover}" alt="Cover">
                <div>
                    <a href="${track.url}" target="_blank" class="text-success text-decoration-none"><strong>${track.name}</strong></a>
                    <p>par ${track.artist}</p>
                    <p>Popularité: ${track.popularity}</p>
                </div>
            `;
            topTracksList.appendChild(listItem);
        });

        // Afficher la section des tracks et masquer le login
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('tracks-section').style.display = 'block';
    } catch (error) {
        console.error(error);
        alert('Impossible de récupérer les top tracks. Veuillez vous reconnecter.');
    }
}

// Fonction pour se déconnecter
function logout() {
    // Supprimer le token de l'URL
    window.location.hash = '';
    // Supprimer le token du stockage local
    localStorage.removeItem('spotify_access_token');
    // Afficher le bouton de login et masquer les tracks
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('tracks-section').style.display = 'none';
}

// Fonction pour créer un cercle avec D3.js
function createCircleGraph(graphId) {
    const svg = d3.select(`#${graphId}`)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const circle = svg.append("circle")
        .attr("cx", 50)
        .attr("cy", 50)
        .attr("r", 30)
        .attr("fill", "var(--spotify-green)");

    // Animation simple avec D3.js
    circle.transition()
        .duration(2000)
        .attr("cx", 150)
        .attr("cy", 50)
        .attr("r", 50)
        .attr("fill", "#1ed760")
        .transition()
        .duration(2000)
        .attr("cx", 50)
        .attr("cy", 50)
        .attr("r", 30)
        .attr("fill", "var(--spotify-green)");
}

// Initialisation après le chargement du DOM
document.addEventListener("DOMContentLoaded", () => {
    const { access_token } = getTokenFromUrl();
    window.location.hash = ''; // Nettoyer l'URL

    if (access_token) {
        // Stocker le token dans le localStorage pour persistance
        localStorage.setItem('spotify_access_token', access_token);
        displayTopTracks(access_token);
    } else {
        // Vérifier si un token est déjà stocké
        const storedToken = localStorage.getItem('spotify_access_token');
        if (storedToken) {
            displayTopTracks(storedToken);
        }
    }

    // Ajouter l'événement de clic au bouton de login
    document.getElementById('login-button').addEventListener('click', () => {
        const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&response_type=${RESPONSE_TYPE}&show_dialog=true`;
        window.location = authUrl;
    });

    // Ajouter l'événement de clic au bouton de logout
    document.getElementById('logout-button').addEventListener('click', logout);

    // Créer 5 cercles pour les graphes D3.js
    for (let i = 1; i <= 5; i++) {
        createCircleGraph(`graph${i}`);
    }
});
