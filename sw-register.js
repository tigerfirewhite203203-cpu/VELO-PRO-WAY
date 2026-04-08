document.addEventListener('DOMContentLoaded', () => {
    // ===== State =====
    let currentRoute = null;
    let elevationData = null;
    let elevationChart = null;
    let routeType = 'road';
    let avgSpeed = 20;

    // ===== Init =====
    setTimeout(() => {
        document.getElementById('splash').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        init();
    }, 2800);

    function init() {
        // Apply saved settings
        const savedLang = SocialModule.getSetting('lang', 'fr');
        const savedStyle = SocialModule.getSetting('mapStyle', 'satellite');
        avgSpeed = SocialModule.getSetting('avgSpeed', 20);

        setLang(savedLang);
        document.getElementById('lang-select').value = savedLang;
        document.getElementById('map-style-select').value = savedStyle;
        document.getElementById('avg-speed').value = avgSpeed;

        // Init map
        MapModule.init('map', onWaypointsChanged);
        MapModule.setTileStyle(savedStyle);

        // Bind events
        bindUI();

        applyI18n();
    }

    // ===== UI Bindings =====
    function bindUI() {
        // Menu
        document.getElementById('btn-menu').addEventListener('click', () => {
            document.getElementById('side-menu').classList.remove('hidden');
        });
        document.getElementById('menu-overlay').addEventListener('click', closeMenu);

        // Profile
        document.getElementById('btn-profile').addEventListener('click', () => {
            document.getElementById('side-menu').classList.remove('hidden');
        });

        // Login
        document.getElementById('btn-login').addEventListener('click', () => {
            SocialModule.loginGoogle(onAuthChanged);
        });

        // Auth init
        SocialModule.initAuth(onAuthChanged);

        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const panel = item.dataset.panel;
                closeMenu();
                openPanel(panel);
            });
        });

        // Back buttons
        ['saved', 'history', 'friends', 'messages', 'settings'].forEach(p => {
            const btn = document.getElementById(`btn-back-${p}`);
            if (btn) btn.addEventListener('click', () => closePanel(p));
        });

        // Search
        const searchInput = document.getElementById('search-input');
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => searchPlace(searchInput.value), 500);
        });
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length > 2) searchPlace(searchInput.value);
        });

        // Route type
        document.querySelectorAll('.route-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.route-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                routeType = btn.dataset.type;
            });
        });

        // Distance slider
        const slider = document.getElementById('distance-slider');
        const distanceValue = document.getElementById('distance-value');
        slider.addEventListener('input', () => {
            distanceValue.textContent = `${slider.value} km`;
        });

        // Generate route
        document.getElementById('btn-generate').addEventListener('click', generateRoute);

        // Save
        document.getElementById('btn-save').addEventListener('click', saveCurrentRoute);

        // GO
        document.getElementById('btn-go').addEventListener('click', startNavigation);

        // Clear
        document.getElementById('btn-clear').addEventListener('click', clearAll);

        // Stop nav
        document.getElementById('btn-stop-nav').addEventListener('click', stopNavigation);

        // Settings changes
        document.getElementById('lang-select').addEventListener('change', (e) => {
            setLang(e.target.value);
            SocialModule.setSetting('lang', e.target.value);
        });
        document.getElementById('map-style-select').addEventListener('change', (e) => {
            MapModule.setTileStyle(e.target.value);
            SocialModule.setSetting('mapStyle', e.target.value);
        });
        document.getElementById('avg-speed').addEventListener('change', (e) => {
            avgSpeed = parseInt(e.target.value) || 20;
            SocialModule.setSetting('avgSpeed', avgSpeed);
        });

        // Friends
        document.getElementById('btn-add-friend').addEventListener('click', () => {
            const email = document.getElementById('friend-email').value.trim();
            if (email) {
                SocialModule.addFriend(email);
                document.getElementById('friend-email').value = '';
                renderFriends();
                showToast('Ami ajouté !');
            }
        });
    }

    // ===== Search =====
    async function searchPlace(query) {
        const results = document.getElementById('search-results');
        if (query.length < 3) {
            results.classList.add('hidden');
            return;
        }

        const places = await MapModule.geocode(query);
        if (places.length === 0) {
            results.classList.add('hidden');
            return;
        }

        results.innerHTML = places.map(p => `
            <div class="search-result-item" data-lat="${p.lat}" data-lng="${p.lon}">
                ${p.display_name}
            </div>
        `).join('');

        results.classList.remove('hidden');
        results.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                MapModule.panTo(lat, lng, 15);
                MapModule.addWaypoint(lat, lng);
                results.classList.add('hidden');
                document.getElementById('search-input').value = '';
            });
        });
    }

    // Hide search results on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) {
            document.getElementById('search-results').classList.add('hidden');
        }
    });

    // ===== Waypoints Changed =====
    async function onWaypointsChanged() {
        const wps = MapModule.getWaypoints();
        if (wps.length < 2) return;

        // Auto-route through waypoints
        showToast(t('generating'));
        const route = await RoutingModule.getRoute(wps, routeType);
        if (route) {
            currentRoute = route;
            MapModule.drawRoute(route.coords);
            showStats(route);
            fetchElevation(route.coords);
        }
    }

    // ===== Generate Auto Route =====
    async function generateRoute() {
        const wps = MapModule.getWaypoints();
        let start;

        if (wps.length > 0) {
            start = wps[0];
        } else {
            // Use current location
            try {
                start = await MapModule.getUserLocation();
                MapModule.addWaypoint(start.lat, start.lng);
            } catch {
                showToast(t('no_start'));
                return;
            }
        }

        const targetKm = parseInt(document.getElementById('distance-slider').value);
        const isLoop = document.getElementById('loop-toggle').checked;

        showToast(t('generating'));

        const route = await RoutingModule.generateAutoRoute(start, targetKm, routeType, isLoop);
        if (route) {
            currentRoute = route;
            MapModule.drawRoute(route.coords);
            showStats(route);
            fetchElevation(route.coords);
        } else {
            showToast(t('error_route'));
        }
    }

    // ===== Stats =====
    function showStats(route) {
        document.getElementById('distance-panel').classList.add('hidden');
        document.getElementById('stats-panel').classList.remove('hidden');

        document.getElementById('stat-distance').textContent = RoutingModule.formatDistance(route.distance);
        document.getElementById('stat-duration').textContent = RoutingModule.formatDuration(route.duration, avgSpeed);
        // Elevation will be updated when fetched
        document.getElementById('stat-ascent').textContent = '...';
        document.getElementById('stat-descent').textContent = '...';
    }

    async function fetchElevation(coords) {
        elevationData = await RoutingModule.getElevation(coords);
        if (elevationData) {
            document.getElementById('stat-ascent').textContent = `${elevationData.totalAscent} m`;
            document.getElementById('stat-descent').textContent = `${elevationData.totalDescent} m`;
            drawElevationChart(elevationData);
        }
    }

    function drawElevationChart(data) {
        const canvas = document.getElementById('elevation-canvas');
        if (elevationChart) elevationChart.destroy();

        const labels = data.profile.map((_, i) => {
            const pct = (i / data.profile.length) * 100;
            return `${pct.toFixed(0)}%`;
        });

        elevationChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: data.profile,
                    borderColor: '#00e676',
                    backgroundColor: 'rgba(0, 230, 118, 0.15)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${Math.round(ctx.raw)} m`
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: {
                            color: '#5a6478',
                            font: { size: 10, family: 'JetBrains Mono' },
                            callback: v => `${v}m`
                        }
                    }
                }
            }
        });
    }

    // ===== Save Route =====
    function saveCurrentRoute() {
        if (!currentRoute) return;

        const name = prompt(t('route_name'), t('unnamed_route'));
        if (name === null) return;

        SocialModule.saveRoute({
            name: name || t('unnamed_route'),
            distance: currentRoute.distance,
            duration: currentRoute.duration,
            coords: currentRoute.coords,
            steps: currentRoute.steps,
            waypoints: MapModule.getWaypoints(),
            elevation: elevationData,
            type: routeType
        });

        showToast(t('route_saved'));
    }

    // ===== Navigation =====
    function startNavigation() {
        if (!currentRoute) return;

        document.getElementById('stats-panel').classList.add('hidden');
        document.getElementById('nav-mode').classList.remove('hidden');
        document.getElementById('route-type-selector').classList.add('hidden');
        document.getElementById('search-bar').style.display = 'none';

        NavigationModule.start(
            currentRoute.coords,
            currentRoute.steps,
            currentRoute.distance,
            {
                onUpdate: (data) => {
                    document.getElementById('nav-arrow').textContent = data.arrow;
                    document.getElementById('nav-text').textContent = data.instruction;
                    document.getElementById('nav-remaining-dist').textContent =
                        RoutingModule.formatDistance(data.remainingDist);
                    document.getElementById('nav-speed').textContent = data.speed;
                    document.getElementById('nav-eta').textContent = data.eta;
                },
                onEnd: () => {
                    stopNavigation();
                }
            }
        );

        // Add to history
        SocialModule.addToHistory({
            distance: currentRoute.distance,
            duration: currentRoute.duration,
            type: routeType
        });

        showToast(t('nav_start'));
    }

    function stopNavigation() {
        NavigationModule.stop();
        document.getElementById('nav-mode').classList.add('hidden');
        document.getElementById('stats-panel').classList.remove('hidden');
        document.getElementById('route-type-selector').classList.remove('hidden');
        document.getElementById('search-bar').style.display = '';
        showToast(t('nav_stop'));
    }

    // ===== Clear =====
    function clearAll() {
        MapModule.clearWaypoints();
        currentRoute = null;
        elevationData = null;
        if (elevationChart) { elevationChart.destroy(); elevationChart = null; }
        document.getElementById('stats-panel').classList.add('hidden');
        document.getElementById('distance-panel').classList.remove('hidden');
    }

    // ===== Menu/Panels =====
    function closeMenu() {
        document.getElementById('side-menu').classList.add('hidden');
    }

    function openPanel(name) {
        const panel = document.getElementById(`panel-${name}`);
        if (!panel) return;
        panel.classList.remove('hidden');

        if (name === 'saved') renderSavedRoutes();
        if (name === 'history') renderHistory();
        if (name === 'friends') renderFriends();
        if (name === 'messages') renderMessages();
    }

    function closePanel(name) {
        document.getElementById(`panel-${name}`).classList.add('hidden');
    }

    // ===== Auth =====
    function onAuthChanged(user) {
        const usernameEl = document.getElementById('menu-username');
        const loginBtn = document.getElementById('btn-login');
        const avatarEl = document.getElementById('menu-avatar');

        if (user) {
            usernameEl.textContent = user.displayName || user.email;
            loginBtn.textContent = 'Déconnexion';
            loginBtn.onclick = () => SocialModule.logout(onAuthChanged);
            if (user.photoURL) {
                avatarEl.innerHTML = `<img src="${user.photoURL}" alt="">`;
            }
        } else {
            usernameEl.textContent = t('guest');
            loginBtn.textContent = t('login_google');
            loginBtn.onclick = () => SocialModule.loginGoogle(onAuthChanged);
            avatarEl.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
        }
    }

    // ===== Render Lists =====
    function renderSavedRoutes() {
        const list = document.getElementById('saved-list');
        const routes = SocialModule.getSavedRoutes();

        if (routes.length === 0) {
            list.innerHTML = `<p class="empty-state">${t('no_saved')}</p>`;
            return;
        }

        list.innerHTML = routes.map(r => `
            <div class="saved-route-card" data-id="${r.id}">
                <div class="saved-route-info">
                    <h3>${r.name}</h3>
                    <p>${RoutingModule.formatDistance(r.distance)} · ${r.type || 'road'} · ${new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="saved-route-actions">
                    <button class="btn-load-route" data-id="${r.id}" title="Charger">🗺️</button>
                    <button class="btn-delete-route" data-id="${r.id}" title="Supprimer">🗑️</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.btn-load-route').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                loadRoute(btn.dataset.id);
                closePanel('saved');
            });
        });

        list.querySelectorAll('.btn-delete-route').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(t('confirm_delete'))) {
                    SocialModule.deleteRoute(btn.dataset.id);
                    renderSavedRoutes();
                    showToast(t('route_deleted'));
                }
            });
        });
    }

    function loadRoute(id) {
        const route = SocialModule.getRoute(id);
        if (!route) return;

        clearAll();

        // Restore waypoints
        if (route.waypoints) {
            route.waypoints.forEach(w => MapModule.addWaypoint(w.lat, w.lng));
        }

        // Draw route
        currentRoute = {
            coords: route.coords,
            distance: route.distance,
            duration: route.duration,
            steps: route.steps || []
        };
        elevationData = route.elevation;

        MapModule.drawRoute(route.coords);
        showStats(currentRoute);
        if (elevationData) {
            document.getElementById('stat-ascent').textContent = `${elevationData.totalAscent} m`;
            document.getElementById('stat-descent').textContent = `${elevationData.totalDescent} m`;
            drawElevationChart(elevationData);
        }
    }

    function renderHistory() {
        const list = document.getElementById('history-list');
        const history = SocialModule.getHistory();

        if (history.length === 0) {
            list.innerHTML = `<p class="empty-state">${t('no_history')}</p>`;
            return;
        }

        list.innerHTML = history.map(h => `
            <div class="saved-route-card">
                <div class="saved-route-info">
                    <h3>${RoutingModule.formatDistance(h.distance)}</h3>
                    <p>${h.type || 'road'} · ${new Date(h.date).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');
    }

    function renderFriends() {
        const list = document.getElementById('friends-list');
        const friends = SocialModule.getFriends();

        if (friends.length === 0) {
            list.innerHTML = `<p class="empty-state">${t('no_friends')}</p>`;
            return;
        }

        list.innerHTML = friends.map(f => `
            <div class="saved-route-card">
                <div class="saved-route-info">
                    <h3>${f.name}</h3>
                    <p>${f.email}</p>
                </div>
                <div class="saved-route-actions">
                    <button class="btn-remove-friend" data-id="${f.id}">✕</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.btn-remove-friend').forEach(btn => {
            btn.addEventListener('click', () => {
                SocialModule.removeFriend(btn.dataset.id);
                renderFriends();
            });
        });
    }

    function renderMessages() {
        const list = document.getElementById('messages-list');
        const messages = SocialModule.getMessages();

        if (messages.length === 0) {
            list.innerHTML = `<p class="empty-state">${t('no_messages')}</p>`;
            return;
        }

        list.innerHTML = messages.map(m => `
            <div class="saved-route-card">
                <div class="saved-route-info">
                    <h3>${m.content}</h3>
                    <p>${new Date(m.date).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');
    }

    // ===== Toast =====
    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2500);
    }
});
