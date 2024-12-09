// Inicjalizacja mapy
const map = L.map('map').setView([50.2649, 19.0238], 13);

// Warstwa mapy OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Ikona przystanku
const busStopIcon = L.icon({
    iconUrl: 'imgs/bus-stop-icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

let routeLine; // Przechowuje linię trasy

let savedRoutes = [];

let allStopsData = []; // Wszystkie przystanki z GTFS
let visibleMarkers = []; // Markery aktualnie widoczne na mapie

// Poziomy zoomu dla różnych zestawów przystanków
const minZoomLevelToShowAllStops = 15; // Wyświetlanie wszystkich przystanków
const minZoomLevelToShowMainStops = 10; // Wyświetlanie tylko głównych przystanków

// Funkcja wczytująca dane przystanków z pliku GTFS (stops.txt)
async function loadStopsFromGTFS() {
    try {
        const response = await fetch('gtfs_data/stops.txt');
        const text = await response.text();

        const parsedData = Papa.parse(text, {
            header: true, // Automatyczne mapowanie nagłówków
            skipEmptyLines: true,
        });

        // Dodanie priorytetu przystankom (na podstawie przykładowych danych)
        allStopsData = parsedData.data.map(stop => ({
            id: stop.stop_id,
            name: stop.stop_name,
            lat: parseFloat(stop.stop_lat),
            lon: parseFloat(stop.stop_lon),
            isMain: stop.stop_name.includes("Centrum") || stop.stop_name.includes("Dworzec") // Przykład
        }));

        console.log('Załadowano przystanki:', allStopsData);

        // Zaktualizuj widoczne przystanki na podstawie aktualnego zoomu i widoku mapy
        updateVisibleStops();
    } catch (error) {
        console.error('Błąd podczas wczytywania przystanków z GTFS:', error);
    }
}

// Funkcja aktualizująca przystanki widoczne w aktualnym widoku mapy
function updateVisibleStops() {
    visibleMarkers.forEach(marker => map.removeLayer(marker));
    visibleMarkers = [];

    const currentZoom = map.getZoom();
    const bounds = map.getBounds();

    let stopsInView;

    if (currentZoom < minZoomLevelToShowMainStops) {
        console.log('Za mały zoom, brak przystanków.');
        return;
    } else if (currentZoom < minZoomLevelToShowAllStops) {
        stopsInView = allStopsData.filter(stop =>
            bounds.contains([stop.lat, stop.lon]) && stop.isMain
        );
    } else {
        stopsInView = allStopsData.filter(stop =>
            bounds.contains([stop.lat, stop.lon])
        );
    }

    stopsInView.forEach(stop => {
        const marker = L.marker([stop.lat, stop.lon], { icon: busStopIcon })
            .bindPopup(`<b>${stop.name}</b><br>ID: ${stop.id}`)
            .addTo(map);

        visibleMarkers.push(marker);
    });
}

// Funkcja wyznaczania i rysowania trasy
async function findRoute() {
    const startStopName = document.getElementById('startStop').value.trim().toLowerCase();
    const endStopName = document.getElementById('endStop').value.trim().toLowerCase();

    if (!startStopName || !endStopName) {
        alert("Proszę wprowadzić oba przystanki.");
        return;
    }

    // Szukamy przystanków
    const startStop = allStopsData.find(stop => stop.name.toLowerCase().includes(startStopName));
    const endStop = allStopsData.find(stop => stop.name.toLowerCase().includes(endStopName));

    if (!startStop || !endStop) {
        alert("Nie znaleziono jednego lub obu przystanków.");
        return;
    }

    const startCoords = [startStop.lat, startStop.lon];
    const endCoords = [endStop.lat, endStop.lon];

    try {
        // Wywołanie API OSRM do obliczenia trasy
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`);
        const data = await response.json();

        // Usuwamy poprzednią trasę, jeśli istnieje
        if (routeLine) {
            map.removeLayer(routeLine);
        }

        // Wyciągamy współrzędne trasy
        const routeCoords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);

        // Rysujemy trasę na mapie
        routeLine = L.polyline(routeCoords, { color: 'blue', weight: 5 }).addTo(map);
        map.fitBounds(routeLine.getBounds());

        // Dodajemy markery dla przystanków początkowego i końcowego, nawet jeśli są poza widokiem
        const startMarker = L.marker(startCoords, { icon: busStopIcon })
            .bindPopup(`<b>${startStop.name}</b><br>ID: ${startStop.id}`)
            .addTo(map)
            .openPopup();

        const endMarker = L.marker(endCoords, { icon: busStopIcon })
            .bindPopup(`<b>${endStop.name}</b><br>ID: ${endStop.id}`)
            .addTo(map)
            .openPopup();

        // Dodajemy markery do widocznych markerów
        visibleMarkers.push(startMarker, endMarker);

    } catch (error) {
        console.error("Błąd podczas wyznaczania trasy:", error);
        alert("Nie udało się wyznaczyć trasy.");
    }
}

// Funkcja do zapisywania aktualnej trasy
function saveCurrentRoute() {
    if (!routeLine) {
        alert("Nie wyznaczono trasy do zapisania.");
        return;
    }

    // Tworzymy obiekt reprezentujący trasę
    const routeData = {
        id: savedRoutes.length + 1,
        start: document.getElementById('startStop').value.trim(),
        end: document.getElementById('endStop').value.trim(),
        coordinates: routeLine.getLatLngs(),
        color: 'blue'
    };

    // Zapisujemy trasę
    savedRoutes.push(routeData);
    updateSavedRoutesList();
    alert("Trasa została zapisana.");
}

// Funkcja do wyświetlania zapisanych tras
function updateSavedRoutesList() {
    const savedRoutesList = document.getElementById('savedRoutesList');
    savedRoutesList.innerHTML = '';

    savedRoutes.forEach(route => {
        const li = document.createElement('li');
        li.textContent = `${route.start} → ${route.end}`;
        li.onclick = () => loadSavedRoute(route);
        savedRoutesList.appendChild(li);
    });
}

// Funkcja do ładowania zapisanej trasy
function loadSavedRoute(route) {
    // Usuwamy obecną trasę, jeśli istnieje
    if (routeLine) {
        map.removeLayer(routeLine);
    }

    // Rysujemy zapisane współrzędne
    routeLine = L.polyline(route.coordinates, { color: route.color, weight: 5 }).addTo(map);
    map.fitBounds(routeLine.getBounds());
}

// Funkcja do czyszczenia zapisanych tras
function clearSavedRoutes() {
    savedRoutes = [];
    updateSavedRoutesList();
    alert("Wszystkie zapisane trasy zostały usunięte.");
}

// Dodajemy zapisane trasy po załadowaniu strony
document.addEventListener("DOMContentLoaded", updateSavedRoutesList);

// Nasłuchiwanie przesunięcia lub zoomowania mapy
map.on('moveend', updateVisibleStops);

// Wczytanie danych przystanków
loadStopsFromGTFS();
