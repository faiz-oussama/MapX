const map = L.map('map', { zoomControl: false }).setView([33.589886, -7.603869], 13);
let osm = null;
let neabySearchMarker = null;

// Map Layers
let osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let googleSatelliteLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});

// Add event listener for map resize
window.addEventListener('resize', function() {
    map.invalidateSize(); // Ensure the map adjusts to the container size
});

// Zooming controls
let zoomIn = () => map.zoomIn();
let zoomOut = () => map.zoomOut();

// Handle map clicks
map.on('click', function(e) {
    const latitude = e.latlng.lat;
    const longitude = e.latlng.lng;

    SidebarController.handleCoordsChange(latitude, longitude);

    // Remove previous marker
    if (neabySearchMarker) neabySearchMarker.remove();

    let icon = L.icon({
        iconUrl: '../images/x-marker.png',
        iconSize: [26, 26],
    });

    neabySearchMarker = L.marker([latitude, longitude], {
        riseOnHover: true,
        bounceOnAdd: false,
        icon: icon,
    }).addTo(map);
    neabySearchMarker.bindPopup("Nearby search coords");
});

// Layer switching functions
function switchToGoogleSatelliteLayer() {
    map.removeLayer(osmLayer);
    map.addLayer(googleSatelliteLayer);
}

function switchToOSMLayer() {
    map.removeLayer(googleSatelliteLayer);
    map.addLayer(osmLayer);
}

// Pan the map to the given location
let searchMarker = null;

function goToLocation(location) {
    map.flyTo([location.location.latitude, location.location.longitude], 13);

    if (searchMarker) {
        searchMarker.remove();
    }

    searchMarker = L.marker([location.location.latitude, location.location.longitude], {
        riseOnHover: true,
        bounceOnAdd: false,
        title: location.displayName.text,
    }).on('click', function () {
        LeafletMapController.handleMarkerClick(JSON.stringify(location));
    }).addTo(map);
}

// Remove marker from map
function removeLocationMarker() {
    if (searchMarker) {
        map.removeLayer(searchMarker);
        searchMarker = null;
    }
}

// Get device location
function getDeviceLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            map.flyTo([lat, lon], 13);
            addSearchMarker(lat, lon, "Your Location");
        }, function(error) {
            alert("Error getting your location: " + error.message);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Add search marker
function addSearchMarker(lat, lon, displayName) {
    if (searchMarker) {
        searchMarker.remove();
    }

    searchMarker = L.marker([lat, lon]).addTo(map);
    searchMarker.bindPopup(displayName).openPopup();
}

// Place nearby places markers
let circle = null;
let markers = [];
let locationCircles = [];

function placeMarkers(locations, center, radius, markerRadius) {
    if (circle) circle.remove();
    if (markers) markers.forEach(marker => marker.remove());
    if (locationCircles) locationCircles.forEach(circle => circle.remove());

    circle = L.circle([center.location.latitude, center.location.longitude], {
        radius: radius,
        fillColor: '#65B741',
        fillOpacity: 0.12,
        color: '#163020',
        weight: 1,
    }).addTo(map);

    const greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    markers = locations.map(location => {
        return L.marker([location.location.latitude, location.location.longitude], {
            riseOnHover: true,
            bounceOnAdd: true,
            icon: greenIcon,
            title: location.displayName.text,
        }).on('click', function () {
            LeafletMapController.handleMarkerClick(JSON.stringify(location));
        }).addTo(map);
    });

    locationCircles = locations.map(location => {
        return L.circle([location.location.latitude, location.location.longitude], {
            radius: markerRadius,
            fillColor: '#0952ff',
            fillOpacity: 0.12,
            color: '#163020',
            weight: 1,
        }).addTo(map);
    });

    map.fitBounds(circle.getBounds());
}

// Remove places markers
function removePLacesMarkers() {
    if (markers) markers.forEach(marker => marker.remove());
    if (circle) circle.remove();
}

// Search location using OpenStreetMap Nominatim API
function searchLocation(query) {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1`;

    fetch(geocodeUrl)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                map.flyTo([lat, lon], 13);
                addSearchMarker(lat, lon, data[0].display_name);
            } else {
                alert("Location not found!");
            }
        })
        .catch(err => alert("Error fetching location: " + err));
}
