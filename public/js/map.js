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
    // Usuń wszystkie aktualne markery
    visibleMarkers.forEach(marker => map.removeLayer(marker));
    visibleMarkers = [];

    // Pobierz poziom zoomu i granice widoku mapy
    const currentZoom = map.getZoom();
    const bounds = map.getBounds();

    let stopsInView;

    // Wyświetlaj różne przystanki w zależności od poziomu zoomu
    if (currentZoom < minZoomLevelToShowMainStops) {
        console.log('Za mały zoom, brak przystanków.');
        return; // Nie renderuj przystanków
    } else if (currentZoom < minZoomLevelToShowAllStops) {
        console.log('Wyświetlanie głównych przystanków');
        stopsInView = allStopsData.filter(stop =>
            bounds.contains([stop.lat, stop.lon]) && stop.isMain
        );
    } else {
        console.log('Wyświetlanie wszystkich przystanków');
        stopsInView = allStopsData.filter(stop =>
            bounds.contains([stop.lat, stop.lon])
        );
    }

    // Dodaj markery dla przystanków w widoku
    stopsInView.forEach(stop => {
        const marker = L.marker([stop.lat, stop.lon], { icon: busStopIcon })
            .bindPopup(`<b>${stop.name}</b><br>ID: ${stop.id}`)
            .addTo(map);

        visibleMarkers.push(marker);
    });
}

// Funkcja wyszukiwania przystanków
function searchStop() {
    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();

    if (!searchInput) {
        alert("Proszę wprowadzić nazwę przystanku.");
        return;
    }

    // Filtruj przystanki pasujące do wyszukiwanego tekstu
    const matchedStops = allStopsData.filter(stop =>
        stop.name.toLowerCase().includes(searchInput)
    );

    if (matchedStops.length === 0) {
        alert("Nie znaleziono przystanku o podanej nazwie.");
        return;
    }

    // Wybierz tylko jeden przystanek dla każdej unikalnej nazwy
    const uniqueStops = Array.from(
        new Map(matchedStops.map(stop => [stop.name.toLowerCase(), stop])).values()
    );

    if (uniqueStops.length === 1) {
        const stop = uniqueStops[0];
        const latlng = L.latLng(stop.lat, stop.lon);

        // Przesuń mapę do wyszukanego przystanku i ustaw zoom
        map.setView(latlng, 16);

        // Usuń wszystkie aktualne markery
        visibleMarkers.forEach(marker => map.removeLayer(marker));
        visibleMarkers = [];

        // Dodaj marker dla wyszukanego przystanku
        const marker = L.marker(latlng, { icon: busStopIcon })
            .bindPopup(`<b>${stop.name}</b><br>ID: ${stop.id}`)
            .addTo(map)
            .openPopup();

        visibleMarkers.push(marker);
    } else {
        // Obsługa przypadku, gdy jest wiele unikalnych nazw
        alert(`Znaleziono wiele przystanków (${uniqueStops.length}) pasujących do wyszukiwania. Wyświetlono pierwszy.`);
        const stop = uniqueStops[0];
        const latlng = L.latLng(stop.lat, stop.lon);

        map.setView(latlng, 16);

        visibleMarkers.forEach(marker => map.removeLayer(marker));
        visibleMarkers = [];

        const marker = L.marker(latlng, { icon: busStopIcon })
            .bindPopup(`<b>${stop.name}</b><br>ID: ${stop.id}`)
            .addTo(map)
            .openPopup();

        visibleMarkers.push(marker);
    }
}

// Nasłuchiwanie przesunięcia lub zoomowania mapy
map.on('moveend', updateVisibleStops);

// Wczytanie danych przystanków
loadStopsFromGTFS();
