$(document).ready(function () {
    const reports = window.reportsData || [];
    let mapInstance = null;
    let currentReportId = null;

    function applyFilters() {
        const activeCard = $('.stat-card.active');
        const activeStatus = activeCard.length ? activeCard.data('status') : 'ALL';
        const searchVal = ($('#reporterSearch').val() || '').toString().toLowerCase().trim();

        $('#reportsTable tbody tr').each(function () {
            const $tr = $(this);
            const rowState = $tr.data('state');
            const rowReporter = ($tr.data('reporter') || '').toString().toLowerCase();

            const statusMatch = !activeStatus || activeStatus === 'ALL' || String(rowState) === String(activeStatus);
            const searchMatch = !searchVal || rowReporter.indexOf(searchVal) !== -1;

            if (statusMatch && searchMatch) $tr.show(); else $tr.hide();
        });
    }

    $('.stat-card').on('click', function () {
        $('.stat-card').removeClass('active');
        $(this).addClass('active');
        applyFilters();
    });

    $('#reporterSearch').on('input', function () {
        applyFilters();
    });

    // Sorting
    function sortReportsTable(key, direction) {
        const $tbody = $('#reportsTable tbody');
        const $rows = $tbody.find('tr').toArray();
        $rows.sort(function(a, b) {
            const aVal = $(a).data(key);
            const bVal = $(b).data(key);
            if (key === 'id') return (parseInt(aVal) || 0) - (parseInt(bVal) || 0);
            if (key === 'date') return new Date(aVal) - new Date(bVal);
            return 0;
        });
        if (direction === 'desc') $rows.reverse();
        $tbody.empty().append($rows);
        $('#reportsTable thead th.sortable').removeClass('asc desc');
        $('#reportsTable thead th.sortable[data-sort="' + key + '"]').addClass(direction);
    }

    $('#reportsTable thead').on('click', 'th.sortable', function() {
        const $th = $(this);
        const key = $th.data('sort');
        const current = $th.hasClass('asc') ? 'asc' : ($th.hasClass('desc') ? 'desc' : null);
        let next = 'desc'; if (current === 'desc') next = 'asc';
        sortReportsTable(key, next);
    });

    // initial sort: descending by ID
    sortReportsTable('id', 'desc');

    // View Report Details - use server-side reporter values stored in button data attributes
    $('.view-report').on('click', function () {
        const $btn = $(this);
        const reportId = $btn.data('id');
        currentReportId = reportId;

        const selectedReport = reports.find(r => r.regID === reportId);

        // Build userInfo object from data attributes (server-side provided)
        const userInfo = {
            UserID: $btn.data('userid'),
            FirstName: $btn.data('user-firstname'),
            LastName: $btn.data('user-lastname'),
            Email: $btn.data('user-email'),
            Phone: $btn.data('user-phone'),
            OrganizationName: $btn.data('user-org')
        };

        if (selectedReport) {
            showReportDetailsLoading();
            // Use server-side userInfo directly
            showReportDetailsFull(selectedReport, userInfo);
        }
    });

    function showReportDetailsLoading() {
        const loadingHtml = '<div class="text-center p-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-3">Loading report details...</p></div>';
        $('#reportDetails').html(loadingHtml);
        $('#reportDetailModal').modal('show');
    }

    function showReportDetailsFull(selectedReport, userInfo) {
        // Handle case sensitivity for JSON properties
        const reportId = selectedReport.regID || selectedReport.RegID;
        const creationDate = selectedReport.creationDate || selectedReport.CreationDate;
        const shortDesc = selectedReport.shortDesc || selectedReport.ShortDesc;
        const rejectComment = selectedReport.rejectComment || selectedReport.RejectComment;
        const longDesc = selectedReport.longDesc || selectedReport.LongDesc;
        const accuracy = selectedReport.accuracy || selectedReport.Accuracy;
        const altitude = selectedReport.altitude || selectedReport.Altitude;
        const state = selectedReport.state || selectedReport.State;
        const lat = selectedReport.lat || selectedReport.Lat;
        const lon = selectedReport.lon || selectedReport.Lon;
        const img = selectedReport.img || selectedReport.Img;

        let html = '';
        html += '<div class="row">';
        html += '<div class="col-md-6">';

        // Report Info Card
        html += '<div class="card mb-3">';
        html += '<div class="card-header"><h6><i class="bi bi-info-circle"></i> Report Information</h6></div>';
        html += '<div class="card-body">';
        html += '<dl class="row">';
        html += '<dt class="col-sm-4">Report ID:</dt><dd class="col-sm-8">#' + reportId + '</dd>';
        html += '<dt class="col-sm-4">Submitted On:</dt><dd class="col-sm-8">' + new Date(creationDate).toLocaleString() + '</dd>';
        html += '<dt class="col-sm-4">Type:</dt><dd class="col-sm-8">' + shortDesc + '</dd>';
        html += '<dt class="col-sm-4">Height:</dt><dd class="col-sm-8">' + (altitude || 'Not specified') + ' feet</dd>';
        html += '<dt class="col-sm-4">Status:</dt><dd class="col-sm-8"><span class="badge ' + getStatusBadgeClass(state) + '">' + state + '</span></dd>';

        if (lat && lon) {
            html += '<dt class="col-sm-4">Coordinates:</dt><dd class="col-sm-8">' + parseFloat(lat).toFixed(6) + ', ' + parseFloat(lon).toFixed(6) + '</dd>';
        } else {
            html += '<dt class="col-sm-4">Coordinates:</dt><dd class="col-sm-8">Not available</dd>';
        }

        html += '<dt class="col-sm-4">Accuracy (m):</dt><dd class="col-sm-8">' + (accuracy || 'N/A') + '</dd>' ;
        html += '<dt class="col-sm-4">Description:</dt><dd class="col-sm-8">' + (longDesc || 'No description') + '</dd>';
        html += '</dl></div></div>';

        // Image Card
        if (img && img.length > 0) {
            html += '<div class="card mb-3">';
            html += '<div class="card-header"><h6><i class="bi bi-image"></i> Attached Image</h6></div>';
            html += '<div class="card-body text-center">';
            html += '<img src="/Obstacle/GetImage/' + reportId + '" class="img-fluid rounded" style="max-height: 300px; cursor: pointer;" onclick="window.open(\'/Obstacle/GetImage/' + reportId + '\', \'_blank\')" />';
            html += '<br><small class="text-muted mt-2 d-block">Click to view full size</small>';
            html += '</div></div>';
        } else {
            html += '<div class="card mb-3">';
            html += '<div class="card-header"><h6><i class="bi bi-image"></i> Image</h6></div>';
            html += '<div class="card-body text-center text-muted py-4">';
            html += '<i class="bi bi-camera-slash fs-1"></i>';
            html += '<p class="mt-2">No image attached</p>';
            html += '</div></div>';
        }

        // Reporter Card (server-side data)
        html += '<div class="card">';
        html += '<div class="card-header"><h6><i class="bi bi-person"></i> Reporter Information</h6></div>';
        html += '<div class="card-body">';
        html += '<dl class="row">';
        html += '<dt class="col-sm-4">Name:</dt><dd class="col-sm-8">' + (userInfo.FirstName || 'Unknown') + ' ' + (userInfo.LastName || '') + '</dd>';
        html += '<dt class="col-sm-4">Email:</dt><dd class="col-sm-8"><a href="mailto:' + (userInfo.Email || '') + '">' + (userInfo.Email || '') + '</a></dd>';
        html += '<dt class="col-sm-4">Phone:</dt><dd class="col-sm-8">' + (userInfo.Phone && userInfo.Phone !== 'Not available' ? '<a href="tel:' + userInfo.Phone + '">' + userInfo.Phone + '</a>' : (userInfo.Phone || 'Not available')) + '</dd>';
        html += '<dt class="col-sm-4">Organization:</dt><dd class="col-sm-8">' + (userInfo.OrganizationName || 'Unknown Organization') + '</dd>';
        html += '</dl></div></div>';

        html += '</div>'; // End left column

        // Right Column
        html += '<div class="col-md-6">';

        // Map Card
        if (lat && lon) {
            html += '<div class="card mb-3">';
            html += '<div class="card-header"><h6><i class="bi bi-geo-alt"></i> Location Map</h6></div>';
            html += '<div class="card-body"><div id="detailMap" style="height: 350px;"></div></div>';
            html += '</div>';
        } else {
            html += '<div class="card mb-3">';
            html += '<div class="card-header"><h6><i class="bi bi-geo-alt"></i> Location</h6></div>';
            html += '<div class="card-body text-center text-muted py-4">';
            html += '<i class="bi bi-geo-alt-slash fs-1"></i>';
            html += '<p class="mt-2">No coordinates available</p>';
            html += '</div></div>';
        }

        // Admin Controls Card
        html += '<div class="card">';
        html += '<div class="card-header"><h6><i class="bi bi-pencil-square"></i> Admin Review</h6></div>';
        html += '<div class="card-body">';
        html += '<div class="mb-3">';
        html += '<label for="adminReason" class="form-label"><strong>Reason for Decision:</strong> <span class="text-danger">*</span></label>';
        html += '<textarea class="form-control" id="adminReason" rows="3" placeholder="Enter reason for your decision...">'+(rejectComment || '')+'</textarea>';
        html += '</div>';
        html += '<div class="mb-3">';
        html += '<label for="newStatus" class="form-label"><strong>Change Status:</strong></label>';
        html += '<select class="form-select" id="newStatus">';
        html += '<option value="">-- Select Status --</option>';
        html += '<option value="APPROVED"' + (state === 'APPROVED' ? ' selected' : '') + '>✅ Approved/Published</option>';
        html += '<option value="REJECTED"' + (state === 'REJECTED' ? ' selected' : '') + '>❌ Rejected</option>';
        html += '<option value="PENDING"' + (state === 'PENDING' ? ' selected' : '') + '>⏳ Pending Review</option>';
        html += '</select></div>';
        html += '<button class="btn btn-primary w-100" id="updateStatusBtn"><i class="bi bi-save"></i> Update Status</button>';

        if (state === 'PENDING') {
            html += '<hr>';
            html += '<div class="row g-2">';
            html += '<div class="col-6"><button class="btn btn-success w-100" id="quickApproveBtn">Quick Approve</button></div>';
            html += '<div class="col-6"><button class="btn btn-danger w-100" id="quickRejectBtn">Quick Reject</button></div>';
            html += '</div>';
        }

        html += '</div></div>'; // End admin card
        html += '</div>'; // End right column
        html += '</div>'; // End row

        $('#reportDetails').html(html);

        // Initialize map if coordinates are available
        if (lat && lon) {
            setTimeout(() => {
                const detailMap = L.map('detailMap').setView([parseFloat(lat), parseFloat(lon)], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(detailMap);

                const markerColor = getMarkerColor(state);
                const customIcon = L.divIcon({
                    className: 'custom-marker',
                    html: '<div style="background-color: ' + markerColor + '; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [19, 19],
                    iconAnchor: [9, 9]
                });

                L.marker([parseFloat(lat), parseFloat(lon)], { icon: customIcon })
                    .addTo(detailMap)
                    .bindPopup('<b>' + shortDesc + '</b>')
                    .openPopup();
            }, 300);
        }
    }

    // Event handlers
    $(document).on('click', '#updateStatusBtn', function() {
        const newStatus = $('#newStatus').val();
        const reason = $('#adminReason').val();

        if (!newStatus || !reason.trim()) {
            alert('Please select a status and provide a reason');
            return;
        }

        updateReportStatus(currentReportId, newStatus, reason);
    });

    $(document).on('click', '#quickApproveBtn', function() {
        updateReportStatus(currentReportId, 'APPROVED', 'Quick approval - meets safety requirements');
    });

    $(document).on('click', '#quickRejectBtn', function() {
        updateReportStatus(currentReportId, 'REJECTED', 'Quick rejection - does not meet requirements and/or insufficient information');
    });

    // Show Map Modal
    $('#mapButton').on('click', function () {
        $('#mapModal').modal('show');

        setTimeout(() => {
            if (!mapInstance) {
                mapInstance = L.map('mapContainer').setView([65.0, 13.0], 6);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);

                let validReports = [];

                reports.forEach(report => {
                    // Handle case sensitivity
                    const lat = report.lat || report.Lat;
                    const lon = report.lon || report.Lon;
                    const state = report.state || report.State;
                    const shortDesc = report.shortDesc || report.ShortDesc;
                    const longDesc = report.longDesc || report.LongDesc;
                    const reportId = report.regID || report.RegID;
                    const img = report.img || report.Img;

                    if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
                        const markerColor = getMarkerColor(state);
                        const customIcon = L.divIcon({
                            className: 'custom-marker',
                            html: '<div style="background-color: ' + markerColor + '; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        });

                        const marker = L.marker([parseFloat(lat), parseFloat(lon)], { icon: customIcon }).addTo(mapInstance);

                        let popup = '<div style="min-width: 200px;">';
                        popup += '<h6>' + shortDesc + '</h6>';
                        popup += '<p><small>' + (longDesc || 'No description') + '</small></p>';
                        popup += '<p><small><strong>Status:</strong> <span class="badge ' + getStatusBadgeClass(state) + '">' + state + '</span></small></p>';
                        if (img && img.length > 0) {
                            popup += '<a href="/Obstacle/GetImage/' + reportId + '" target="_blank" class="btn btn-sm btn-outline-primary mb-2">View Image</a><br>';
                        }
                        popup += '<button class="btn btn-sm btn-primary" onclick="viewReportFromMap(' + reportId + ')">View Details</button>';
                        popup += '</div>';

                        marker.bindPopup(popup);
                        validReports.push([parseFloat(lat), parseFloat(lon)]);
                    }
                });

                // Fit map to show all markers if there are any valid reports
                if (validReports.length > 0) {
                    const group = new L.featureGroup(validReports.map(coord => L.marker(coord)));
                    mapInstance.fitBounds(group.getBounds().pad(0.1));
                }
            }
        }, 300);
    });

    // Helper functions
    function getMarkerColor(state) {
        switch (state) {
            case 'PENDING': return '#ffc107';
            case 'APPROVED': return '#28a745';
            case 'REJECTED': return '#dc3545';
            default: return '#6c757d';
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

    function updateReportStatus(reportId, newStatus, reason) {
        $.ajax({
            url: '/Home/UpdateReportStatus',
            method: 'POST',
            data: {
                reportId: reportId,
                newStatus: newStatus,
                reason: reason,
                __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
            },
            success: function(response) {
                if (response.success) {
                    alert('Status updated successfully!');
                    $('#reportDetailModal').modal('hide');
                    location.reload();
                } else {
                    alert('Error: ' + (response.message || 'Unknown error'));
                }
            },
            error: function() {
                alert('Failed to update status');
            }
        });
    }

    window.viewReportFromMap = function(reportId) {
        $('#mapModal').modal('hide');
        setTimeout(() => {
            $('.view-report[data-id="' + reportId + '"]').click();
        }, 500);
    };
});