const MapModule = (() => {
    let map, tileLayer;
    let waypoints = [];
    let waypointMarkers = [];
    let routePolyline = null;
    let userLocationMarker = null;
    let userLocationCircle = null;
    let onWaypointAdded = null;

    const TILES = {
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attr: 'Esri Satellite'
        },
        street: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attr: '© OpenStreetMap'
        },
        topo: {
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            attr: '© OpenTopoMap'
        }
    };

    function init(containerId, callback) {
        onWaypointAdded = callback;
        map = L.map(containerId, {
            zoomControl: false,
            attributionControl: true
        }).setView([45.75, 4.85], 13); // Lyon default

        setTileStyle('satellite');

        map.on('click', (e) => {
            addWaypoint(e.latlng.lat, e.latlng.lng);
        });

        // Try to get user location
        locateUser();
    }

    function setTileStyle(style) {
        const t = TILES[style] || TILES.satellite;
        if (tileLayer) map.removeLayer(tileLayer);
        tileLayer = L.tileLayer(t.url, {
            attribution: t.attr,
            maxZoom: 19
        }).addTo(map);
    }

    function locateUser() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                map.setView([lat, lng], 14);
                updateUserLocation(lat, lng);
            },
            () => {},
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    function updateUserLocation(lat, lng) {
        if (userLocationMarker) {
            userLocationMarker.setLatLng([lat, lng]);
            if (userLocationCircle) userLocationCircle.setLatLng([lat, lng]);
        } else {
            const icon = L.divIcon({
                className: 'user-location-marker',
                iconSize: [18, 18]
            });
            userLocationMarker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
        }
    }

    function addWaypoint(lat, lng, label) {
        const idx = waypoints.length;
        waypoints.push({ lat, lng });

        let iconClass = 'waypoint-marker';
        let html = `${idx + 1}`;
        if (idx === 0) {
            iconClass = 'start-marker';
            html = '';
        }

        const icon = L.divIcon({
            className: iconClass,
            html: html,
            iconSize: idx === 0 ? [16, 16] : [28, 28]
        });

        const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
        marker.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            waypoints[idx] = { lat: pos.lat, lng: pos.lng };
            if (onWaypointAdded) onWaypointAdded();
        });
        waypointMarkers.push(marker);

        if (onWaypointAdded) onWaypointAdded();
    }

    function getWaypoints() {
        return [...waypoints];
    }

    function clearWaypoints() {
        waypointMarkers.forEach(m => map.removeLayer(m));
        waypointMarkers = [];
        waypoints = [];
        clearRoute();
    }

    function drawRoute(coords, color = '#00e676') {
        clearRoute();
        if (!coords || coords.length < 2) return;
        routePolyline = L.polyline(coords, {
            color: color,
            weight: 5,
            opacity: 0.85,
            smoothFactor: 1,
            lineCap: 'round'
        }).addTo(map);
        map.fitBounds(routePolyline.getBounds(), { padding: [60, 60] });
    }

    function clearRoute() {
        if (routePolyline) {
            map.removeLayer(routePolyline);
            routePolyline = null;
        }
    }

    function getMap() { return map; }

    function panTo(lat, lng, zoom) {
        map.setView([lat, lng], zoom || map.getZoom());
    }

    async function geocode(query) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
            const res = await fetch(url);
            return await res.json();
        } catch {
            return [];
        }
    }

    function setStartPoint(lat, lng) {
        if (waypoints.length === 0) {
            addWaypoint(lat, lng);
        } else {
            waypoints[0] = { lat, lng };
            waypointMarkers[0].setLatLng([lat, lng]);
        }
    }

    function getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject('No geolocation');
            navigator.geolocation.getCurrentPosition(
                pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                err => reject(err),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    return {
        init, setTileStyle, addWaypoint, getWaypoints, clearWaypoints,
        drawRoute, clearRoute, getMap, panTo, geocode, setStartPoint,
        updateUserLocation, getUserLocation, locateUser
    };
})();
