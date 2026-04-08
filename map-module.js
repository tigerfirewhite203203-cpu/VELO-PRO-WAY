const NavigationModule = (() => {
    let isNavigating = false;
    let watchId = null;
    let routeCoords = [];
    let routeSteps = [];
    let currentStepIndex = 0;
    let startTime = null;
    let totalDistance = 0;
    let onUpdate = null;
    let onEnd = null;

    function start(coords, steps, distance, callbacks) {
        isNavigating = true;
        routeCoords = coords;
        routeSteps = steps || [];
        totalDistance = distance;
        currentStepIndex = 0;
        startTime = Date.now();
        onUpdate = callbacks.onUpdate || (() => {});
        onEnd = callbacks.onEnd || (() => {});

        // Start watching GPS
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                onPosition,
                onError,
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
            );
        }

        onUpdate({
            type: 'start',
            instruction: t('go_direction'),
            arrow: '↑',
            remainingDist: totalDistance,
            speed: 0,
            eta: '--:--'
        });
    }

    function stop() {
        isNavigating = false;
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
        if (onEnd) onEnd();
    }

    function onPosition(pos) {
        if (!isNavigating) return;

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const speed = pos.coords.speed || 0; // m/s
        const speedKmh = Math.round(speed * 3.6);

        // Update user location on map
        MapModule.updateUserLocation(lat, lng);

        // Find closest point on route
        let minDist = Infinity;
        let closestIdx = 0;
        for (let i = 0; i < routeCoords.length; i++) {
            const d = haversine(lat, lng, routeCoords[i][0], routeCoords[i][1]);
            if (d < minDist) {
                minDist = d;
                closestIdx = i;
            }
        }

        // Calculate remaining distance
        let remaining = 0;
        for (let i = closestIdx; i < routeCoords.length - 1; i++) {
            remaining += haversine(
                routeCoords[i][0], routeCoords[i][1],
                routeCoords[i + 1][0], routeCoords[i + 1][1]
            );
        }

        // ETA
        let eta = '--:--';
        if (speedKmh > 2) {
            const etaMin = Math.round((remaining / 1000) / (speedKmh) * 60);
            const h = Math.floor(etaMin / 60);
            const m = etaMin % 60;
            eta = h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m} min`;
        }

        // Find current step
        let instruction = t('follow_road');
        let arrow = '↑';

        if (routeSteps.length > currentStepIndex) {
            const step = routeSteps[currentStepIndex];
            if (step.maneuver) {
                const loc = step.maneuver.location;
                const distToManeuver = haversine(lat, lng, loc[1], loc[0]);
                if (distToManeuver < 30) {
                    currentStepIndex++;
                }
                const modifier = step.maneuver.modifier || '';
                const type = step.maneuver.type || '';

                if (type === 'arrive') {
                    instruction = t('arrived');
                    arrow = '🏁';
                } else if (modifier.includes('left')) {
                    instruction = t('turn_left');
                    arrow = '←';
                } else if (modifier.includes('right')) {
                    instruction = t('turn_right');
                    arrow = '→';
                } else {
                    instruction = t('continue_straight');
                    arrow = '↑';
                }

                if (step.name) {
                    instruction += ` — ${step.name}`;
                }
            }
        }

        // Check if arrived (< 50m from end)
        if (remaining < 50) {
            instruction = t('arrived');
            arrow = '🏁';
        }

        // Center map on user with rotation
        MapModule.panTo(lat, lng);

        onUpdate({
            type: 'update',
            instruction,
            arrow,
            remainingDist: remaining,
            speed: speedKmh,
            eta,
            lat, lng
        });
    }

    function onError(err) {
        console.warn('GPS error:', err);
    }

    function haversine(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function isActive() { return isNavigating; }

    return { start, stop, isActive };
})();
