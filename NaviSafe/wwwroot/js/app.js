// ========================================
// NaviSafe Aviation Obstacle Reporting System
// ========================================

// Global variables
let map;
let currentUser = null;
let drawnItems;
let drawControl;
let currentObstacleGeometry = null;
let reports = [];
let currentReportId = null;
let baseLayers = {};
let wmsLayer = null;

// Mock users database (replace with API)
const mockUsers = [
  {
    id: 1,
    name: "Test Pilot",
    email: "pilot@naa.no",
    password: "test123",
    organization: "NAA",
    role: "pilot"
  },
  {
    id: 2,
    name: "Admin User",
    email: "admin@kartverket.no",
    password: "admin123",
    organization: "Kartverket",
    role: "admin"
  }
];

// Mock reports database (replace with API)
const mockReports = [];

// ========================================
// INITIALIZATION
// ========================================

$(document).ready(function() {
  checkAuthentication();
  setupEventHandlers();
  checkOnlineStatus();
  
  // Check for permalink parameters
  const urlParams = new URLSearchParams(window.location.search);
  const lat = urlParams.get('lat');
  const lng = urlParams.get('lng');
  const zoom = urlParams.get('zoom');
  const reportId = urlParams.get('report');
  
  if (lat && lng && currentUser) {
    // Will be used when map initializes
    window.permalinkLocation = { lat: parseFloat(lat), lng: parseFloat(lng), zoom: parseInt(zoom) || 15 };
  }
  
  if (reportId) {
    window.permalinkReportId = reportId;
  }
});

// ========================================
// AUTHENTICATION
// ========================================

function checkAuthentication() {
  const storedUser = localStorage.getItem('navisafe_user');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    showMainApp();
  } else {
    $('#loginPage').show();
  }
}

function setupEventHandlers() {
  // Login
  $('#loginForm').submit(function(e) {
    e.preventDefault();
    login();
  });

  // Register
  $('#registerForm').submit(function(e) {
    e.preventDefault();
    register();
  });

  // Logout
  $('#logoutBtn, #adminLogoutBtn').click(function() {
    logout();
  });

  // Report obstacle
  $('#reportObstacleBtn').click(function() {
    showReportForm();
  });

  // Close report form
  $('#closeReportFormBtn').click(function() {
    hideReportForm();
  });

  // Toggle layers
  $('#toggleLayersBtn').click(function() {
    $('#layersPanel').toggle();
  });

  $('#closeLayersBtn').click(function() {
    $('#layersPanel').hide();
  });

  // Base layer selection
  $('input[name="baseLayer"]').change(function() {
    switchBaseLayer($(this).val());
  });

  // Obstacles layer toggle
  $('#obstaclesLayer').change(function() {
    toggleObstaclesLayer($(this).is(':checked'));
  });

  // Submit obstacle form
  $('#obstacleForm').submit(function(e) {
    e.preventDefault();
    submitObstacle();
  });

  // View reports
  $('#viewReportsBtn').click(function() {
    if (currentUser.role === 'admin') {
      showAdminDashboard();
    } else {
      showUserReports();
    }
  });

  // Admin dashboard
  $('#backToMapBtn').click(function() {
    $('#adminDashboard').hide();
    $('#mainApp').show();
  });

  // Filters
  $('#filterStatus, #filterOrganization, #filterType').change(function() {
    loadReportsTable();
  });

  // Report actions
  $('#approveReportBtn').click(function() {
    updateReportStatus('Approved');
  });

  $('#rejectReportBtn').click(function() {
    updateReportStatus('Rejected');
  });

  // Photo preview
  $('#obstaclePhoto').change(function(e) {
    previewPhoto(e.target.files[0]);
  });
}

function login() {
  const email = $('#loginEmail').val();
  const password = $('#loginPassword').val();

  // TODO: Replace with actual API call to ASP.NET Core backend
  /*
  $.ajax({
    url: '/api/auth/login',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ email, password }),
    success: function(user) {
      currentUser = user;
      localStorage.setItem('navisafe_user', JSON.stringify(user));
      showMainApp();
    },
    error: function() {
      alert('Invalid email or password');
    }
  });
  */

  // Mock implementation
  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (user) {
    currentUser = { ...user };
    delete currentUser.password;
    localStorage.setItem('navisafe_user', JSON.stringify(currentUser));
    showMainApp();
  } else {
    alert('Invalid email or password');
  }
}

function register() {
  const name = $('#registerName').val();
  const email = $('#registerEmail').val();
  const organization = $('#registerOrganization').val();
  const password = $('#registerPassword').val();
  const passwordConfirm = $('#registerPasswordConfirm').val();

  if (password !== passwordConfirm) {
    alert('Passwords do not match');
    return;
  }

  // TODO: Replace with actual API call to ASP.NET Core backend
  /*
  $.ajax({
    url: '/api/auth/register',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ name, email, organization, password }),
    success: function(user) {
      alert('Account created! You can now sign in.');
      $('.nav-link[data-bs-target="#loginTab"]').tab('show');
      $('#registerForm')[0].reset();
    },
    error: function() {
      alert('Registration failed');
    }
  });
  */

  // Mock implementation
  const newUser = {
    id: mockUsers.length + 1,
    name,
    email,
    organization,
    password,
    role: 'pilot'
  };
  mockUsers.push(newUser);
  alert('Account created! You can now sign in.');
  $('.nav-link[data-bs-target="#loginTab"]').tab('show');
  $('#registerForm')[0].reset();
}

function logout() {
  localStorage.removeItem('navisafe_user');
  currentUser = null;
  $('#mainApp').hide();
  $('#adminDashboard').hide();
  $('#loginPage').show();
  location.reload();
}

// ========================================
// MAIN APP
// ========================================

function showMainApp() {
  $('#loginPage').hide();
  $('#mainApp').show();
  
  // Update user info
  $('#currentUserName').text(currentUser.name);
  $('#currentUserOrg').text('(' + currentUser.organization + ')');
  
  // Initialize map
  initializeMap();
  
  // Load reports
  loadReports();
}

function initializeMap() {
  // Create map centered on Norway
  const defaultView = [65.0, 13.0];
  const defaultZoom = 5;
  
  map = L.map('map').setView(defaultView, defaultZoom);

  // Base layers
  baseLayers.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // Satellite layer (using Esri World Imagery)
  baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri',
    maxZoom: 19
  });

  // WMS layer for obstacles (example - replace with actual NRL WMS endpoint)
  // TODO: Replace with actual WMS from Norwegian Mapping Authority
  // wmsLayer = L.tileLayer.wms('https://wms.geonorge.no/skwms1/wms.nrl', {
  //   layers: 'aviation_obstacles',
  //   format: 'image/png',
  //   transparent: true,
  //   attribution: '&copy; Kartverket'
  // }).addTo(map);

  // Initialize FeatureGroup for drawn items
  drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  // Add drawing controls
  drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
      polygon: false,
      rectangle: false,
      circle: false,
      circlemarker: false,
      marker: {
        icon: L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        })
      },
      polyline: true
    },
    edit: {
      featureGroup: drawnItems,
      remove: true
    }
  });

  // Draw events
  map.on(L.Draw.Event.CREATED, function(e) {
    const layer = e.layer;
    drawnItems.addLayer(layer);
    
    // Save geometry
    currentObstacleGeometry = layer.toGeoJSON();
    
    // Update coordinates display
    if (e.layerType === 'marker') {
      const latlng = layer.getLatLng();
      $('#obstacleCoords').val(`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
    } else if (e.layerType === 'polyline') {
      const latlngs = layer.getLatLngs();
      $('#obstacleCoords').val(`Line with ${latlngs.length} points`);
    }
  });

  // Add locate control
  L.control.locate({
    position: 'topright',
    strings: {
      title: 'Show my location'
    },
    locateOptions: {
      enableHighAccuracy: true
    }
  }).addTo(map);

  // Check for permalink
  if (window.permalinkLocation) {
    map.setView([window.permalinkLocation.lat, window.permalinkLocation.lng], window.permalinkLocation.zoom);
  }

  // Add scale
  L.control.scale({ imperial: false, metric: true }).addTo(map);
}

function switchBaseLayer(layerType) {
  // Remove all base layers
  Object.values(baseLayers).forEach(layer => {
    map.removeLayer(layer);
  });
  
  // Add selected layer
  if (baseLayers[layerType]) {
    baseLayers[layerType].addTo(map);
  }
}

function toggleObstaclesLayer(show) {
  if (wmsLayer) {
    if (show) {
      map.addLayer(wmsLayer);
    } else {
      map.removeLayer(wmsLayer);
    }
  }
}

// ========================================
// REPORT OBSTACLE
// ========================================

function showReportForm() {
  $('#reportForm').show();
  
  // Enable drawing
  if (!map.hasLayer(drawnItems)) {
    map.addLayer(drawnItems);
  }
  map.addControl(drawControl);
  
  // Clear previous drawings
  drawnItems.clearLayers();
  currentObstacleGeometry = null;
  $('#obstacleForm')[0].reset();
  $('#obstacleCoords').val('');
}

function hideReportForm() {
  $('#reportForm').hide();
  
  // Disable drawing
  if (drawControl) {
    map.removeControl(drawControl);
  }
  
  // Clear drawings
  drawnItems.clearLayers();
  currentObstacleGeometry = null;
}

function previewPhoto(file) {
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      // Remove existing preview
      $('.photo-preview').remove();
      
      // Add new preview
      const img = $('<img>')
        .attr('src', e.target.result)
        .addClass('photo-preview');
      $('#obstaclePhoto').after(img);
    };
    reader.readAsDataURL(file);
  }
}

function submitObstacle() {
  if (!currentObstacleGeometry) {
    alert('You must draw the obstacle on the map first');
    return;
  }

  const formData = {
    type: $('#obstacleType').val(),
    height: $('#obstacleHeight').val() || null,
    description: $('#obstacleDescription').val(),
    lighting: $('#obstacleLighting').val(),
    geometry: currentObstacleGeometry,
    reporter: currentUser.name,
    reporterEmail: currentUser.email,
    organization: currentUser.organization,
    status: 'Pending',
    reportDate: new Date().toISOString(),
    photo: null // Handle file upload separately
  };

  // Handle photo upload
  const photoFile = $('#obstaclePhoto')[0].files[0];
  if (photoFile) {
    // TODO: Upload photo to server and get URL
    // formData.photo = uploadedPhotoUrl;
  }

  // TODO: Replace with actual API call to ASP.NET Core backend
  /*
  $.ajax({
    url: '/api/obstacles',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(formData),
    success: function(response) {
      alert('Report submitted successfully!');
      hideReportForm();
      loadReports();
    },
    error: function() {
      alert('Failed to submit report');
    }
  });
  */

  // Mock implementation
  const newReport = {
    id: mockReports.length + 1,
    ...formData
  };
  mockReports.push(newReport);
  reports.push(newReport);
  
  alert('Report submitted successfully!');
  hideReportForm();
  displayReportsOnMap();
  
  // Generate permalink
  if (currentObstacleGeometry.geometry.type === 'Point') {
    const coords = currentObstacleGeometry.geometry.coordinates;
    const permalink = `${window.location.origin}${window.location.pathname}?lat=${coords[1]}&lng=${coords[0]}&zoom=15&report=${newReport.id}`;
    console.log('Permalink:', permalink);
  }
}

// ========================================
// REPORTS
// ========================================

function loadReports() {
  // TODO: Replace with actual API call to ASP.NET Core backend
  /*
  $.ajax({
    url: '/api/obstacles',
    method: 'GET',
    success: function(data) {
      reports = data;
      displayReportsOnMap();
    }
  });
  */

  // Mock implementation
  reports = [...mockReports];
  displayReportsOnMap();
}

function displayReportsOnMap() {
  // Clear existing markers
  drawnItems.clearLayers();
  
  // Add markers for each report
  reports.forEach(report => {
    if (report.geometry) {
      const layer = L.geoJSON(report.geometry, {
        style: function() {
          let color = '#ffc107'; // Pending - yellow
          if (report.status === 'Approved') color = '#28a745'; // Approved - green
          if (report.status === 'Rejected') color = '#dc3545'; // Rejected - red
          
          return {
            color: color,
            weight: 3
          };
        },
        pointToLayer: function(feature, latlng) {
          return L.marker(latlng);
        },
        onEachFeature: function(feature, layer) {
          layer.bindPopup(`
            <div>
              <h6>${report.type}</h6>
              <p class="mb-1"><small>${report.description}</small></p>
              <p class="mb-1"><small><strong>Reported by:</strong> ${report.reporter}</small></p>
              <p class="mb-0"><small><strong>Status:</strong> <span class="badge badge-status-${report.status.toLowerCase()}">${report.status}</span></small></p>
            </div>
          `);
        }
      });
      
      drawnItems.addLayer(layer);
    }
  });
}

function showUserReports() {
  const userReports = reports.filter(r => r.reporterEmail === currentUser.email);
  
  let html = '<div class="modal fade" id="userReportsModal" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content">';
  html += '<div class="modal-header"><h5 class="modal-title">My Reports</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>';
  html += '<div class="modal-body"><table class="table"><thead><tr><th>Date</th><th>Type</th><th>Status</th><th>Description</th></tr></thead><tbody>';
  
  userReports.forEach(report => {
    const date = new Date(report.reportDate).toLocaleDateString('en-US');
    html += `<tr>
      <td>${date}</td>
      <td>${report.type}</td>
      <td><span class="badge badge-status-${report.status.toLowerCase()}">${report.status}</span></td>
      <td>${report.description}</td>
    </tr>`;
  });
  
  html += '</tbody></table></div></div></div></div>';
  
  $('body').append(html);
  $('#userReportsModal').modal('show');
  $('#userReportsModal').on('hidden.bs.modal', function() {
    $(this).remove();
  });
}

// ========================================
// ADMIN DASHBOARD
// ========================================

function showAdminDashboard() {
  $('#mainApp').hide();
  $('#adminDashboard').show();
  
  // Update statistics
  updateStatistics();
  
  // Load reports table
  loadReportsTable();
}

function updateStatistics() {
  const total = reports.length;
  const pending = reports.filter(r => r.status === 'Pending').length;
  const approved = reports.filter(r => r.status === 'Approved').length;
  const rejected = reports.filter(r => r.status === 'Rejected').length;
  
  $('#totalReports').text(total);
  $('#pendingReports').text(pending);
  $('#approvedReports').text(approved);
  $('#rejectedReports').text(rejected);
}

function loadReportsTable() {
  let filteredReports = [...reports];
  
  // Apply filters
  const statusFilter = $('#filterStatus').val();
  const orgFilter = $('#filterOrganization').val();
  const typeFilter = $('#filterType').val();
  
  if (statusFilter) {
    filteredReports = filteredReports.filter(r => r.status === statusFilter);
  }
  if (orgFilter) {
    filteredReports = filteredReports.filter(r => r.organization === orgFilter);
  }
  if (typeFilter) {
    filteredReports = filteredReports.filter(r => r.type === typeFilter);
  }
  
  // Build table
  const tbody = $('#reportsTableBody');
  tbody.empty();
  
  filteredReports.forEach(report => {
    const date = new Date(report.reportDate).toLocaleDateString('en-US');
    const row = $(`
      <tr>
        <td>${report.id}</td>
        <td>${date}</td>
        <td>${report.type}</td>
        <td>${report.description.substring(0, 50)}...</td>
        <td>${report.reporter}</td>
        <td>${report.organization}</td>
        <td><span class="badge badge-status-${report.status.toLowerCase()}">${report.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary view-report-btn" data-id="${report.id}">
            <i class="bi bi-eye"></i> View Details
          </button>
        </td>
      </tr>
    `);
    
    row.find('.view-report-btn').click(function() {
      viewReportDetails(report.id);
    });
    
    tbody.append(row);
  });
}

function viewReportDetails(reportId) {
  const report = reports.find(r => r.id === reportId);
  if (!report) return;
  
  currentReportId = reportId;
  
  // Fill in details
  const html = `
    <dl class="row">
      <dt class="col-sm-4">Type:</dt>
      <dd class="col-sm-8">${report.type}</dd>
      
      <dt class="col-sm-4">Height:</dt>
      <dd class="col-sm-8">${report.height || 'Not specified'} m</dd>
      
      <dt class="col-sm-4">Lighting:</dt>
      <dd class="col-sm-8">${report.lighting || 'Unknown'}</dd>
      
      <dt class="col-sm-4">Description:</dt>
      <dd class="col-sm-8">${report.description}</dd>
      
      <dt class="col-sm-4">Reported by:</dt>
      <dd class="col-sm-8">${report.reporter} (${report.organization})</dd>
      
      <dt class="col-sm-4">Date:</dt>
      <dd class="col-sm-8">${new Date(report.reportDate).toLocaleString('en-US')}</dd>
      
      <dt class="col-sm-4">Status:</dt>
      <dd class="col-sm-8"><span class="badge badge-status-${report.status.toLowerCase()}">${report.status}</span></dd>
    </dl>
  `;
  
  $('#reportDetailContent').html(html);
  
  // Show map with geometry
  setTimeout(() => {
    if ($('#reportDetailMap').length) {
      const detailMap = L.map('reportDetailMap').setView([65.0, 13.0], 5);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(detailMap);
      
      if (report.geometry) {
        const layer = L.geoJSON(report.geometry);
        layer.addTo(detailMap);
        detailMap.fitBounds(layer.getBounds());
      }
    }
  }, 300);
  
  // Show modal
  $('#reportDetailModal').modal('show');
}

function updateReportStatus(status) {
  if (!currentReportId) return;
  
  const comment = $('#adminComment').val();
  const assignedTo = $('#assignTo').val();
  
  // TODO: Replace with actual API call to ASP.NET Core backend
  /*
  $.ajax({
    url: `/api/obstacles/${currentReportId}`,
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ status, comment, assignedTo }),
    success: function() {
      alert(`Report ${status.toLowerCase()}`);
      $('#reportDetailModal').modal('hide');
      loadReportsTable();
      updateStatistics();
    }
  });
  */

  // Mock implementation
  const report = reports.find(r => r.id === currentReportId);
  if (report) {
    report.status = status;
    report.adminComment = comment;
    report.assignedTo = assignedTo;
    
    alert(`Report ${status.toLowerCase()}`);
    $('#reportDetailModal').modal('hide');
    loadReportsTable();
    updateStatistics();
    
    // TODO: Send email notification to reporter
    console.log(`Send email to ${report.reporterEmail}: Report ${status}`);
  }
}

// ========================================
// OFFLINE SUPPORT
// ========================================

function checkOnlineStatus() {
  function updateOnlineStatus() {
    if (!navigator.onLine) {
      $('body').prepend('<div class="offline-indicator show"><i class="bi bi-wifi-off"></i> You are offline - changes will be saved locally</div>');
    } else {
      $('.offline-indicator').remove();
    }
  }
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

// ========================================
// SERVICE WORKER (for offline support)
// ========================================

if ('serviceWorker' in navigator) {
  // TODO: Register service worker for offline caching
  // navigator.serviceWorker.register('/sw.js');
}
