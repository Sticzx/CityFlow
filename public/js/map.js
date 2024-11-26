// Inicjalizacja mapy
const map = L.map('map').setView([50.2649, 19.0238], 13);

// Warstwa mapy OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const busStopIcon = L.icon({
    iconUrl: 'imgs/bus-stop-icon.png', 
    iconSize: [32, 32],
    iconAnchor: [16, 32], 
    popupAnchor: [0, -32] 
});

let stopsData = [];

async function fetchSchedules() {
    try {
        const response = await fetch('schedules.json');
        return await response.json();
    } catch (error) {
        console.error('Błąd podczas pobierania rozkładów jazdy:', error);
        return {};
    }
}

// Funkcja wczytująca dane przystanków z pliku GeoJSON
async function loadStopsGeoJSON() {
    try {
        const response = await fetch('stops.geojson');
        const data = await response.json();
        stopsData = data.features;
        const schedules = await fetchSchedules();

        // Dodanie warstwy GeoJSON na mapę
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                return L.marker(latlng, { icon: busStopIcon });
            },
            onEachFeature: (feature, layer) => {
                const { name } = feature.properties;
                layer.on('click', () => {
                    const schedule = schedules[name] || [];
                    if (schedule.length > 0) {
                        let scheduleInfo = `<b>Rozkład jazdy dla ${name}:</b><br>`;
                        schedule.forEach(entry => {
                            scheduleInfo += `Linia: ${entry.line}, Kierunek: ${entry.destination}, Odjazd: ${entry.time}<br>`;
                        });
                        layer.bindPopup(scheduleInfo).openPopup();
                    } else {
                        layer.bindPopup(`<b>${name}</b><br>Brak dostępnych danych rozkładu jazdy.`).openPopup();
                    }
                });
            }
        }).addTo(map);
    } catch (error) {
        console.error('Błąd podczas wczytywania danych przystanków:', error);
    }
}

function searchStop() {
    const searchText = document.getElementById('searchInput').value.trim().toLowerCase();

    if (!searchText) {
        alert("Proszę wprowadzić nazwę przystanku.");
        return;
    }

    const result = stopsData.filter(stop => stop.properties.name.toLowerCase().includes(searchText));

    if (result.length > 0) {
        const firstResult = result[0];
        const latlng = L.latLng(firstResult.geometry.coordinates[1], firstResult.geometry.coordinates[0]);
        
        // Przesunięcie mapy na znaleziony przystanek
        map.setView(latlng, 15);

        // Dodanie markera
        L.marker(latlng, { icon: busStopIcon })
            .bindPopup(`<b>${firstResult.properties.name}</b><br>${firstResult.properties.city}`)
            .addTo(map);
    } else {
        alert("Nie znaleziono przystanku o podanej nazwie.");
    }
}

// Wczytanie danych przystanków
loadStopsGeoJSON();
