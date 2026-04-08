# 🚴 VéloWay — PWA Vélo

Application web progressive pour planifier et suivre tes parcours vélo.

## Fonctionnalités

- **Carte satellite** avec waypoints (clic ou recherche d'adresse)
- **Génération auto** de parcours selon distance + type (Route / VTT / Aléatoire)
- **Boucle ou point à point** selon l'envie
- **Stats** : distance, durée estimée, dénivelé +/-, profil d'élévation
- **Mode GO** : navigation GPS tour par tour en temps réel
- **Sauvegarde** des parcours pour les refaire plus tard
- **Amis, messages, historique** (stockage local, prêt pour Firebase)
- **FR / EN** avec sélecteur dans les paramètres
- **Installable** sur iPhone via "Ajouter à l'écran d'accueil"

## Déploiement sur GitHub Pages

1. Créer un repo GitHub (ex: `veloway`)
2. Pousser tous les fichiers :
   ```bash
   git init
   git add .
   git commit -m "VéloWay v1"
   git remote add origin https://github.com/TON_USER/veloway.git
   git push -u origin main
   ```
3. Settings → Pages → Source: `main` / `root` → Save
4. L'app sera dispo sur `https://TON_USER.github.io/veloway/`

## Installation iPhone

1. Ouvrir le lien GitHub Pages dans Safari
2. Bouton partager (↑) → "Sur l'écran d'accueil"
3. L'app s'ouvre en plein écran comme une app native

## APIs utilisées (gratuites, sans clé)

| Service | Usage |
|---------|-------|
| Leaflet + ESRI | Carte satellite |
| OSRM | Calcul d'itinéraire vélo |
| Nominatim | Recherche de lieux |
| OpenTopoData | Données d'élévation |
| Chart.js | Graphique d'altitude |

## Pour ajouter Firebase (social complet)

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com)
2. Activer Authentication (Google)
3. Activer Firestore Database
4. Remplacer la config dans `js/social-module.js` par les vraies clés Firebase
5. Les fonctions amis/messages/GPS live deviendront multi-utilisateurs

## Structure

```
veloway/
├── index.html          # Shell principal
├── manifest.json       # Config PWA
├── sw.js               # Service Worker (offline)
├── css/style.css       # Styles (dark theme)
├── icons/              # Icônes PWA
└── js/
    ├── i18n.js         # Traductions FR/EN
    ├── map-module.js   # Carte Leaflet
    ├── routing-module.js   # Calcul parcours OSRM
    ├── navigation-module.js # Mode navigation GPS
    ├── social-module.js     # Auth, amis, sauvegarde
    ├── app.js          # Contrôleur principal
    └── sw-register.js  # Enregistrement Service Worker
```
