let selectedFile = null;
let currentObstacleGeometry = null; // store restored or newly drawn geometry for submission

// If editing, show existing image preview provided by server
(function initExistingPreview() {
    // Read server-provided form model exposed as window.formData
    const formModel = window.formData || {};
    const existingPath = formModel.ExistingImagePath || '';
    if (existingPath && existingPath.length > 0) {
        const preview = document.getElementById('imagePreview');
        const info = document.getElementById('imageInfo');
        preview.src = existingPath;
        preview.style.display = 'block';
        info.textContent = 'Existing image attached';
        info.style.display = 'block';
    }
})();

document.getElementById('uploadImageButton').addEventListener('click', function () {
    document.getElementById('uploadImageInput').click();
});

document.getElementById('openCameraButton').addEventListener('click', function () {
    document.getElementById('cameraInput').click();
});

// Image upload validation based on allowed extensions and size, client-side only
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const maxFileBytes = 5 * 1024 * 1024; // 5 MB

function getFileExtension(name) {
    if (!name) return '';
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.substring(i).toLowerCase() : '';
}

// Validate image file based on allowed extensions and size, client-side only
function validateImageFile(file) {
    if (!file) return 'No file selected.';
    if (file.size === 0) return 'File is empty.';
    if (file.size > maxFileBytes) return 'File is too large. Max allowed size is 5 MB.';
    if (file.type && !file.type.startsWith('image/')) {
        // sometimes camera inputs do not set type; still check extension below
        const ext = getFileExtension(file.name);
        if (!allowedExtensions.includes(ext)) return 'Invalid file type. Allowed types: ' + allowedExtensions.join(', ');
    } else {
        const ext = getFileExtension(file.name);
        if (!allowedExtensions.includes(ext)) return 'Invalid file type. Allowed types: ' + allowedExtensions.join(', ');
    }
    return '';
}

function displayImagePreview(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = function (e) {
        const preview = document.getElementById('imagePreview');
        const info = document.getElementById('imageInfo');
        const err = document.getElementById('imageError');
        if (err) { err.style.display = 'none'; err.textContent = ''; }

        preview.src = e.target.result;
        preview.style.display = 'block';

        // Show file info
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        info.textContent = `File: ${file.name} (${sizeInMB} MB)`;
        info.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function handleFileSelection(inputElement, file) {
    const errorEl = document.getElementById('imageError');
    const preview = document.getElementById('imagePreview');
    const info = document.getElementById('imageInfo');
    if (!file) {
        // clear
        if (preview) preview.style.display = 'none';
        if (info) info.style.display = 'none';
        if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
        return;
    }

    // validate client-side and show friendly error
    const validationMessage = validateImageFile(file);
    if (validationMessage) {
        console.warn('Invalid image selected:', validationMessage);
        // clear inputs and preview
        inputElement.value = '';
        const otherInput = inputElement.id === 'uploadImageInput' ? document.getElementById('cameraInput') : document.getElementById('uploadImageInput');
        if (otherInput) otherInput.value = '';
        if (preview) preview.style.display = 'none';
        if (info) info.style.display = 'none';
        if (errorEl) { errorEl.textContent = validationMessage + ' Allowed: ' + allowedExtensions.join(', ') + '. Max size: 5 MB.'; errorEl.style.display = 'block'; }
        selectedFile = null;
        return;
    }

    console.log('Image selected:', file.name);
    displayImagePreview(file);
    // Clear the other input to prevent conflicts
    const otherInput = inputElement.id === 'uploadImageInput' ? document.getElementById('cameraInput') : document.getElementById('uploadImageInput');
    if (otherInput) otherInput.value = '';
}

document.getElementById('uploadImageInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    handleFileSelection(this, file);
});

document.getElementById('cameraInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    handleFileSelection(this, file);
});

// Initialize map with starting location
let map = L.map('map').setView([58.163137,8.002106], 13);

let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
osm.addTo(map);

// Add locate control button to the map
let lc = L.control
    .locate({
        position: 'topleft', flyTo: true, setView: 'always', cacheLocation: true,
        locateOptions: {
            maxZoom: 16,
            enableHighAccuracy: true,
            watch: true
        }
    }).addTo(map);

lc.getContainer().id = "locate-button";
lc.start();

// When user activates the locate control, resume live updates and clear marker/manual overrides
(function() {
    const locateBtn = document.getElementById('locate-button');
    if (!locateBtn) return;
    locateBtn.addEventListener('click', function () {
        // allow live location to be used again
        markerPlaced = false;
        manualOverride = false;
        try { drawnItems.clearLayers(); } catch (ex) { }

        // ensure locate/watch is running
        try {
            lc.start();
            map.locate({ watch: true, setView: false, enableHighAccuracy: true });
        } catch (ex) { console.warn('Failed to restart locate', ex); }
    });
})();

// Also start the browser geolocation explicitly to ensure 'locationfound' events fire
try {
    map.locate({ watch: true, setView: false, enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 });
} catch (ex) {
    console.warn('map.locate failed', ex);
}

// show geolocation errors in console and notify user if needed
map.on('locationerror', function(ev) {
    console.warn('locationerror', ev);
});

// State flags
let markerPlaced = false;
let manualOverride = false;

// Helper to update geometry and previews from a lat/lng pair
function updateFromLatLng(lat, lng, accuracy = null, source = 'manual') {
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return;

    const coords = [lng, lat];
    const feature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: { source: source }
    };

    const json = JSON.stringify(feature);

    const geoEl = document.getElementById('GeometryGeoJson');
    if (geoEl) geoEl.value = json;
    const previewEl = document.getElementById('MarkerCoordinatesJSON');
    if (previewEl) previewEl.value = json;

    // set accuracy hidden field ONLY when the source is live (browser geolocation)
    const accEl = document.getElementById('Accuracy');
    if (accEl) {
        if (source === 'live' && accuracy != null && !Number.isNaN(accuracy)) {
            // Only persist accuracy when it came from live geolocation updates
            accEl.value = Math.round(accuracy);
            window.lastAccuracy = parseInt(accEl.value, 10);
            console.debug('updateFromLatLng (live) set Accuracy =', accEl.value);
        } else {
            // Clear accuracy when coordinates are from marker/manual so it's not submitted
            accEl.value = '';
        }
    }

    // Update lat/lng inputs (format to 6 decimals)
    const latEl = document.getElementById('Latitude');
    const lngEl = document.getElementById('Longitude');
    if (latEl) latEl.value = (typeof lat === 'number' && isFinite(lat)) ? lat.toFixed(6) : String(lat);
    if (lngEl) lngEl.value = (typeof lng === 'number' && isFinite(lng)) ? lng.toFixed(6) : String(lng);
}

map.on('locationfound', function(e) {
    // only update if no marker placed and user didn't manually override
    //if (markerPlaced || manualOverride) return;

    drawnItems.clearLayers();
    let lat = e.latlng.lat;
    let lng = e.latlng.lng;
    let radius = e.accuracy;
    let altitude = e.latlng.alt;

    let LiveCoordinatesJSON = {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [lng, lat] },
        "properties": { "accuracy": radius, "altitude": altitude }
    };
    let liveCoordinatesJSONString = JSON.stringify(LiveCoordinatesJSON);
    let liveCoordinates = "Lat: " + lat + "\nLng: " + lng + "\nAccuracy: " + radius + "m" + "\nJSON: " + liveCoordinatesJSONString;
    const liveEl = document.getElementById("LiveCoordinates");
    if (liveEl) liveEl.value = liveCoordinates;
    // update the lat/lng fields and geometry
    // pass the reported accuracy through to updateFromLatLng with source 'live'
    updateFromLatLng(lat, lng, radius, 'live');
});

let drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

let drawControl = new L.Control.Draw({
    draw: {
        polygon: false,
        polyline: true, // enable polyline drawing
        marker: true,
        circle: false,
        circlemarker: false,
        rectangle: false
    },
    edit: { featureGroup: drawnItems }
});
map.addControl(drawControl);

// Drawing mode state and helpers
let drawingMode = 'point'; // 'point' or 'line'
let activeDrawer = null;

function setDrawingMode(mode) {
    drawingMode = mode;
    // clear any existing temporary layers
    drawnItems.clearLayers();
    markerPlaced = false;
    manualOverride = false;

    // stop any active drawer
    try {
        if (activeDrawer && typeof activeDrawer.disable === 'function') activeDrawer.disable();
    } catch (ex) { /* ignore */ }

    if (mode === 'line') {
        // programmatically start polyline drawing
        const polylineOptions = drawControl.options.draw.polyline || {};
        activeDrawer = new L.Draw.Polyline(map, polylineOptions);
        activeDrawer.enable();
        // give visual feedback to buttons if present
        const btnLine = document.getElementById('pointModeBtn');
        if (btnLine) btnLine.classList.remove('active');
        const btnPoint = document.getElementById('lineModeBtn');
        if (btnPoint) btnPoint.classList.add('active');
    } else {
        // programmatically start marker placement so user can click map to place point
        const markerOptions = drawControl.options.draw.marker || {};
        activeDrawer = new L.Draw.Marker(map, markerOptions);
        activeDrawer.enable();
        const btnLine = document.getElementById('pointModeBtn');
        if (btnLine) btnLine.classList.add('active');
        const btnPoint = document.getElementById('lineModeBtn');
        if (btnPoint) btnPoint.classList.remove('active');
    }
}

// Wire up optional buttons if present in the page
(function wireModeButtons() {
    const pBtn = document.getElementById('pointModeBtn');
    const lBtn = document.getElementById('lineModeBtn');
    if (pBtn) pBtn.addEventListener('click', function () { setDrawingMode('point'); });
    if (lBtn) lBtn.addEventListener('click', function () { setDrawingMode('line'); });
})();


map.on(L.Draw.Event.CREATED, function (e) {
    // When a marker is drawn, stop live tracking and use marker coordinates
    drawnItems.clearLayers();
    let layer = e.layer;
    lc.stop();
    markerPlaced = true;
    manualOverride = false; // marker is explicit placement

    drawnItems.addLayer(layer);
    let geoJsonData = layer.toGeoJSON();
    let geoJsonString = JSON.stringify(geoJsonData);

    // Set the hidden geojson (use layer's geojson for accuracy)
    var geoEl = document.getElementById('GeometryGeoJson');
    var previewEl = document.getElementById('MarkerCoordinatesJSON');
    if (geoEl) geoEl.value = geoJsonString;
    if (previewEl) previewEl.value = geoJsonString;

    // update lat/lng inputs using central helper so marker visuals and inputs stay in sync
    if (e.layerType === 'marker' && typeof layer.getLatLng === 'function') {
        const latlng = layer.getLatLng();
        updateFromLatLng(latlng.lat, latlng.lng, null, 'marker');

        // explicitly set Latitude/Longitude inputs as well
        var latInputEl = document.getElementById('Latitude');
        var lngInputEl = document.getElementById('Longitude');
        if (latInputEl) latInputEl.value = (latlng.lat).toFixed(6);
        if (lngInputEl) lngInputEl.value = (latlng.lng).toFixed(6);
    } else if (e.layerType === 'polyline') {
        // For polylines, save the LineString geojson and update lat/lon fields with first->last
        try {
            const geom = geoJsonData.geometry;
            if (geom && geom.type === 'LineString' && Array.isArray(geom.coordinates) && geom.coordinates.length > 0) {
                const first = geom.coordinates[0];
                const last = geom.coordinates[geom.coordinates.length - 1];
                // first/last are [lng, lat]
                const latInputEl = document.getElementById('Latitude');
                const lngInputEl = document.getElementById('Longitude');
                if (latInputEl) latInputEl.value = (first[1]).toFixed(6) + ' → ' + (last[1]).toFixed(6);
                if (lngInputEl) lngInputEl.value = (first[0]).toFixed(6) + ' → ' + (last[0]).toFixed(6);

                // set hidden geometry
                if (geoEl) geoEl.value = geoJsonString;
                if (previewEl) previewEl.value = geoJsonString;
            }
        } catch (ex) {
            console.warn('Error handling polyline creation', ex);
        }
    }
});

// Coordinate inputs: if user edits them manually we stop live tracking and use those coords
const latInput = document.getElementById('Latitude');
const lngInput = document.getElementById('Longitude');

function onManualCoordinateChange() {
    const latVal = parseFloat(latInput.value);
    const lngVal = parseFloat(lngInput.value);

    if (isFinite(latVal) && isFinite(lngVal)) {
        manualOverride = true;
        markerPlaced = false;
        lc.stop();
        // place marker and update geometry
        updateFromLatLng(latVal, lngVal, null, 'manual');
        // pan map to coordinates
        try { map.setView([latVal, lngVal], Math.max(map.getZoom(), 13)); } catch { }
    }
}

latInput.addEventListener('change', onManualCoordinateChange);
lngInput.addEventListener('change', onManualCoordinateChange);

function setupObstacleNameAutocomplete() {
    const $input = $('#ObstacleName');
    const $dropdown = $('#ObstacleNameDropdown');
    const $items = $('.autocomplete-item');

    // Show dropdown on focus
    $input.on('focus', function() {
        $dropdown.show().addClass('show');
        filterAutocompleteItems(''); // Show all items
    });

    // Filter items as user types
    $input.on('input', function() {
        const searchText = $(this).val().toLowerCase();
        filterAutocompleteItems(searchText);
    });

    // Hide dropdown when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#ObstacleName, #ObstacleNameDropdown').length) {
            $dropdown.hide().removeClass('show');
        }
    });

    // Select item on click
    $items.on('click', function() {
        const value = $(this).data('value');
        $input.val(value);
        $dropdown.hide().removeClass('show');

        // Visual feedback
        $input.addClass('border-success');
        setTimeout(function() {
            $input.removeClass('border-success');
        }, 1000);

        // Focus next field (height)
        $('#obstacleHeight').focus();
    });

    // Handle keyboard navigation,  initiate the function
    let highlightedIndex = -1;

    $input.on('keydown', function(e) {
        const $visibleItems = $items.filter(':visible');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, $visibleItems.length - 1);
            updateHighlight($visibleItems);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, 0);
            updateHighlight($visibleItems);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < $visibleItems.length) {
                $visibleItems.eq(highlightedIndex).click();
            }
        } else if (e.key === 'Escape') {
            $dropdown.hide().removeClass('show');
        }
    });

    // Filter items based on search text
    function filterAutocompleteItems(searchText) {
        let visibleCount = 0;

        $items.each(function() {
            const itemText = $(this).data('value').toLowerCase();

            if (itemText.includes(searchText)) {
                $(this).show();
                visibleCount++;
            } else {
                $(this).hide();
            }
        });

        // Show dropdown if there are visible items
        if (visibleCount > 0 && $input.is(':focus')) {
            $dropdown.show().addClass('show');
        } else if (visibleCount === 0) {
            $dropdown.hide().removeClass('show');
        }

        // Reset highlight
        highlightedIndex = -1;
        $items.removeClass('highlighted');
    }
    
    // Highlight currently selected item, used with keyboard navigation
    function updateHighlight($visibleItems) {
        $items.removeClass('highlighted');
        if (highlightedIndex >= 0 && highlightedIndex < $visibleItems.length) {
            $visibleItems.eq(highlightedIndex).addClass('highlighted');

            // Scroll highlighted item into view
            const $highlighted = $visibleItems.eq(highlightedIndex);
            const dropdownScrollTop = $dropdown.scrollTop();
            const dropdownHeight = $dropdown.height();
            const itemTop = $highlighted.position().top;
            const itemHeight = $highlighted.outerHeight();

            if (itemTop < 0) {
                $dropdown.scrollTop(dropdownScrollTop + itemTop);
            } else if (itemTop + itemHeight > dropdownHeight) {
                $dropdown.scrollTop(dropdownScrollTop + itemTop + itemHeight - dropdownHeight);
            }
        }
    }
}

setupObstacleNameAutocomplete(); // Initialize autocomplete on page load

// Restore drawn geometry when editing a draft
(function restoreExistingGeometry() {
    try {
        const model = window.formData || {};
        if (!model.geoJSON) return;

        const raw = typeof model.geoJSON === 'string' ? JSON.parse(model.geoJSON) : model.geoJSON;
        // Add to map
        const previewLayer = L.geoJSON(raw, {
            style: function () {
                return { color: '#0d6efd', weight: 4 };
            },
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng);
            }
        }).addTo(drawnItems);

        // store geometry for submission
        currentObstacleGeometry = (raw.type && raw.type === 'Feature') ? raw : { type: 'Feature', geometry: raw, properties: {} };

        // Populate hidden geoJSON field
        const geoEl = document.getElementById('GeometryGeoJson');
        if (geoEl) geoEl.value = JSON.stringify(currentObstacleGeometry);

        // Update lat/lon inputs and view
        const geom = currentObstacleGeometry.geometry;
        if (geom && geom.type === 'Point' && Array.isArray(geom.coordinates)) {
            const lon = parseFloat(geom.coordinates[0]);
            const lat = parseFloat(geom.coordinates[1]);
            const latEl = document.getElementById('Latitude');
            const lonEl = document.getElementById('Longitude');
            if (latEl) latEl.value = lat.toFixed(6);
            if (lonEl) lonEl.value = lon.toFixed(6);
            try { map.setView([lat, lon], Math.max(map.getZoom(), 14)); } catch (e) { }
        } else if (geom && geom.type === 'LineString' && Array.isArray(geom.coordinates) && geom.coordinates.length > 0) {
            // set first->last in inputs
            const first = geom.coordinates[0];
            const last = geom.coordinates[geom.coordinates.length - 1];
            const latEl = document.getElementById('Latitude');
            const lonEl = document.getElementById('Longitude');
            if (latEl) latEl.value = parseFloat(first[1]).toFixed(6) + ' → ' + parseFloat(last[1]).toFixed(6);
            if (lonEl) lonEl.value = parseFloat(first[0]).toFixed(6) + ' → ' + parseFloat(last[0]).toFixed(6);
            try { map.fitBounds(previewLayer.getBounds()); } catch (e) { }
        }

    } catch (ex) {
        console.warn('Failed to restore existing geometry:', ex);
    }
})();