////////////////////////////////////////////////////
// 1. Configuration générale de l’API Spotify
////////////////////////////////////////////////////
const CLIENT_ID = '2a0f07a819f94f008a0d950fb8ea84ca';
const REDIRECT_URI = 'http://127.0.0.1:8080/';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-top-read'
];

// Sélection des éléments du DOM
const addUserButton = document.getElementById('add-user-button');
const logoutButton = document.getElementById('logout-button');
const userSelect = document.getElementById('user-select');

////////////////////////////////////////////////////
// 2. Gestion de l'authentification avec localStorage
////////////////////////////////////////////////////

function getTokenFromUrl() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return {
    access_token: params.get('access_token'),
    token_type: params.get('token_type'),
    expires_in: params.get('expires_in'),
    state: params.get('state'),
  };
}

function addUser() {
  const authUrl =
    `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
    `&response_type=${RESPONSE_TYPE}` +
    `&show_dialog=true` +
    `&state=add_user`;

  window.location = authUrl;
}

async function handleAuth() {
  const { access_token, expires_in, state } = getTokenFromUrl();

  if (access_token) {
    // Nettoyage de l’URL
    window.location.hash = '';

    // Récupérer le profil utilisateur depuis l'API Spotify
    const userProfile = await fetchUserProfile(access_token);
    if (userProfile) {
      const userId = userProfile.id;
      const userName = userProfile.display_name || userId;

      let users = JSON.parse(localStorage.getItem('spotify_users')) || {};
      users[userId] = {
        access_token: access_token,
        name: userName,
        expires_at: Date.now() + expires_in * 1000,
      };
      localStorage.setItem('spotify_users', JSON.stringify(users));

      // Mettre à jour la liste déroulante
      populateUserSelect();

      if (state === 'add_user') {
        userSelect.value = userId;
        console.log(`Nouveau user ajouté : ${userName}`);
      }
    }
  }
}

async function fetchUserProfile(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du profil utilisateur');
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    alert('Impossible de récupérer le profil utilisateur.');
  }
}

function populateUserSelect() {
  userSelect.innerHTML = '<option value="" disabled selected>Choisir un utilisateur</option>';
  const users = JSON.parse(localStorage.getItem('spotify_users')) || {};

  for (const userId in users) {
    const option = document.createElement('option');
    option.value = userId;
    option.textContent = users[userId].name;
    userSelect.appendChild(option);
  }

  const userCount = Object.keys(users).length;
  if (userCount > 0) {
    userSelect.style.display = 'inline-block';
    logoutButton.style.display = 'inline-block';
  } else {
    userSelect.style.display = 'none';
    logoutButton.style.display = 'none';
  }
}

function clearCharts() {
  document.querySelectorAll('.chart').forEach(chart => {
      chart.innerHTML = '';
  });
}

/**
 * Charge, si nécessaire, les données locales pour Clarence et Dichouxx
 * @param {string} userName 
 * @returns {Promise<Array>} - Tableau contenant toutes les entrées JSON des fichiers
 */
async function loadLocalData(userName) {
  // Définir ici la liste des fichiers à charger en fonction de l'utilisateur
  let fileNumbers = [];
  if (userName === 'Clarence') {
    fileNumbers = [0, 1];
  } else if (userName === 'Dichouxx') {
    fileNumbers = [0, 1, 2, 3];
  } else {
    // Si ce n’est ni Clarence ni Dichouxx, on ne charge rien
    return [];
  }

  const dataFolder = `./data/${userName}/`;
  let allData = [];

  // Tenter de charger chaque fichier et concaténer les résultats
  for (let num of fileNumbers) {
    const filePath = `${dataFolder}StreamingHistory_music_${num}.json`;
    try {
      const resp = await fetch(filePath);
      if (resp.ok) {
        const fileData = await resp.json();
        // fileData supposé être un tableau ; on le concatène
        allData = allData.concat(fileData);
      } else {
        console.warn(`Impossible de charger le fichier : ${filePath} (Code: ${resp.status})`);
      }
    } catch (err) {
      console.error(`Erreur lors du chargement du fichier ${filePath}:`, err);
    }
  }

  return allData;
}

async function handleUserSelection() {
  const selectedUserId = userSelect.value;
  if (!selectedUserId) return;

  const users = JSON.parse(localStorage.getItem('spotify_users')) || {};
  const user = users[selectedUserId];
  if (!user) return;

  // Vérifier si le token a expiré
  if (Date.now() > user.expires_at) {
      alert('Le token d\'accès a expiré. Veuillez vous reconnecter.');
      logoutUser(selectedUserId);
      return;
  }

  console.log(`Utilisateur sélectionné : ${user.name}`);

  // Charger les données locales si c'est Clarence ou Dichouxx
  let localData = [];
  if (['Clarence', 'Dichouxx'].includes(user.name)) {
    localData = await loadLocalData(user.name);
    console.log(`Données locales pour ${user.name} :`, localData);

    // Vous pouvez stocker ces données quelque part si nécessaire
    // Par exemple, dans l'objet user :
    user.localData = localData;
    // On met à jour la liste en localStorage si on souhaite les sauvegarder
    users[selectedUserId] = user;
    localStorage.setItem('spotify_users', JSON.stringify(users));
  }

  // Effacer les graphiques précédents
  clearCharts();

  // Recréer les graphiques avec les nouvelles données (API Spotify)
  const genreData = await fetchUserGenres(user.access_token);
  // createTopTracksBarChart("#chart1", user.access_token);
  createGenreBubbleChart('#chart3', genreData);

    // AJOUT : si localData est dispo, on crée la heatmap
  if (user.localData && user.localData.length > 0) {
    createTopArtistsBarChartLocal("#chart1", user.localData);
    createTopTracksPieChartLocal("#chart2", user.localData);
    createListeningHeatmap("#chart4", user.localData);
    createArtistOriginMap("#chart5", user.localData);
  } else {
    // Si pas de données locales, vous pouvez afficher un message ou laisser le conteneur vide
    document.querySelector("#chart4").innerHTML = "<p>Aucune donnée locale</p>";
  }
}

function handleLogout() {
  const selectedUserId = userSelect.value;
  if (!selectedUserId) {
    alert('Veuillez sélectionner un utilisateur à déconnecter.');
    return;
  }
  logoutUser(selectedUserId);
}

function logoutUser(userId) {
  let users = JSON.parse(localStorage.getItem('spotify_users')) || {};
  if (users[userId]) {
    delete users[userId];
    localStorage.setItem('spotify_users', JSON.stringify(users));
  }
  populateUserSelect();
}

addUserButton.addEventListener('click', addUser);
logoutButton.addEventListener('click', handleLogout);
userSelect.addEventListener('change', handleUserSelection);

window.addEventListener('load', () => {
  handleAuth();
  populateUserSelect();
});

////////////////////////////////////////////////////
// 2.BIS. Fonctions spécifiques au BUBBLE CHART
////////////////////////////////////////////////////

async function fetchUserGenres(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=50', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des top artistes');
    }

    const data = await response.json();
    let genreCounts = {};

    data.items.forEach(artist => {
      artist.genres.forEach(g => {
        const genre = g.trim();
        if (!genreCounts[genre]) {
          genreCounts[genre] = 0;
        }
        genreCounts[genre]++;
      });
    });

    const genreArray = Object.entries(genreCounts).map(([genre, count]) => ({
      name: genre,
      value: count
    }));
    genreArray.sort((a, b) => b.value - a.value);

    return genreArray;
  } catch (error) {
    console.error(error);
    alert('Impossible de récupérer les genres.');
    return [];
  }
}

function createGenreBubbleChart(selector, data) {
  const container = document.querySelector(selector);
  container.innerHTML = '';

  // Valeurs fixes pour un affichage stable
  const width = 600;
  const height = 500;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const simulation = d3.forceSimulation()
    .force('charge', d3.forceManyBody().strength(5))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => d.radius + 2));

  const nodes = data.map(d => ({
    ...d,
    radius: Math.sqrt(d.value) * 10
  }));

  const node = svg.selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('r', d => d.radius)
    .attr('fill', 'rgba(29, 185, 84, 0.2)')
    .attr('stroke', '#1DB954')
    .attr('stroke-width', 1.5);

  const tooltip = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('width', '120px')
    .style('padding', '5px')
    .style('font', '12px sans-serif')
    .style('background', 'rgba(0,0,0,0.6)')
    .style('color', '#fff')
    .style('border-radius', '8px')
    .style('pointer-events', 'none')
    .style('opacity', 0);

  node
    .on('mouseover', function(event, d) {
      tooltip.transition().duration(200).style('opacity', 0.9);
      tooltip
        .html(`<strong>${d.name}</strong><br>Occurrences: ${d.value}`)
        .style('left', (event.pageX) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      tooltip.transition().duration(500).style('opacity', 0);
    });

  simulation.nodes(nodes).on('tick', () => {
    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  });
}

////////////////////////////////////////////////////
// 4. Création des autres graphiques D3
////////////////////////////////////////////////////

/**
 * Crée un bar chart horizontal dans le conteneur `selector`, 
 * représentant les 10 artistes les plus écoutés selon la durée totale
 * (à partir des données locales).
 * Inclut des sélecteurs pour choisir la période (Semaine ou Mois) et la valeur correspondante.
 * 
 * @param {string} selector - Ex : "#chart1"
 * @param {Array} localData - Données locales (StreamingHistory), 
 *   chaque élément comportant endTime, artistName, trackName, msPlayed
 */
function createTopArtistsBarChartLocal(selector, localData) {
  // 1) Sélection du conteneur HTML et nettoyage
  const container = d3.select(selector);
  container.html(''); // Nettoyer le conteneur

  // 2) Prétraitement des données
  const parseTime = d3.timeParse("%Y-%m-%d %H:%M");
  const formatMonth = d3.timeFormat('%Y-%m');

  // Ajouter des objets Date, monthStr et weekStr
  localData.forEach(d => {
    d.dateObj = parseTime(d.endTime);
    if (d.dateObj) {
      d.monthStr = formatMonth(d.dateObj);
      const day = d.dateObj.getDate();
      const weekNumber = Math.ceil(day / 7);
      d.weekStr = `${formatMonth(d.dateObj)}-W${weekNumber}`;
    }
  });

  // Filtrer les entrées avec des dates valides
  const validData = localData.filter(d => d.dateObj);

  // 3) Extraire les périodes disponibles
  const allMonths = Array.from(new Set(validData.map(d => d.monthStr))).sort();
  const allWeeks = Array.from(new Set(validData.map(d => d.weekStr))).sort();

  // 4) Créer les sélecteurs

  // a. Sélecteur de type de période
  const periodTypes = ['Mois', 'Semaine'];
  const periodTypeSelect = container.append('div')
    .attr('class', 'selectors')
    .style('margin-bottom', '10px');

  periodTypeSelect.append('label')
    .attr('for', 'period-type-select')
    .text('Période : ')
    .style('margin-right', '5px');

  periodTypeSelect.append('select')
    .attr('id', 'period-type-select')
    .selectAll('option')
    .data(periodTypes)
    .enter()
    .append('option')
    .attr('value', d => d.toLowerCase())
    .text(d => d);

  // b. Sélecteur de valeur de période
  const periodValueSelect = container.append('div')
    .attr('class', 'selectors')
    .style('margin-bottom', '20px');

  periodValueSelect.append('label')
    .attr('for', 'period-value-select')
    .text('Sélectionner : ')
    .style('margin-right', '5px');

  const periodValueDropdown = periodValueSelect.append('select')
    .attr('id', 'period-value-select');

  // Initialiser le sélecteur de valeur avec les mois par défaut
  periodValueDropdown.selectAll('option')
    .data(allMonths)
    .enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d);

  // 5) Créer l'espace D3 pour le graphique
  const width = 600;
  const height = 400;
  const margin = { top: 20, right: 30, bottom: 40, left: 200 };

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  // 6) Créer les échelles et les axes (initialement basés sur Mois)
  const x = d3.scaleLinear()
    .range([margin.left, width - margin.right]);

  const y = d3.scaleBand()
    .range([margin.top, height - margin.bottom])
    .padding(0.1);

  const xAxis = svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`);

  const yAxis = svg.append("g")
    .attr("transform", `translate(${margin.left},0)`);

  // 7) Tooltip
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('background', 'rgba(0, 0, 0, 0.7)')
    .style('color', '#fff')
    .style('padding', '6px 8px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0);

  // 8) Fonction pour formater les millisecondes en heures/minutes
  function formatMs(ms) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const hrs = Math.floor(min / 60);
    const remainingMin = min % 60;
    return `${hrs}h ${remainingMin}m`;
  }

  // 9) Fonction pour agréger et dessiner le graphique
  function updateChart(selectedPeriodType, selectedPeriodValue) {
    let filteredData = [];

    if (selectedPeriodType === 'mois') {
      // Filtrer par mois
      filteredData = validData.filter(d => d.monthStr === selectedPeriodValue);
    } else if (selectedPeriodType === 'semaine') {
      // Filtrer par semaine
      filteredData = validData.filter(d => d.weekStr === selectedPeriodValue);
    }

    // Agréger la durée par artiste
    const artistDurationMap = {};
    filteredData.forEach(d => {
      const artist = d.artistName || "Artiste Inconnu";
      if (!artistDurationMap[artist]) {
        artistDurationMap[artist] = 0;
      }
      artistDurationMap[artist] += d.msPlayed;
    });

    // Transformer en tableau et trier par durée décroissante
    let artistArray = Object.entries(artistDurationMap).map(([artistName, totalMs]) => ({
      artistName,
      totalMs
    }));
    artistArray.sort((a, b) => b.totalMs - a.totalMs);

    // Ne garder que les 10 premiers
    artistArray = artistArray.slice(0, 10);

    // Mettre à jour les échelles
    x.domain([0, d3.max(artistArray, d => d.totalMs)]);
    y.domain(artistArray.map(d => d.artistName));

    // Mettre à jour les axes
    xAxis.transition()
      .duration(1000)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => formatMs(d)));

    yAxis.transition()
      .duration(1000)
      .call(d3.axisLeft(y));

    // Data join pour les barres
    const bars = svg.selectAll(".bar")
      .data(artistArray, d => d.artistName);

    // EXIT
    bars.exit()
      .transition()
      .duration(1000)
      .attr("width", 0)
      .remove();

    // UPDATE
    bars.transition()
      .duration(1000)
      .attr("y", d => y(d.artistName))
      .attr("width", d => x(d.totalMs) - margin.left)
      .attr("height", y.bandwidth())
      .attr("fill", "rgba(29,185,84,0.7)");

    // ENTER
    bars.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.artistName))
      .attr("x", x(0))
      .attr("height", y.bandwidth())
      .attr("width", 0)
      .attr("fill", "rgba(29,185,84,0.7)")
      .on("mouseover", (event, d) => {
        tooltip
          .style('opacity', 0.9)
          .html(`
            <div><strong>${d.artistName}</strong></div>
            <div>Durée d'écoute : ${formatMs(d.totalMs)}</div>
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px');
      })
      .on("mousemove", (event) => {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px');
      })
      .on("mouseout", () => {
        tooltip.style('opacity', 0);
      })
      .transition()
      .duration(1000)
      .attr("width", d => x(d.totalMs) - margin.left);
  }

  // 10) Initialiser le graphique avec les premiers éléments
  const initialPeriodType = 'mois';
  const initialPeriodValue = allMonths[0] || '';

  updateChart(initialPeriodType, initialPeriodValue);

  // 11) Ajouter des écouteurs d'événements pour les sélecteurs
  periodTypeSelect.select('#period-type-select')
    .on('change', function() {
      const selectedPeriodType = this.value; // 'mois' ou 'semaine'

      // Mettre à jour les options du sélecteur de période
      if (selectedPeriodType === 'mois') {
        periodValueDropdown.selectAll('option').remove();
        periodValueDropdown.selectAll('option')
          .data(allMonths)
          .enter()
          .append('option')
          .attr('value', d => d)
          .text(d => d);
      } else if (selectedPeriodType === 'semaine') {
        periodValueDropdown.selectAll('option').remove();
        periodValueDropdown.selectAll('option')
          .data(allWeeks)
          .enter()
          .append('option')
          .attr('value', d => d)
          .text(d => d);
      }

      // Sélectionner le premier élément par défaut
      const newSelectedPeriodValue = (selectedPeriodType === 'mois') ? allMonths[0] : allWeeks[0];
      periodValueDropdown.property('value', newSelectedPeriodValue);

      // Mettre à jour le graphique
      updateChart(selectedPeriodType, newSelectedPeriodValue);
    });

  periodValueDropdown.on('change', function() {
    const selectedPeriodType = d3.select('#period-type-select').property('value');
    const selectedPeriodValue = this.value;

    updateChart(selectedPeriodType, selectedPeriodValue);
  });

  // 12) Style additionnel pour les sélecteurs (optionnel)
  container.selectAll('.selectors select')
    .style('padding', '5px')
    .style('font-size', '14px');
}

/* async function createTopTracksBarChart(selector, token) {
    const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    const tracks = data.items.map(track => ({
        name: track.name,
        popularity: track.popularity
    }));

    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(tracks.map(d => d.name))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, 100]) // Popularité max est 100
        .nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("fill", "rgba(29, 185, 84, 0.2)")
        .selectAll("rect")
        .data(tracks)
        .join("rect")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.popularity))
        .attr("height", d => y(0) - y(d.popularity))
        .attr("width", x.bandwidth());

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d => d.length > 10 ? d.slice(0, 10) + '...' : d))
        .attr("font-size", '12px');

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .attr("font-size", '12px');
} */

/**
 * Crée un camembert (pie chart) dans le conteneur `selector` 
 * affichant les 10 tracks les plus écoutées (en durée) pour 
 * le mois sélectionné.
 * @param {string} selector - Sélecteur CSS, ex: "#chart2"
 * @param {Array} localData - Tableau d'objets {endTime, artistName, trackName, msPlayed}
 */
function createTopTracksPieChartLocal(selector, localData) {
  const container = document.querySelector(selector);
  container.innerHTML = ''; // on nettoie le conteneur

  // 1) Créer un <select> pour choisir le mois
  const monthSelect = document.createElement('select');
  monthSelect.id = 'month-select-pie';
  container.appendChild(monthSelect);

  // 2) Préparer le parsing de la date : endTime = "YYYY-MM-DD HH:mm"
  const parseTime = d3.timeParse("%Y-%m-%d %H:%M");
  localData.forEach(d => {
    d.dateObj = parseTime(d.endTime);
  });
  localData = localData.filter(d => d.dateObj); // filtrer éventuelles dates invalides

  const formatMonth = d3.timeFormat('%Y-%m');
  localData.forEach(d => {
    d.monthStr = formatMonth(d.dateObj);
  });

  // Lister tous les mois uniques
  const allMonths = Array.from(new Set(localData.map(d => d.monthStr))).sort();
  
  // Renseigner le <select>
  monthSelect.innerHTML = allMonths
    .map(m => `<option value="${m}">${m}</option>`)
    .join('');

  // 3) Préparer l'espace D3 (camembert)
  const width = 600;
  const height = 400;
  const margin = 20;
  const radius = Math.min(width, height) / 2 - margin;

  // Créer un <div> pour le SVG
  const svgDiv = document.createElement('div');
  container.appendChild(svgDiv);

  // Ajouter le SVG
  const svg = d3.select(svgDiv)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Échelle de couleurs (basique, 10 couleurs)
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Préparer le layout "pie"
  const pie = d3.pie()
    .sort(null) // ne pas trier par défaut, ou on peut trier par valeur
    .value(d => d.totalMs);

  // Préparer l'arc
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  // 4) Gérer le tooltip
  const tooltip = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,0.7)')
    .style('color', '#fff')
    .style('padding', '6px 8px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0);

  // 5) Fonction pour mettre à jour le camembert en fonction du mois
  function updatePie(selectedMonth) {
    // Filtrer les écoutes pour ce mois
    const monthData = localData.filter(d => d.monthStr === selectedMonth);

    // On agrège la durée d'écoute par (trackName, artistName)
    // Clé = trackName + "::" + artistName (ou un objet)
    const trackMap = {};
    monthData.forEach(d => {
      if (!d.trackName || !d.artistName) return;

      const key = `${d.trackName}::${d.artistName}`;
      if (!trackMap[key]) {
        trackMap[key] = 0;
      }
      trackMap[key] += d.msPlayed;
    });

    // Transformer en tableau, puis trier par durée descendante
    let trackArray = Object.entries(trackMap).map(([key, totalMs]) => {
      const [trackName, artistName] = key.split("::");
      return { trackName, artistName, totalMs };
    });
    trackArray.sort((a, b) => b.totalMs - a.totalMs);

    // Ne garder que les 10 plus gros
    trackArray = trackArray.slice(0, 10);

    // Générer les arcs
    const arcs = pie(trackArray);

    // Data join
    const path = svg.selectAll('path')
      .data(arcs, d => d.data.trackName + d.data.artistName); // clé data

    // Mise à jour
    path.join(
      // ENTRÉE
      enter => enter.append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.trackName)) // ex: un code couleur par track
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', (event, d) => {
          const { trackName, artistName, totalMs } = d.data;
          tooltip
            .style('opacity', 0.9)
            .html(`
              <div><strong>${trackName}</strong></div>
              <div>${artistName}</div>
              <div>${formatMs(totalMs)}</div>
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY + 10) + 'px');
        })
        .on('mousemove', (event) => {
          tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY + 10) + 'px');
        })
        .on('mouseout', () => {
          tooltip.style('opacity', 0);
        }),

      // MISE A JOUR
      update => update
        .attr('fill', d => color(d.data.trackName))
        .attr('d', arc),

      // SORTIE
      exit => exit.remove()
    );
  }

  // 6) Réagir au changement de mois
  monthSelect.addEventListener('change', e => {
    updatePie(e.target.value);
  });

  // 7) Afficher par défaut le premier mois s'il y en a
  if (allMonths.length > 0) {
    monthSelect.value = allMonths[0];
    updatePie(allMonths[0]);
  }

  // Petite fonction utilitaire pour afficher joliment les durées
  function formatMs(ms) {
    // Par exemple, conversion en minutes/secondes
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min} min ${sec.toString().padStart(2, '0')}s`;
  }
}

/**
 * Crée une heatmap représentant les habitudes d’écoute
 * (ligne = heures 0..23, colonne = 4 semaines du mois).
 * Un sélecteur permet de choisir le mois à afficher.
 * @param {string} selector - Sélecteur CSS pour le conteneur (ex: "#chart4")
 * @param {Array} localData - Données locales (StreamingHistory) déjà chargées.
 */
function createListeningHeatmap(selector, localData) {
  const container = document.querySelector(selector);
  container.innerHTML = ''; // Nettoyer le conteneur

  // 1) Créer une div pour le sélecteur de mois
  const monthSelector = document.createElement('select');
  monthSelector.id = 'month-select';
  container.appendChild(monthSelector);

  // 2) Parser les dates et extraire les mois disponibles
  const parseTime = d3.timeParse('%Y-%m-%d %H:%M');
  localData.forEach(d => {
    d.dateObj = parseTime(d.endTime); 
    // Gestion éventuelle des dates invalides :
    if (!d.dateObj) {
      console.warn("Date invalide :", d.endTime);
    }
  });

  // On filtre les entrées dont la dateObj est undefined
  localData = localData.filter(d => d.dateObj);

  // Formater le mois sous forme "YYYY-MM"
  const formatMonth = d3.timeFormat('%Y-%m');
  localData.forEach(d => {
    d.monthStr = formatMonth(d.dateObj);
  });

  // Lister tous les mois uniques
  const allMonths = Array.from(new Set(localData.map(d => d.monthStr))).sort();
  
  // Remplir le sélecteur de mois
  monthSelector.innerHTML = allMonths.map(m => `<option value="${m}">${m}</option>`).join('');
  
  // 3) Construire la zone SVG
  //    On mettra la heatmap dans un <div> en-dessous du select
  const heatmapDiv = document.createElement('div');
  container.appendChild(heatmapDiv);

  const width = 600;
  const height = 500;
  const margin = { top: 30, right: 30, bottom: 30, left: 60 };

  // Création du SVG
  const svg = d3.select(heatmapDiv)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Échelles discrètes (semaines : 1..4 ; heures : 0..23)
  const xScale = d3.scaleBand()
    .domain([1, 2, 3, 4]) 
    .range([margin.left, width - margin.right])
    .padding(0.05);

  const yScale = d3.scaleBand()
    .domain(d3.range(24)) // 0..23
    .range([margin.top, height - margin.bottom])
    .padding(0.05);

  // Création du groupe principal
  const g = svg.append("g");

  // Axes
  const xAxis = d3.axisTop(xScale).tickSize(0);
  const yAxis = d3.axisLeft(yScale).tickSize(0);

  svg.append("g")
    .attr("transform", `translate(0,${margin.top})`)
    .call(xAxis)
    .call(g => g.select(".domain").remove());

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .call(g => g.select(".domain").remove());

  // 4) Fonction utilitaire pour agréger et dessiner la heatmap
  function updateHeatmapForMonth(monthStr) {
    // Filtrer les données du mois sélectionné
    const monthData = localData.filter(d => d.monthStr === monthStr);

    // Agréger par heure + semaine
    // semaine = ceil(dayOfMonth / 7)
    const aggregationMap = {};

    monthData.forEach(d => {
      const hour = d.dateObj.getHours();
      const day = d.dateObj.getDate();
      const week = Math.ceil(day / 7);
      if (week > 4) return; // On ignore les jours > 28 dans cet exemple

      const key = `${hour}-${week}`;
      if (!aggregationMap[key]) {
        aggregationMap[key] = 0;
      }
      aggregationMap[key] += d.msPlayed; // Somme de msPlayed
    });

    // Construire un tableau des cellules
    // On veut toutes les combinaisons hour=0..23, week=1..4
    const cells = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let week = 1; week <= 4; week++) {
        const key = `${hour}-${week}`;
        const totalMs = aggregationMap[key] || 0;
        cells.push({ hour, week, totalMs });
      }
    }

    // Définir la scale de couleur
    const maxMs = d3.max(cells, d => d.totalMs);
    const colorScale = d3.scaleSequential()
      .domain([0, maxMs])
      .interpolator(d3.interpolateGreens);

    // Sélection + data-join
    const rects = g.selectAll("rect.hour-cell")
      .data(cells, d => d.hour + "-" + d.week); // key unique

    // Mise à jour des rectangles existants
    rects
      .join("rect")
      .attr("class", "hour-cell")
      .attr("x", d => xScale(d.week))
      .attr("y", d => yScale(d.hour))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(d.totalMs));
  }

  // 5) Gérer l’événement "change" sur le sélecteur de mois
  monthSelector.addEventListener('change', (e) => {
    updateHeatmapForMonth(e.target.value);
  });

  // Initialisation : afficher le premier mois par défaut
  if (allMonths.length > 0) {
    monthSelector.value = allMonths[0];
    updateHeatmapForMonth(allMonths[0]);
  }
}

// Mapping des artistes à leurs pays d'origine (manuel)
const artistCountryMap = {
  "The Beatles": "United Kingdom",
  "Taylor Swift": "USA",
  "Ed Sheeran": "United Kingdom",
  "BTS": "South Korea",
  "Shakira": "Colombia",
  "Beyoncé": "USA",
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
  "Prince": "USA",
  "Jazzy Bazz": "France",
  "Mad Keys": "USA",
  "The Smiths": "United Kingdom",
  "JeanJass": "Belgium",
  "Billie Eilish": "USA",
  "Queen": "United Kingdom",
  "Alpha Wann": "France",
  "Tyler, The Creator": "USA",
  "Krisy": "Belgium",
  "Yamê": "France",
  "Ajna": "France",
  "Prince Waly": "France",
  "Jungle Jack": "France",
  "Jimi Hendrix": "USA",
  "Kodak Black": "USA",
  "Hamza": "Belgium",
  "ISHA": "Belgium",
  "The Weeknd": "Canada",
  "PARTYNEXTDOOR": "Canada",
  "SZA": "USA",
  "Cash Cobain": "USA",
  "21 Savage": "USA",
  "Metro Boomin": "USA",
  "Future": "USA",
  "Lil Uzi Vert": "USA",
  "070 Shake": "USA",
  // Ajoutez d'autres artistes ici
};

/**
 * Crée une carte du monde affichant les pays d'origine des artistes écoutés par l'utilisateur.
 * Plus un pays contient d'artistes écoutés, plus sa couleur est foncée.
 * @param {string} selector - Sélecteur CSS pour le conteneur (ex: "#chart5")
 * @param {Array} localData - Données locales (StreamingHistory) déjà chargées.
 */
async function createArtistOriginMap(selector, localData) {
  console.log(`createArtistOriginMap appelée avec selector: ${selector}, localData.length: ${localData.length}`);

  const container = d3.select(selector);
  container.html(''); // Nettoyer le conteneur

  // Dimensions de la carte
  const width = 600; // Ajusté pour correspondre à .chart
  const height = 500;

  // Création du SVG
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  // Projection et chemin
  const projection = d3.geoMercator()
    .scale(130)
    .translate([width / 2, height / 1.5]);

  const path = d3.geoPath().projection(projection);

  // Charger le GeoJSON
  let geoData;
  try {
    geoData = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
    console.log("GeoJSON chargé avec succès :", geoData);
  } catch (error) {
    console.error("Erreur lors du chargement du GeoJSON :", error);
    container.append("p").text("Erreur lors du chargement de la carte.");
    return;
  }

  // Agrégation des artistes par pays
  const countryArtistMap = {}; // { country: Set(artists) }

  localData.forEach(d => {
    const artist = d.artistName;
    const country = artistCountryMap[artist];
    if (country) {
      if (!countryArtistMap[country]) {
        countryArtistMap[country] = new Set();
      }
      countryArtistMap[country].add(artist);
    }
  });

  console.log("countryArtistMap :", countryArtistMap);

  // Compter le nombre d'artistes par pays
  const countryCounts = {};
  for (const [country, artists] of Object.entries(countryArtistMap)) {
    countryCounts[country] = artists.size;
  }

  console.log("countryCounts :", countryCounts);

  // Définir l'échelle de couleur
  const maxCount = d3.max(Object.values(countryCounts)) || 1;
  const colorScale = d3.scaleSequential()
    .domain([0, maxCount])
    .interpolator(d3.interpolateBlues);

  // Ajouter les pays au SVG
  svg.append("g")
    .selectAll("path")
    .data(geoData.features)
    .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const countryName = d.properties.name;
        return countryCounts[countryName] ? colorScale(countryCounts[countryName]) : "#EEE";
      })
      .attr("stroke", "#999")
      .attr("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
        const countryName = d.properties.name;
        const count = countryCounts[countryName] || 0;
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`<strong>${countryName}</strong><br>Artistes écoutés: ${count}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        d3.select(this).attr("stroke-width", 1.5);
      })
      .on("mouseout", function() {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
        d3.select(this).attr("stroke-width", 0.5);
      });

  // Tooltip
  const tooltip = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("position", "absolute")
    .style("text-align", "center")			
    .style("width", "120px")					
    .style("height", "auto")					
    .style("padding", "5px")				
    .style("font", "12px sans-serif")		
    .style("background", "rgba(0,0,0,0.6)")	
    .style("color", "#fff")					
    .style("border", "0px")					
    .style("border-radius", "8px")			
    .style("pointer-events", "none")		
    .style("opacity", 0);

  // Légende
  const legendWidth = 300;
  const legendHeight = 10;

  const legendSvg = container.append("svg")
    .attr("width", legendWidth + 40)
    .attr("height", 50);

  // Légende d'échelle de couleur
  const legend = legendSvg.append("g")
    .attr("transform", "translate(20,20)");

  const defs = legend.append("defs");

  const linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient");

  linearGradient.selectAll("stop")
    .data([
      {offset: "0%", color: colorScale(0)},
      {offset: "100%", color: colorScale(maxCount)}
    ])
    .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#linear-gradient)");

  // Ajouter des étiquettes à la légende
  legend.append("text")
    .attr("class", "caption")
    .attr("x", 0)
    .attr("y", -5)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Nombre d'artistes écoutés");

  const xScaleLegend = d3.scaleLinear()
    .domain([0, maxCount])
    .range([0, legendWidth]);

  const xAxisLegend = d3.axisBottom(xScaleLegend)
    .ticks(5)
    .tickFormat(d3.format("d"));

  legend.append("g")
    .attr("transform", `translate(0,${legendHeight})`)
    .call(xAxisLegend)
    .select(".domain").remove();
}