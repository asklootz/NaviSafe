let map = null;

function viewOnMap(lat, lon) {
    // Use Bootstrap 5 modal API instead of jQuery .modal()
    const mapModalEl = document.getElementById('mapModal');
    if (mapModalEl) {
        const bsMapModal = new bootstrap.Modal(mapModalEl);
        bsMapModal.show();
    }

    setTimeout(() => {
        if (!map) {
            map = L.map('reportMap').setView([lat, lon], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
        } else {
            map.setView([lat, lon], 15);
        }

        // Clear existing markers
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Add new marker
        L.marker([lat, lon]).addTo(map);

        // Invalidate size to fix display issues
        map.invalidateSize();
    }, 300);
}

function viewOnMapReport(regId) {
    var reports = window.reportsData || [];
    const report = reports.find(r => String(r.regID) === String(regId));
    if (!report) return;

    const mapModalEl = document.getElementById('mapModal');
    if (mapModalEl) {
        const bsMapModal = new bootstrap.Modal(mapModalEl);
        bsMapModal.show();
    }

    setTimeout(() => {
        if (!map) {
            map = L.map('reportMap').setView([65.0, 13.0], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
        }

        // remove non-tile layers
        map.eachLayer((layer) => {
            if (!(layer instanceof L.TileLayer)) {
                try { map.removeLayer(layer); } catch (e) { }
            }
        });

        // Try to obtain GeoJSON object from report.GeoJSON (may be string)
        let raw = null;
        try {
            if (report.GeoJSON) {
                if (typeof report.GeoJSON === 'string') {
                    // Sometimes stored as JSON string; attempt parse repeatedly until object
                    let parsed = report.GeoJSON;
                    let attempts = 0;
                    while (typeof parsed === 'string' && attempts < 5) {
                        parsed = JSON.parse(parsed);
                        attempts++;
                    }
                    raw = parsed;
                } else {
                    raw = report.GeoJSON;
                }
            } else if (report.geometry) {
                raw = report.geometry;
            }
        } catch (ex) {
            console.warn('Failed to parse GeoJSON for report', regId, ex);
            raw = null;
        }

        if (raw) {
            // If raw is a geometry object (has 'type' and 'coordinates') wrap into a Feature
            let feature = raw;
            if (raw.type && raw.coordinates) {
                feature = { type: 'Feature', geometry: raw, properties: {} };
            }

            // If it's a FeatureCollection, keep as-is
            try {
                const geoLayer = L.geoJSON(feature, {
                    style: function() { return { color: '#0d6efd', weight: 4 }; },
                    pointToLayer: function(feature, latlng) { return L.marker(latlng); }
                }).addTo(map);

                // Fit bounds for non-point geometries
                try {
                    const bounds = geoLayer.getBounds();
                    if (bounds.isValid && !bounds.isEmpty && !bounds.getSouthWest().equals(bounds.getNorthEast())) {
                        map.fitBounds(bounds, { padding: [20, 20] });
                    } else {
                        // single point - center on it
                        const geom = (feature.type === 'Feature') ? feature.geometry : feature;
                        if (geom && geom.type === 'Point' && Array.isArray(geom.coordinates)) {
                            const coords = geom.coordinates; // [lon, lat]
                            map.setView([coords[1], coords[0]], 15);
                        }
                    }
                } catch (e) {
                    console.warn('Could not fit bounds for geo layer', e);
                }

                return;
            } catch (e) {
                console.warn('Failed to render GeoJSON on map', e);
            }
        }

        // Fallback to Lat/Lon
        const lat = report.Lat ?? report.lat;
        const lon = report.Lon ?? report.lon;
        if (lat && lon) {
            map.setView([lat, lon], 15);
            L.marker([lat, lon]).addTo(map);
        }

        map.invalidateSize();
    }, 300);
}

function viewDetails(reportId) {
    // Use reports exposed by the server-side Razor view via window.reportsData
    var reports = window.reportsData || [];
    const report = reports.find(r => String(r.regID) === String(reportId));
    if (!report) return;

    const lat = report.Lat;
    const lon = report.Lon;
    const longDesc = report.LongDesc;
    const img = report.Img;
    const shortDesc = report.ShortDesc;
    const regID = report.regID;
    const state = report.State;
    const creationDate = report.CreationDate;
    const rejectComment = report.RejectComment;

    let html = '<div class="p-3">';
    html += '<dl class="row">';
    html += '<dt class="col-sm-3">Report ID:</dt><dd class="col-sm-9 fs-5">#' + regID + '</dd>';
    html += '<dt class="col-sm-3">Type:</dt><dd class="col-sm-9 fs-5">' + shortDesc + '</dd>';
    html += '<dt class="col-sm-3">Status:</dt><dd class="col-sm-9 fs-5"><span class="badge ' + getStatusBadgeClass(state) + '">' + state + '</span></dd>';
    html += '<dt class="col-sm-3 ">Comment:</dt><dd class="col-sm-9 fs-5">' + (rejectComment || 'N/A') + '</dd>';
    html += '<dt class="col-sm-3 ">Coordinates:</dt><dd class="col-sm-9 fs-5">' + parseFloat(lat).toFixed(6) + ', ' + parseFloat(lon).toFixed(6) + '</dd>';
    html += '<dt class="col-sm-3 ">Submitted:</dt><dd class="col-sm-9 fs-5">' + new Date(creationDate).toLocaleDateString() + '</dd>';

    if (longDesc != null) {
        html += '<dt class="col-sm-3 ">Description:</dt><dd class="col-sm-9 fs-5">' + longDesc + '</dd>';
    }

    html += '</dl>';

    if (img && img.length > 0) {
        html += '<div class="mt-3">';
        html += '<h6 class="">Image: </h6>';
        html += '<img src="/Obstacle/GetImage/' + regID + '" alt="Report image" class="img-fluid rounded" style="max-height: 300px; border: 3px solid var(--ns-gray-200);" />';
        html += '</div>';
    }

    html += '</div>';

    document.getElementById('detailsContent').innerHTML = html;

    // Use Bootstrap 5 modal API to show the details modal
    const detailsModalEl = document.getElementById('detailsModal');
    if (detailsModalEl) {
        const bsDetailsModal = new bootstrap.Modal(detailsModalEl);
        bsDetailsModal.show();
    }
}

function getStatusBadgeClass(state) {
    switch (state) {
        case 'PENDING': return 'bg-warning';
        case 'APPROVED': return 'bg-success';
        case 'REJECTED': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function deleteDraft(reportId) {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
        return;
    }

    $.ajax({
        url: '/Obstacle/DeleteDraft',
        method: 'POST',
        data: {
            id: reportId,
            __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
        },
        success: function (response) {
            if (response.success) {
                location.reload();
            } else {
                alert('Failed to delete draft: ' + response.message);
            }
        },
        error: function () {
            alert('An error occurred while deleting the draft');
        }
    });
}

// Sorting helper for report cards
function sortReportCards(ascending) {
    const container = document.getElementById('reportsContainer');
    if (!container) return;
    // get NodeList -> array
    const cards = Array.from(container.querySelectorAll('.report-card'));
    cards.sort(function (a, b) {
        const aId = parseInt(a.getAttribute('data-regid') || '0', 10);
        const bId = parseInt(b.getAttribute('data-regid') || '0', 10);
        return ascending ? (aId - bId) : (bId - aId);
    });
    // append in sorted order
    cards.forEach(c => container.appendChild(c));
}

// Wire up the checkbox to control sort order
document.addEventListener('DOMContentLoaded', function () {
    const checkbox = document.getElementById('flexSwitchCheckDefault');
    if (checkbox) {
        // initial sort according to current state
        sortReportCards(checkbox.checked);
        checkbox.addEventListener('change', function () {
            sortReportCards(this.checked);
        });
    }
});

// Attach click handlers for each "View Details" button
document.addEventListener('DOMContentLoaded', function () {
    const buttons = document.querySelectorAll('.btn-view-details');
    buttons.forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-regid');
            viewDetails(id);
        });
    });
});
