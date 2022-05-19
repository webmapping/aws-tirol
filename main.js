/* Wetterstationen Tirol Beispiel */

let innsbruck = {
    lat: 47.267222,
    lng: 11.392778,
    zoom: 11
};

// WMTS Hintergrundlayer von https://lawinen.report (CC BY avalanche.report) als Startlayer
let startLayer = L.tileLayer("https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
    attribution: '&copy; <a href="https://lawinen.report">CC BY avalanche.report</a>'
})

// Overlays Objekt für die thematischen Layer
let overlays = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    precipitation: L.featureGroup(),
    snowheight: L.featureGroup(),
    wind: L.featureGroup(),
};

// Karte initialisieren
let map = L.map("map", {
    center: [innsbruck.lat, innsbruck.lng],
    zoom: innsbruck.zoom,
    layers: [
        startLayer
    ],
});

// Layer control mit WMTS Hintergründen und Overlays
let layerControl = L.control.layers({
    "Relief avalanche.report": startLayer,
    "Esri World Imagery": L.tileLayer.provider("Esri.WorldImagery"),
}, {
    "Wetterstationen": overlays.stations,
    "Temperatur": overlays.temperature,
    "Niederschlag": overlays.precipitation,
    "Schneehöhe": overlays.snowheight,
    "Wind": overlays.wind
}).addTo(map);

// Layer control ausklappen
layerControl.expand();

// Maßstab control
L.control.scale({
    imperial: false
}).addTo(map);

// Fullscreen control
L.control.fullscreen().addTo(map);

// diese Layer beim Laden anzeigen
overlays.temperature.addTo(map);

// Farben nach Wert und Schwellen ermitteln
let getColor = function(value, ramp) {
    //console.log(value,ramp);
    for (let rule of ramp) {
        //console.log(rule)
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }
};
//console.log(getColor(-40, COLORS.temperature));

// Wetterstationen mit Icons und Popups
let drawStations = function(geojson) {
    L.geoJSON(geojson, {
        pointToLayer: function(geoJsonPoint, latlng) {
            let popup = `
                ${geoJsonPoint.properties.name} (${geoJsonPoint.geometry.coordinates[2]}m)
            `;
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: "icons/wifi.png",
                    iconAnchor: [16, 37],
                    popupAnchor: [0, -37]
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.stations);
}

// Temperatur
let drawTemperature = function(geojson) {
    L.geoJSON(geojson, {
        filter: function(geoJsonPoint) {
            if (geoJsonPoint.properties.LT > -50 && geoJsonPoint.properties.LT < 50) {
                return true;
            }
        },
        pointToLayer: function(geoJsonPoint, latlng) {
            let popup = `
                ${geoJsonPoint.properties.name} (${geoJsonPoint.geometry.coordinates[2]}m)
            `;
            let color = getColor(
                geoJsonPoint.properties.LT,
                COLORS.temperature
            );

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span>${geoJsonPoint.properties.LT.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.temperature);
}

// Wetterstationen
async function loadData(url) {
    let response = await fetch(url);
    let geojson = await response.json();

    drawStations(geojson);
    drawTemperature(geojson);
}
loadData("https://static.avalanche.report/weather_stations/stations.geojson");