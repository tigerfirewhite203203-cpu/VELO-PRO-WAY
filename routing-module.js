const I18N = {
    fr: {
        splash_sub: "Trace ta route",
        search_placeholder: "Rechercher un lieu...",
        road: "Route",
        mtb: "VTT",
        random: "Aléatoire",
        target_distance: "Distance cible",
        generate_route: "Générer un parcours",
        loop: "Boucle",
        distance: "Distance",
        duration: "Durée",
        ascent: "Dénivelé +",
        descent: "Dénivelé -",
        save_route: "💾 Sauvegarder",
        go: "🚀 GO",
        clear: "✕ Effacer",
        remaining: "Restant",
        stop_nav: "Arrêter la navigation",
        guest: "Invité",
        login_google: "Connexion Google",
        my_routes: "Mes parcours",
        history: "Historique",
        friends: "Amis",
        messages: "Messages",
        settings: "Paramètres",
        no_saved: "Aucun parcours sauvegardé",
        no_history: "Aucun historique",
        no_friends: "Aucun ami ajouté",
        no_messages: "Aucun message",
        friend_email: "Email de l'ami...",
        language: "Langue",
        units: "Unités",
        map_style: "Style carte",
        avg_speed: "Vitesse moyenne (km/h)",
        route_saved: "Parcours sauvegardé !",
        route_deleted: "Parcours supprimé",
        generating: "Génération du parcours...",
        no_start: "Cliquez sur la carte pour définir un point de départ",
        click_map: "Cliquez pour ajouter des points ou générez auto",
        nav_start: "Navigation démarrée",
        nav_stop: "Navigation terminée",
        share_route: "Partager le parcours",
        send_to: "Envoyer à",
        route_name: "Nom du parcours",
        unnamed_route: "Parcours sans nom",
        confirm_delete: "Supprimer ce parcours ?",
        go_direction: "Allez vers le parcours",
        follow_road: "Suivre la route",
        turn_left: "Tourner à gauche",
        turn_right: "Tourner à droite",
        arrived: "Arrivée !",
        continue_straight: "Continuer tout droit",
        error_route: "Erreur de calcul du parcours",
        error_location: "Impossible d'obtenir votre position",
    },
    en: {
        splash_sub: "Trace your route",
        search_placeholder: "Search a place...",
        road: "Road",
        mtb: "MTB",
        random: "Random",
        target_distance: "Target distance",
        generate_route: "Generate route",
        loop: "Loop",
        distance: "Distance",
        duration: "Duration",
        ascent: "Ascent",
        descent: "Descent",
        save_route: "💾 Save",
        go: "🚀 GO",
        clear: "✕ Clear",
        remaining: "Remaining",
        stop_nav: "Stop navigation",
        guest: "Guest",
        login_google: "Google Login",
        my_routes: "My routes",
        history: "History",
        friends: "Friends",
        messages: "Messages",
        settings: "Settings",
        no_saved: "No saved routes",
        no_history: "No history",
        no_friends: "No friends added",
        no_messages: "No messages",
        friend_email: "Friend's email...",
        language: "Language",
        units: "Units",
        map_style: "Map style",
        avg_speed: "Average speed (km/h)",
        route_saved: "Route saved!",
        route_deleted: "Route deleted",
        generating: "Generating route...",
        no_start: "Click the map to set a starting point",
        click_map: "Click to add points or auto-generate",
        nav_start: "Navigation started",
        nav_stop: "Navigation stopped",
        share_route: "Share route",
        send_to: "Send to",
        route_name: "Route name",
        unnamed_route: "Unnamed route",
        confirm_delete: "Delete this route?",
        go_direction: "Head to the route",
        follow_road: "Follow the road",
        turn_left: "Turn left",
        turn_right: "Turn right",
        arrived: "Arrived!",
        continue_straight: "Continue straight",
        error_route: "Route calculation error",
        error_location: "Unable to get your location",
    }
};

let currentLang = localStorage.getItem('veloway_lang') || 'fr';

function t(key) {
    return (I18N[currentLang] && I18N[currentLang][key]) || (I18N['fr'] && I18N['fr'][key]) || key;
}

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('veloway_lang', lang);
    applyI18n();
}
