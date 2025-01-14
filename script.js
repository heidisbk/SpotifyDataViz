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

// Mapping des artistes à leurs pays d'origine (manuel)
const artistCountryMap = {
    "The Beatles": "United Kingdom",
    "Taylor Swift": "United States",
    "Ed Sheeran": "United Kingdom",
    "BTS": "South Korea",
    "Shakira": "Colombia",
    "Beyoncé": "United States",
    "Adele": "United Kingdom",
    "Drake": "Canada",
    "Bad Bunny": "Puerto Rico",
    "Booba": "France",
    "SCH": "France",
    "Rounhaa": "France",
    "Gazo": "France",
    "FEMTOGO": "France",
    "Green Montana": "France",
    "La Fève": "France",
    "Jwles": "France",
    "Dalí": "France",
    "Prince": "United States",
    "Jazzy Bazz": "France",
    "Mad Keys": "United States",
    "The Smiths": "United Kingdom",
    "JeanJass": "Belgium",
    "Billie Eilish": "United States",
    "Queen": "United Kingdom",
    "Alpha Wann": "France",
    "Tyler, The Creator": "United States",
    "Krisy": "Belgium",
    "Yamê": "France",
    "Ajna": "France",
    "Prince Waly": "France",
    "Jungle Jack": "France",
    "Jimi Hendrix": "United States",
    "Kodak Black": "United States",
    "Hamza": "Belgium",
    "ISHA": "Belgium",
    "The Weeknd": "Canada",
    "PARTYNEXTDOOR": "Canada",
    "SZA": "United States",
    "Cash Cobain": "United States",
    "21 Savage": "United States",
    "Metro Boomin": "United States",
    "Future": "United States",
    "Lil Uzi Vert": "United States",
    "070 Shake": "United States",
    // Ajoutez d'autres artistes ici
};

// Variables pour Chart.js
let chartInstance1, radarInstance1;
let chartInstance2, radarInstance2;

// Variables pour les nouveaux graphiques (Chart.js)
let currentDataSet1 = "Clarence"; // Default dataset for graph1
let rawDataChart1 = [];
let groupedDataChart1 = { daily: {}, weekly: {}, monthly: {} };

let currentDataSet2 = "Clarence"; // Default dataset for graph2
let rawDataChart2 = [];
let groupedDataChart2 = { daily: {}, weekly: {}, monthly: {} };

// Data sources pour les graphiques
const dataSources = {
    Clarence: [
        "https://raw.githubusercontent.com/heidisbk/SpotifyDataViz/refs/heads/main/data/clarence/StreamingHistory_music_1.json",
        "https://raw.githubusercontent.com/heidisbk/SpotifyDataViz/refs/heads/main/data/clarence/StreamingHistory_music_0.json"
    ],
    Heidi: [
        "https://raw.githubusercontent.com/heidisbk/SpotifyDataViz/refs/heads/main/data/heidi/StreamingHistory_music_0.json",
        "https://raw.githubusercontent.com/heidisbk/SpotifyDataViz/refs/heads/main/data/heidi/StreamingHistory_music_1.json",
        "https://raw.githubusercontent.com/heidisbk/SpotifyDataViz/refs/heads/main/data/heidi/StreamingHistory_music_2.json",
        "https://raw.githubusercontent.com/heidisbk/SpotifyDataViz/refs/heads/main/data/heidi/StreamingHistory_music_3.json"
    ]
};

// Fonction pour obtenir le token d'accès depuis l'URL
function getTokenFromUrl() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return {
        access_token: params.get('access_token'),
        token_type: params.get('token_type'),
        expires_in: params.get('expires_in'),
        state: params.get('state') // Ajout du state
    };
}

// Fonction pour afficher les genres et la carte du monde
async function displayGenres(token) {
    try {
        // Récupérer les top artistes
        const topArtists = await getTopArtists(token, 50, 'medium_term'); // Ajustez les paramètres si nécessaire

        // Agréger les genres
        const aggregatedGenres = aggregateGenres(topArtists);

        // Créer le Bubble Chart dans graph3
        createGenreBubbleChart(aggregatedGenres);

        // Agréger les pays des artistes
        const aggregatedCountries = aggregateArtistCountries(topArtists);

        // Créer la carte du monde dans graph5
        createWorldMap(aggregatedCountries);

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

// Fonction pour agréger les genres
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

// Fonction pour agréger les pays des artistes
function aggregateArtistCountries(topArtists) {
    const countryCounts = {};

    topArtists.forEach(artist => {
        const country = artistCountryMap[artist.name];
        if (country) {
            if (country in countryCounts) {
                countryCounts[country] += 1;
            } else {
                countryCounts[country] = 1;
            }
        } else {
            // Optionnel : Compter les artistes sans pays défini
            if ('Unknown' in countryCounts) {
                countryCounts['Unknown'] += 1;
            } else {
                countryCounts['Unknown'] = 1;
            }
        }
    });

    return countryCounts;
}

// Fonction pour créer le Bubble Chart dans graph3
function createGenreBubbleChart(data) {
    const container = document.getElementById('graph3'); // Changement de cible
    container.innerHTML = ''; // Nettoyer le conteneur existant
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(container)
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
        .attr('fill', 'rgba(29, 185, 84, 0.2)')
        .attr('stroke', '#1DB954')
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

// Fonction pour créer la Carte du Monde dans graph5
function createWorldMap(artistCountries) {
    const container = document.getElementById('graph5');
    container.innerHTML = ''; // Nettoyer le conteneur existant
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Définir la projection et le générateur de chemins
    const projection = d3.geoNaturalEarth1() // Projection ajustée pour un meilleur fit
        .scale((width / 2 / Math.PI))
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Définir l'échelle de couleurs
    const color = d3.scaleSequential(d3.interpolateBlues)
        .interpolator(d3.interpolateRgb("#FFFFFF","#0b8f39"))
        .domain([0, d3.max(Object.values(artistCountries))]);

    // Tooltip
    const tooltipMap = d3.select('body').append('div')
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

    // Charger les données GeoJSON pour le monde
    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson').then(worldData => {
        // Dessiner la carte
        svg.append('g')
            .selectAll('path')
            .data(worldData.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', d => {
                const countryName = d.properties.name;
                const count = artistCountries[countryName] || 0;
                return count > 0 ? color(count) : '#ccc';
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5)
            .on('mouseover', function(event, d) {
                const countryName = d.properties.name;
                const count = artistCountries[countryName] || 0;
                tooltipMap.transition()
                    .duration(200)
                    .style('opacity', 0.9);
                tooltipMap.html(`<strong>${countryName}</strong><br/>Artistes: ${count}`)
                    .style('left', (event.pageX) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                tooltipMap.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Légende
        const legendWidth = 300;
        const legendHeight = 10;

        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - legendWidth - 20}, ${height - 40})`);

        // Créer un dégradé pour la légende
        const defs = svg.append('defs');

        const linearGradient = defs.append('linearGradient')
            .attr('id', 'linear-gradient');

        linearGradient.selectAll('stop')
            .data([
                {offset: '0%', color: color.range()[0]},
                {offset: '100%', color: color.range()[1]}
            ])
            .enter()
            .append('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color);

        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#linear-gradient)');

        // Définir l'échelle pour l'axe des X de la légende
        const legendScale = d3.scaleLinear()
            .domain(color.domain())
            .range([0, legendWidth]);

        // Définir et ajouter l'axe des X à la légende
        const legendAxis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d3.format('d'));

        legend.append('g')
            .attr('transform', `translate(0, ${legendHeight})`)
            .call(legendAxis);
    });

    // Gérer le redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        svg.attr('width', newWidth).attr('height', newHeight);
        projection
            .scale((newWidth / 2 / Math.PI))
            .translate([newWidth / 2, newHeight / 2]);
        svg.selectAll('path').attr('d', path);

        // Mettre à jour la légende
        svg.select('.legend')
            .attr('transform', `translate(${newWidth - legendWidth - 20}, ${newHeight - 40})`);
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
        document.getElementById('graph1').querySelector('#chartCanvas1')?.remove(); // Nettoyer le chartCanvas1
        document.getElementById('radarGraph1').innerHTML = ''; // Nettoyer le radar graph1
        document.getElementById('graph2').querySelector('#chartCanvas2')?.remove(); // Nettoyer le chartCanvas2
        document.getElementById('radarGraph2').innerHTML = ''; // Nettoyer le radar graph2
        document.getElementById('graph3').innerHTML = ''; // Nettoyer le bubble chart
        document.getElementById('graph5').innerHTML = ''; // Nettoyer la carte du monde
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
    const { access_token, expires_in, state } = getTokenFromUrl();
    console.log('Access Token:', access_token);
    console.log('Expires In:', expires_in);
    console.log('State:', state);

    if (access_token) {
        // Récupérer les informations utilisateur
        const userProfile = await fetchUserProfile(access_token);
        console.log('User Profile:', userProfile);
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

    // Ajouter les événements pour graph1 (Top Artistes)
    document.getElementById('clarenceButton1').addEventListener('click', () => loadData1("Clarence"));
    document.getElementById('heidiButton1').addEventListener('click', () => loadData1("Heidi"));

    // Ajouter les événements pour graph2 (Top Tracks)
    document.getElementById('clarenceButton2').addEventListener('click', () => loadData2("Clarence"));
    document.getElementById('heidiButton2').addEventListener('click', () => loadData2("Heidi"));
});

// Fonctions pour graph1 (Top Artistes)

// Fonction pour charger les données pour graph1
function loadData1(dataset) {
    currentDataSet1 = dataset;
    groupedDataChart1 = { daily: {}, weekly: {}, monthly: {} }; // Reset grouped data
    const urls = dataSources[dataset];

    Promise.all(urls.map(url => fetch(url).then(response => response.json())))
        .then(responses => {
            rawDataChart1 = responses.flat();
            processDataChart1();
            populatePeriodSelectorChart1();
            //alert(`Loaded data for ${dataset}`);
        })
        .catch(err => {
            console.error("Error loading data:", err);
            alert("Échec du chargement des données. Veuillez consulter la console pour plus de détails.");
        });
}

// Fonction pour traiter les données pour graph1
function processDataChart1() {
    rawDataChart1.forEach(entry => {
        const artist = entry.artistName;
        const msPlayed = entry.msPlayed;
        const date = new Date(entry.endTime);
        const day = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const week = `${date.getFullYear()}-W${getWeek(date)}`; // YYYY-W##
        const month = `${date.getFullYear()}-${date.getMonth() + 1}`; // YYYY-MM

        // Group by day
        if (!groupedDataChart1.daily[day]) groupedDataChart1.daily[day] = {};
        if (!groupedDataChart1.daily[day][artist]) groupedDataChart1.daily[day][artist] = 0;
        groupedDataChart1.daily[day][artist] += msPlayed;

        // Group by week
        if (!groupedDataChart1.weekly[week]) groupedDataChart1.weekly[week] = {};
        if (!groupedDataChart1.weekly[week][artist]) groupedDataChart1.weekly[week][artist] = 0;
        groupedDataChart1.weekly[week][artist] += msPlayed;

        // Group by month
        if (!groupedDataChart1.monthly[month]) groupedDataChart1.monthly[month] = {};
        if (!groupedDataChart1.monthly[month][artist]) groupedDataChart1.monthly[month][artist] = 0;
        groupedDataChart1.monthly[month][artist] += msPlayed;
    });
}

// Fonction pour peupler le sélecteur de période pour graph1
function populatePeriodSelectorChart1() {
    const periodSelector = document.getElementById('periodSelector1');
    const dateSelector = document.getElementById('dateSelector1');
    
    periodSelector.addEventListener('change', function() {
        const period = periodSelector.value;
        dateSelector.innerHTML = '<option value="">Choisir une période</option>'; // Clear options

        if (groupedDataChart1[period]) {
            Object.keys(groupedDataChart1[period]).sort().forEach(periodKey => {
                const option = document.createElement('option');
                option.value = periodKey;
                option.textContent = periodKey;
                dateSelector.appendChild(option);
            });
        }

        // Update chart automatically if a period is selected
        updateChart1();
    });

    // Add listener for date selection
    dateSelector.addEventListener('change', updateChart1);

    // Initial population for the daily period
    periodSelector.dispatchEvent(new Event('change'));
}

// Fonction pour mettre à jour le graphique1 en fonction de la sélection
function updateChart1() {
    const periodSelector = document.getElementById('periodSelector1');
    const dateSelector = document.getElementById('dateSelector1');
    const selectedPeriod = periodSelector.value;
    const selectedPeriodKey = dateSelector.value;

    if (!selectedPeriod || !selectedPeriodKey || !groupedDataChart1[selectedPeriod][selectedPeriodKey]) {
        //alert("Choisir une période valide.");
        return;
    }

    const artistData = groupedDataChart1[selectedPeriod][selectedPeriodKey];
    const topArtists = Object.entries(artistData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const labels = topArtists.map(item => item[0]);
    const data = topArtists.map(item => (item[1] / (1000 * 60 * 60)).toFixed(2)); // Convert ms to hours

    renderChart1(labels, data, selectedPeriodKey);
}

// Fonction pour rendre le graphique1 en barres (Chart.js)
function renderChart1(labels, data, period) {
    const ctx = document.getElementById('chartCanvas1').getContext('2d');

    if (chartInstance1) {
        chartInstance1.destroy();
    }

    chartInstance1 = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: 'rgba(29, 185, 84, 0.2)', // Couleur de fond translucide
                borderColor: '#1DB954', // Couleur de bordure
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y', // Set labels on the vertical axis
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const artist = labels[elements[0].index];
                    renderRadarChart1(artist);
                }
            },
            scales: {
                x: { display: false },
                y: {
                    title: {
                        display: true,
                        text: 'Artistes'
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const durationMs = tooltipItem.raw * 60 * 60 * 1000; // Convertit l'heure en millisecondes
                            return `${formatDuration(durationMs)}`;
                        }
                    }
                }
            }
        }
    });
}

// Fonction pour rendre le graphique radar1 (Chart.js)
function renderRadarChart1(artist) {
    const artistData = rawDataChart1.filter(entry => entry.artistName === artist);
    const monthlyData = {};

    artistData.forEach(entry => {
        const date = new Date(entry.endTime);
        const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const msPlayed = entry.msPlayed;

        if (!monthlyData[month]) monthlyData[month] = 0;
        monthlyData[month] += msPlayed;
    });

    const labels = Object.keys(monthlyData).sort();
    const data = Object.values(monthlyData).map(ms => (ms / (1000 * 60 * 60)).toFixed(2)); // Convert ms to hours

    // Clear existing radar graph1
    const radarGraphDiv = document.getElementById('radarGraph1');
    radarGraphDiv.innerHTML = '';

    // Create radar chart canvas
    const radarCanvas = document.createElement('canvas');
    radarGraphDiv.appendChild(radarCanvas);

    const radarCtx = radarCanvas.getContext('2d');

    radarInstance1 = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                label: artist,
                data,
                fill: true,
                backgroundColor: 'rgba(29, 185, 84, 0.2)', // Couleur de remplissage translucide
                borderColor: '#1DB954', // Couleur de bordure
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    min: 0,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatDuration(value * 60 * 60 * 1000); // Convert hours to ms
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const durationMs = tooltipItem.raw * 60 * 60 * 1000; // Convertit l'heure en millisecondes
                            return `${formatDuration(durationMs)}`;
                        }
                    }
                }
            }
        }
    });
}

// Fonctions pour graph2 (Top Tracks)

// Fonction pour charger les données pour graph2
function loadData2(dataset) {
    currentDataSet2 = dataset;
    groupedDataChart2 = { daily: {}, weekly: {}, monthly: {} }; // Reset grouped data
    const urls = dataSources[dataset];

    Promise.all(urls.map(url => fetch(url).then(response => response.json())))
        .then(responses => {
            rawDataChart2 = responses.flat();
            processDataChart2();
            populatePeriodSelectorChart2();
            //alert(`Loaded data for ${dataset}`);
        })
        .catch(err => {
            console.error("Error loading data:", err);
            alert("Échec du chargement des données. Veuillez consulter la console pour plus de détails.");
        });
}

// Fonction pour traiter les données pour graph2
function processDataChart2() {
    rawDataChart2.forEach(entry => {
        const track = entry.trackName;
        const artist = entry.artistName; // Correct field for artist
        const msPlayed = entry.msPlayed;
        const date = new Date(entry.endTime);
        const day = date.toISOString().split('T')[0];
        const week = `${date.getFullYear()}-W${getWeek(date)}`;
        const month = `${date.getFullYear()}-${date.getMonth() + 1}`;

        if (!groupedDataChart2.daily[day]) groupedDataChart2.daily[day] = {};
        if (!groupedDataChart2.daily[day][track]) groupedDataChart2.daily[day][track] = { msPlayed, artist };
        groupedDataChart2.daily[day][track].msPlayed += msPlayed;

        if (!groupedDataChart2.weekly[week]) groupedDataChart2.weekly[week] = {};
        if (!groupedDataChart2.weekly[week][track]) groupedDataChart2.weekly[week][track] = { msPlayed, artist };
        groupedDataChart2.weekly[week][track].msPlayed += msPlayed;

        if (!groupedDataChart2.monthly[month]) groupedDataChart2.monthly[month] = {};
        if (!groupedDataChart2.monthly[month][track]) groupedDataChart2.monthly[month][track] = { msPlayed, artist };
        groupedDataChart2.monthly[month][track].msPlayed += msPlayed;
    });
}

// Fonction pour peupler le sélecteur de période pour graph2
function populatePeriodSelectorChart2() {
    const periodSelector = document.getElementById('periodSelector2');
    const dateSelector = document.getElementById('dateSelector2');
    
    periodSelector.addEventListener('change', function() {
        const period = periodSelector.value;
        dateSelector.innerHTML = '<option value="">Choisir une période</option>'; // Clear options

        if (groupedDataChart2[period]) {
            Object.keys(groupedDataChart2[period]).sort().forEach(periodKey => {
                const option = document.createElement('option');
                option.value = periodKey;
                option.textContent = periodKey;
                dateSelector.appendChild(option);
            });
        }

        // Update chart automatically if a period is selected
        updateChart2();
    });

    // Add listener for date selection
    dateSelector.addEventListener('change', updateChart2);

    // Initial population for the daily period
    periodSelector.dispatchEvent(new Event('change'));
}

// Fonction pour mettre à jour le graphique2 en fonction de la sélection
function updateChart2() {
    const periodSelector = document.getElementById('periodSelector2');
    const dateSelector = document.getElementById('dateSelector2');
    const selectedPeriod = periodSelector.value;
    const selectedPeriodKey = dateSelector.value;

    if (!selectedPeriod || !selectedPeriodKey || !groupedDataChart2[selectedPeriod][selectedPeriodKey]) {
        //alert("Choisir une période valide.");
        return;
    }

    const trackData = groupedDataChart2[selectedPeriod][selectedPeriodKey];
    const topTracks = Object.entries(trackData)
        .sort((a, b) => b[1].msPlayed - a[1].msPlayed)
        .slice(0, 10);

    const labels = topTracks.map(item => item[0]);
    const data = topTracks.map(item => item[1].msPlayed); // Raw msPlayed for conversion
    const artists = topTracks.map(item => item[1].artist); // Extract artist names

    renderChart2(labels, data, artists, selectedPeriodKey);
}

// Fonction pour rendre le graphique2 en pie (Chart.js)
function renderChart2(labels, data, artists, period) {
    const ctx = document.getElementById('chartCanvas2').getContext('2d');

    if (chartInstance2) {
        chartInstance2.destroy();
    }

    chartInstance2 = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                label: `Top 10 Tracks in ${period}`,
                data,
                backgroundColor: labels.map(() => `rgba(29, 185, 84, 0.2)`), // Couleur translucide
                borderColor: '#1DB954', // Couleur de bordure
                borderWidth: 1,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            const ms = tooltipItem.raw;
                            const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                            const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
                            const seconds = Math.floor((ms % (60 * 1000)) / 1000);
                            const trackIndex = tooltipItem.dataIndex;
                            const artist = artists[trackIndex];
                            
                            return `${artist} - ${hours}h ${minutes}m ${seconds}s`;
                        }
                    }
                },
                legend: {
                    position: 'right' // Position the legend to the right
                }
            }
        }
    });
}

// Fonction pour rendre le graphique radar2 (Chart.js)
function renderRadarChart2(artist) {
    const artistData = rawDataChart2.filter(entry => entry.artistName === artist);
    const monthlyData = {};

    artistData.forEach(entry => {
        const date = new Date(entry.endTime);
        const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const msPlayed = entry.msPlayed;

        if (!monthlyData[month]) monthlyData[month] = 0;
        monthlyData[month] += msPlayed;
    });

    const labels = Object.keys(monthlyData).sort();
    const data = Object.values(monthlyData).map(ms => (ms / (1000 * 60 * 60)).toFixed(2)); // Convert ms to hours

    // Clear existing radar graph2
    const radarGraphDiv = document.getElementById('radarGraph2');
    radarGraphDiv.innerHTML = '';

    // Create radar chart canvas
    const radarCanvas = document.createElement('canvas');
    radarGraphDiv.appendChild(radarCanvas);

    const radarCtx = radarCanvas.getContext('2d');

    radarInstance2 = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                label: artist,
                data,
                fill: true,
                backgroundColor: 'rgba(29, 185, 84, 0.2)', // Couleur de remplissage translucide
                borderColor: '#1DB954', // Couleur de bordure
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    min: 0,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatDuration(value * 60 * 60 * 1000); // Convert hours to ms
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const durationMs = tooltipItem.raw * 60 * 60 * 1000; // Convertit l'heure en millisecondes
                            return `${formatDuration(durationMs)}`;
                        }
                    }
                }
            }
        }
    });
}

// Fonctions communes

// Helper function to get ISO week number
function getWeek(date) {
    const firstJan = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date - firstJan) / (24 * 60 * 60 * 1000));
    return Math.ceil((dayOfYear + firstJan.getDay() + 1) / 7);
}

// Fonction pour formater la durée
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    return `${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}




















let currentDataSet = "Clarence"; // Default dataset
    let rawData = [];
    let groupedData = { daily: {}, weekly: {}, monthly: {} };
    let chartInstance, radarInstance;

document.getElementById('clarenceButton').addEventListener('click', () => loadData("Clarence"));
document.getElementById('heidiButton').addEventListener('click', () => loadData("Heidi"));


        let allData = [];
        const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
        const weeks = Array.from({ length: 5 }, (_, i) => `Semaine ${i + 1}`);
        const hours = Array.from({ length: 24 }, (_, i) => i);

        const tooltip = d3.select(".tooltip");
        const heatmapContainer = d3.select("#heatmap");

      
      
async function loadData(user) {
    try {
        const files = dataSources[user]; // Obtenir les fichiers pour l'utilisateur
        const dataArrays = await Promise.all(files.map(url => fetch(url).then(resp => resp.json())));
        allData = dataArrays.flat();
        console.log("Données chargées :", allData);
        initVisualization();
        populateMonths(allData);
        const selectedMonth = getSelectedMonth();
        if (selectedMonth) {
            const filteredData = getDataByMonth(allData, selectedMonth);
            updateHeatmap(filteredData, selectedMonth);
        }
    } catch (error) {
        console.error("Erreur de chargement des données :", error);
    }
}

      
      
        // Initialisation de la visualisation
        function initVisualization() {
            const select = d3.select("#visualization-type");
            select.on("change", () => updateHeatmap(select.node().value));

            // Charger la première visualisation par défaut
            select.dispatch("change");
        }

       function updateHeatmap(data, selectedMonth) {
    const type = d3.select("#visualization-type").node().value;

    heatmapContainer.html(''); // Vider la heatmap existante

    if (type === "monthly") {
        // Agréger les données par mois (statique)
        const aggregatedData = aggregateDataByMonthAverage(data);
        createMonthlyHeatmap(aggregatedData);
    } else if (type === "weekly") {
        // Filtrer les données pour le mois sélectionné, puis agréger par semaine
        const filteredData = getDataByMonth(data, selectedMonth);
        const aggregatedData = aggregateWeeklyData(filteredData);
        createWeeklyHeatmap(aggregatedData, selectedMonth);
    } else if (type === "daily") {
        // Filtrer les données pour le mois sélectionné, puis agréger par jour et heure
        const filteredData = getDataByMonth(data, selectedMonth);
        const aggregatedData = aggregateDailyData(filteredData);
        createDailyHeatmap(aggregatedData, selectedMonth);
    }
}

        // Remplir la liste des mois
        function populateMonths(data) {
            const months = new Set(
                data.map(entry => new Date(entry.endTime).toISOString().slice(0, 7)) // YYYY-MM format
            );

            const monthSelect = d3.select("#month-select");
            monthSelect
                .selectAll("option")
                .data([...months].sort())
                .join("option")
                .attr("value", d => d)
                .text(d => d);

            monthSelect.on("change", () => {
                const selectedMonth = getSelectedMonth();
                const filteredData = getDataByMonth(allData, selectedMonth);
                updateHeatmap(filteredData, selectedMonth);
            });
        }

        // Récupérer le mois sélectionné
        function getSelectedMonth() {
            return d3.select("#month-select").node().value;
        }

        // Filtrer les données par mois
        function getDataByMonth(data, month) {
            return data.filter(entry => new Date(entry.endTime).toISOString().slice(0, 7) === month);
        }

        // Agréger les données par jour et heure
        function aggregateDailyData(data) {
            const aggregated = {};
            data.forEach(entry => {
                const date = new Date(entry.endTime);
                const day = date.getDay(); // 0 = Dimanche → 6 = Samedi
                const hour = date.getHours(); // Heure de la journée
                const key = `${day}-${hour}`;

                if (!aggregated[key]) {
                    aggregated[key] = 0;
                }
                aggregated[key] += entry.msPlayed;
            });

            return days.map((day, dIndex) =>
                hours.map(hour => ({
                    day,
                    hour,
                    value: aggregated[`${dIndex}-${hour}`] || 0
                }))
            ).flat();
        }

        // Créer la heatmap quotidienne
        function createDailyHeatmap(data, selectedMonth) {
            createHeatmap(data, hours, days, (d) => ({
                x: d.hour,
                y: d.day,
                value: d.value
            }));
        }

        // Agréger les données par semaine
        function aggregateWeeklyData(data) {
            const aggregated = {};
            data.forEach(entry => {
                const date = new Date(entry.endTime);
                const week = Math.floor((date.getDate() - 1) / 7); // 0-based week index
                const day = date.getDay() === 0 ? 6 : date.getDay() - 1; // 0 = Dimanche → 6
                const key = `${week}-${day}`;

                if (!aggregated[key]) {
                    aggregated[key] = 0;
                }
                aggregated[key] += entry.msPlayed;
            });

            return weeks.flatMap((week, wIndex) =>
                days.map((day, dIndex) => ({
                    week,
                    day,
                    value: aggregated[`${wIndex}-${dIndex}`] || 0
                }))
            );
        }

        // Créer la heatmap hebdomadaire
        function createWeeklyHeatmap(data, selectedMonth) {
            createHeatmap(data, weeks, days, (d) => ({
                x: d.week,
                y: d.day,
                value: d.value
            }));
        }

      
         function aggregateDataByMonthAverage(data) {
            const aggregated = {};
            data.forEach(entry => {
                const date = new Date(entry.endTime);
                const month = date.toISOString().slice(0, 7); // Format YYYY-MM
                if (!aggregated[month]) {
                    aggregated[month] = { totalMs: 0, dayCount: new Set() };
                }
                aggregated[month].totalMs += entry.msPlayed;
                aggregated[month].dayCount.add(date.getDate());
            });
            return Object.entries(aggregated).map(([month, { totalMs, dayCount }]) => ({
                month,
                averageMs: totalMs / dayCount.size
            }));
                      // Charger la première visualisation par défaut
            select.dispatch("change");
        }    
      
// Créer la heatmap mensuelle
function createMonthlyHeatmap(data) {
    const margin = { top: 50, right: 20, bottom: 50, left: 100 };
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    heatmapContainer.selectAll("*").remove(); // Vider la heatmap existante

    const svg = heatmapContainer.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(data.map(d => d.month)) // Utiliser tous les mois
        .range([0, width])
        .padding(0.05);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(data, d => d.averageMs)]); // Définir l'échelle de couleurs

    // Créer les rectangles pour la heatmap
    svg.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", d => xScale(d.month))
        .attr("y", 0)
        .attr("width", xScale.bandwidth())
        .attr("height", height / 2)
        .attr("fill", d => colorScale(d.averageMs)) // Appliquer la couleur en fonction de la moyenne
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 10 + "px")
                .html(`Mois : ${d.month}<br>Moyenne : ${Math.round(d.averageMs / 1000)}s`);
        })
        .on("mouseout", () => tooltip.style("display", "none"));


}
        // Créer une heatmap générique
        function createHeatmap(data, xDomain, yDomain, accessor) {
            const margin = { top: 30, right: 30, bottom: 40, left: 40 };
            const width = 800 - margin.left - margin.right;
            const height = 400 - margin.top - margin.bottom;

            const svg = heatmapContainer
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scaleBand()
                .domain(xDomain)
                .range([0, width])
                .padding(0.05);

            const y = yDomain ? d3.scaleBand().domain(yDomain).range([0, height]).padding(0.05) : null;

            const color = d3.scaleSequential(d3.interpolateYlGnBu)
                .domain([0, d3.max(data, (d) => accessor(d).value)]);

            svg.selectAll(".x-axis")
                .data(xDomain)
                .enter()
                .append("text")
                .attr("x", (d, i) => x(d) + x.bandwidth() / 2)
                .attr("y", -5)
                .style("text-anchor", "middle")
                .text(d => d);

            svg.selectAll(".y-axis")
                .data(yDomain || [])
                .enter()
                .append("text")
                .attr("x", -5)
                .attr("y", (d, i) => y(d) + y.bandwidth() / 2)
                .style("text-anchor", "middle")
                .text(d => d);

            svg.selectAll(".cell")
                .data(data)
                .enter()
                .append("rect")
                .attr("x", (d) => x(accessor(d).x))
                .attr("y", (d) => y ? y(accessor(d).y) : 0)
                .attr("width", x.bandwidth())
                .attr("height", y ? y.bandwidth() : height)
                .style("fill", (d) => color(accessor(d).value))
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("display", "block");
                    tooltip.html(`${accessor(d).value} ms`)
                        .style("left", `${event.pageX + 5}px`)
                        .style("top", `${event.pageY - 28}px`);
                })
                .on("mouseout", () => {
                    tooltip.transition().duration(200).style("display", "none");
                });
        }

