var map = L.map('map-background', {
    center: [59.9139, 10.7522],
    zoom: 13,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

var angle = 0;
var radius = 0.008;
var center = map.getCenter();
var zoomDirection = 1;
var currentZoom = 13;

function animateMap() {
    angle += 0.003;
    var newLat = center.lat + Math.sin(angle) * radius;
    var newLng = center.lng + Math.cos(angle) * radius;

    if (Math.random() < 0.01) {
        if (currentZoom >= 14) zoomDirection = -1;
        if (currentZoom <= 12) zoomDirection = 1;
        currentZoom += zoomDirection * 0.02;
        map.setZoom(currentZoom, { animate: true });
    }

    map.panTo([newLat, newLng], {
        animate: true,
        duration: 1,
        easeLinearity: 0.1
    });

    requestAnimationFrame(animateMap);
}

setTimeout(function() {
    animateMap();
}, 1000);