// script.js

// Configuration Spotify
const CLIENT_ID = '2a0f07a819f94f008a0d950fb8ea84ca'; // Remplacez par votre Client ID exact
const REDIRECT_URI = 'http://127.0.0.1:8080/'; // Doit correspondre exactement
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-top-read' // Pour lire les top artistes
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

// Fonction pour afficher les genres musicaux
async function displayGenres(token) {
    try {
        // Récupérer les top artistes
        const topArtists = await getTopArtists(token, 50, 'medium_term'); // Vous pouvez ajuster les paramètres

        // Agréger les genres
        const aggregatedGenres = aggregateGenres(topArtists);

        // Créer le Bubble Chart
        createGenreBubbleChart(aggregatedGenres);

        // Afficher le bouton de déconnexion et masquer le login
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('logout-button').classList.remove('d-none');
    } catch (error) {
        console.error(error);
        alert('Impossible de récupérer les genres. Veuillez vous reconnecter.');
    }
}

// Fonction pour récupérer les top artistes
async function getTopArtists(token, limit = 50, time_range = 'medium_term') {
    try {
        const response = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=${limit}&time_range=${time_range}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des top artistes');
        }

        const data = await response.json();
        return data.items.map(artist => ({
            name: artist.name,
            genres: artist.genres
        }));
    } catch (error) {
        console.error(error);
        alert('Impossible de récupérer les top artistes. Veuillez vous reconnecter.');
    }
}

// Fonction pour agréger les fréquences des genres
function aggregateGenres(topArtists) {
    const genreCounts = {};

    topArtists.forEach(artist => {
        artist.genres.forEach(genre => {
            if (genre in genreCounts) {
                genreCounts[genre] += 1;
            } else {
                genreCounts[genre] = 1;
            }
        });
    });

    // Convertir en tableau d'objets pour D3
    const aggregatedData = Object.keys(genreCounts).map(genre => ({
        name: genre,
        value: genreCounts[genre]
    }));

    // Trier par valeur décroissante
    aggregatedData.sort((a, b) => b.value - a.value);

    return aggregatedData;
}

// Fonction pour créer le Bubble Chart des Genres
function createGenreBubbleChart(data) {
    const container = document.getElementById('genre-bubble-chart');
    container.innerHTML = ''; // Nettoyer le conteneur existant si nécessaire
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select('#genre-bubble-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Créer une échelle de couleurs
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Créer une simulation de force
    const simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody().strength(5))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 2));

    // Créer des cercles pour chaque genre
    const nodes = data.map(d => ({
        ...d,
        radius: Math.sqrt(d.value) * 10 // Ajustez le multiplicateur selon vos besoins
    }));

    const node = svg.selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', d => d.radius)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .on('mouseover', function(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`<strong>${d.name}</strong><br/>Occurrences: ${d.value}`)
                .style('left', (event.pageX) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });

    // Ajouter un tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('text-align', 'center')
        .style('width', '120px')
        .style('height', '50px')
        .style('padding', '5px')
        .style('font', '12px sans-serif')
        .style('background', 'rgba(0,0,0,0.6)')
        .style('color', '#fff')
        .style('border', '0px')
        .style('border-radius', '8px')
        .style('pointer-events', 'none')
        .style('opacity', 0);

    simulation
        .nodes(nodes)
        .on('tick', () => {
            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        });

    // Ajouter un écouteur pour redimensionner le graphique
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        svg.attr('width', newWidth).attr('height', newHeight);
        simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
        simulation.alpha(1).restart();
    });
}

// Fonction pour se déconnecter
function logoutUser(userId) {
    // Récupérer les utilisateurs depuis localStorage
    let users = JSON.parse(localStorage.getItem('spotify_users')) || {};

    // Supprimer l'utilisateur spécifié
    delete users[userId];

    // Sauvegarder les utilisateurs mis à jour dans localStorage
    localStorage.setItem('spotify_users', JSON.stringify(users));

    // Mettre à jour le menu utilisateur
    populateUserSelect();

    // Si l'utilisateur déconnecté était sélectionné, nettoyer l'affichage
    const selectedUser = document.getElementById('user-select').value;
    if (selectedUser === userId) {
        document.getElementById('genre-bubble-chart').innerHTML = '';
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('logout-button').classList.add('d-none');
    }
}

// Fonction pour ajouter un utilisateur
function addUser() {
    const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&response_type=${RESPONSE_TYPE}&show_dialog=true&state=add_user`;
    window.location = authUrl;
}

// Fonction pour gérer l'état après l'authentification
async function handleAuth() {
    const { access_token, expires_in } = getTokenFromUrl();

    if (access_token) {
        // Récupérer les informations utilisateur
        const userProfile = await fetchUserProfile(access_token);
        if (userProfile) {
            const userId = userProfile.id;
            const userName = userProfile.display_name || userProfile.id;

            // Stocker l'utilisateur dans localStorage
            let users = JSON.parse(localStorage.getItem('spotify_users')) || {};
            users[userId] = {
                access_token: access_token,
                name: userName,
                expires_at: Date.now() + expires_in * 1000
            };
            localStorage.setItem('spotify_users', JSON.stringify(users));

            // Mettre à jour le menu utilisateur
            populateUserSelect();

            // Si l'authentification était pour ajouter un utilisateur, sélectionner ce nouvel utilisateur
            const state = new URLSearchParams(window.location.search).get('state');
            if (state === 'add_user') {
                document.getElementById('user-select').value = userId;
                displayGenres(access_token);
            }
        }
    }
}

// Fonction pour récupérer le profil utilisateur
async function fetchUserProfile(token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération du profil utilisateur');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        alert('Impossible de récupérer le profil utilisateur.');
    }
}

// Fonction pour peupler le menu utilisateur
function populateUserSelect() {
    const userSelect = document.getElementById('user-select');
    userSelect.innerHTML = '<option value="" disabled selected>Choisir un utilisateur</option>';

    const users = JSON.parse(localStorage.getItem('spotify_users')) || {};

    for (const userId in users) {
        const option = document.createElement('option');
        option.value = userId;
        option.textContent = users[userId].name;
        userSelect.appendChild(option);
    }
}

// Fonction pour gérer la sélection d'un utilisateur
function handleUserSelection() {
    const userSelect = document.getElementById('user-select');
    const selectedUserId = userSelect.value;

    if (selectedUserId) {
        const users = JSON.parse(localStorage.getItem('spotify_users')) || {};
        const user = users[selectedUserId];

        if (user) {
            // Vérifier si le token a expiré
            if (Date.now() > user.expires_at) {
                alert('Le token d\'accès a expiré. Veuillez vous reconnecter.');
                logoutUser(selectedUserId);
                return;
            }

            displayGenres(user.access_token);
        }
    }
}

// Fonction pour gérer la déconnexion
function handleLogout() {
    const userSelect = document.getElementById('user-select');
    const selectedUserId = userSelect.value;

    if (selectedUserId) {
        logoutUser(selectedUserId);
    }
}

// Initialisation après le chargement du DOM
document.addEventListener("DOMContentLoaded", () => {
    handleAuth(); // Gérer l'authentification si redirigé après login

    // Peupler le menu utilisateur
    populateUserSelect();

    // Ajouter les événements de clic
    document.getElementById('add-user-button').addEventListener('click', addUser);
    document.getElementById('logout-button').addEventListener('click', handleLogout);
    document.getElementById('user-select').addEventListener('change', handleUserSelection);
});
