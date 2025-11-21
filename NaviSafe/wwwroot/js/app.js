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
let userLocation = null;
let currentMarker = null;
let drafts = [];
let drawingMode = 'point'; // 'point' or 'line'
let linePoints = []; // Array to store points when drawing line
let tempPolyline = null; // Temporary polyline while drawing
let adminMap = null;        // Separate Leaflet map for admin view
let adminLayerGroup = null; // Layer group for obstacles on admin map


// Mock reports database (replace with API)
const mockReports = [
  {
    id: 1,
    type: "Power Line",
    height: 45,
    description: "High voltage power line crossing valley near Stavanger Airport. Multiple transmission towers with cables at approximately 45m height.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [5.6284, 58.8769],
          [5.6310, 58.8790],
          [5.6345, 58.8815],
          [5.6380, 58.8840]
        ]
      },
      properties: {}
    },
    latitude: "58.8769",
    longitude: "5.6284",
    reporter: "Ola Nordmann",
    reporterEmail: "ola.nordmann@nla.no",
    organization: "Norsk Luftambulanse",
    status: "Approved",
    reportDate: "2024-11-15T09:23:00Z",
    photo: null
  },
  {
    id: 2,
    type: "Wind Turbine",
    height: 120,
    description: "Large wind turbine at Raggovidda wind farm. Total height including rotor blade at maximum position is approximately 120 meters. Turbine has red obstruction lighting.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [23.6543, 70.3891]
      },
      properties: {}
    },
    latitude: "70.3891",
    longitude: "23.6543",
    reporter: "Kari Hansen",
    reporterEmail: "kari.hansen@wideroe.no",
    organization: "Widerøe",
    status: "Approved",
    reportDate: "2024-11-14T14:45:00Z",
    photo: null
  },
  {
    id: 3,
    type: "Communications Tower",
    height: 85,
    description: "Telecommunications tower on hilltop near Trondheim. Red and white painted with flashing red lights at top. Located on elevated terrain.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [10.3951, 63.4305]
      },
      properties: {}
    },
    latitude: "63.4305",
    longitude: "10.3951",
    reporter: "Lars Bergstrøm",
    reporterEmail: "lars.bergstrom@nla.no",
    organization: "Norsk Luftambulanse",
    status: "Pending",
    reportDate: "2024-11-17T11:20:00Z",
    photo: null
  },
  {
    id: 4,
    type: "Crane",
    height: 65,
    description: "Construction crane at new hospital building site in Bergen. Temporary obstacle, expected to be removed in 6 months. Yellow tower crane with red warning lights.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [5.3221, 60.3913]
      },
      properties: {}
    },
    latitude: "60.3913",
    longitude: "5.3221",
    reporter: "Maria Olsen",
    reporterEmail: "maria.olsen@nla.no",
    organization: "NLA",
    status: "Pending",
    reportDate: "2024-11-18T08:15:00Z",
    photo: null
  },
  {
    id: 5,
    type: "Building (over 15m)",
    height: 28,
    description: "New apartment building near Torp Airport approach path. Building exceeds 15m obstacle notification requirement. Flat roof, no lighting.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [10.2586, 59.1867]
      },
      properties: {}
    },
    latitude: "59.1867",
    longitude: "10.2586",
    reporter: "Ola Nordmann",
    reporterEmail: "ola.nordmann@nla.no",
    organization: "Norsk Luftambulanse",
    status: "Approved",
    reportDate: "2024-11-12T16:30:00Z",
    photo: null
  },
  {
    id: 6,
    type: "Mast/Tower",
    height: 95,
    description: "Radio broadcast mast near Bodø. Guyed steel lattice tower with multiple antenna arrays. Red obstruction lighting installed. Located on slight elevation.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [14.4051, 67.2804]
      },
      properties: {}
    },
    latitude: "67.2804",
    longitude: "14.4051",
    reporter: "Erik Johnsen",
    reporterEmail: "erik.johnsen@sas.no",
    organization: "SAS",
    status: "Approved",
    reportDate: "2024-11-10T10:45:00Z",
    photo: null
  },
  {
    id: 7,
    type: "Bridge",
    height: 35,
    description: "Suspension bridge over Hardangerfjord. Main cables approximately 35m above water level at center span. Bridge deck width 12m.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [6.5432, 60.3245],
          [6.5478, 60.3256],
          [6.5521, 60.3268],
          [6.5567, 60.3279]
        ]
      },
      properties: {}
    },
    latitude: "60.3245",
    longitude: "6.5432",
    reporter: "Kari Hansen",
    reporterEmail: "kari.hansen@wideroe.no",
    organization: "Widerøe",
    status: "Rejected",
    reportDate: "2024-11-09T13:15:00Z",
    photo: null
  },
  {
    id: 8,
    type: "Chimney",
    height: 78,
    description: "Industrial chimney at cement factory in Brevik. Red and white painted concrete stack. Smoke occasionally visible. Red obstruction lights at top.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [9.7012, 59.0512]
      },
      properties: {}
    },
    latitude: "59.0512",
    longitude: "9.7012",
    reporter: "Lars Bergstrøm",
    reporterEmail: "lars.bergstrom@nla.no",
    organization: "Norsk Luftambulanse",
    status: "Approved",
    reportDate: "2024-11-08T09:00:00Z",
    photo: null
  },
  {
    id: 9,
    type: "Antenna",
    height: 42,
    description: "Cellular network antenna array on building rooftop in Tromsø city center. Multiple panel antennas and microwave dishes. Total height above ground 42m.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [18.9553, 69.6492]
      },
      properties: {}
    },
    latitude: "69.6492",
    longitude: "18.9553",
    reporter: "Maria Olsen",
    reporterEmail: "maria.olsen@nla.no",
    organization: "NLA",
    status: "Pending",
    reportDate: "2024-11-16T15:50:00Z",
    photo: null
  },
  {
    id: 10,
    type: "Power Line",
    height: 52,
    description: "High voltage transmission line near Kristiansand. Power lines crossing E39 highway. Six conductors at approximately 52m height. No lighting.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [8.0012, 58.1467],
          [8.0089, 58.1489],
          [8.0145, 58.1512]
        ]
      },
      properties: {}
    },
    latitude: "58.1467",
    longitude: "8.0012",
    reporter: "Erik Johnsen",
    reporterEmail: "erik.johnsen@sas.no",
    organization: "SAS",
    status: "Approved",
    reportDate: "2024-11-11T12:30:00Z",
    photo: null
  },
  {
    id: 11,
    type: "Wind Turbine",
    height: 135,
    description: "Offshore wind turbine at Hywind Tampen floating wind farm. Total height to blade tip approximately 135m above sea level. White tower with red markings.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [3.7123, 61.0892]
      },
      properties: {}
    },
    latitude: "61.0892",
    longitude: "3.7123",
    reporter: "Ola Nordmann",
    reporterEmail: "ola.nordmann@nla.no",
    organization: "Norsk Luftambulanse",
    status: "Approved",
    reportDate: "2024-11-07T08:20:00Z",
    photo: null
  },
  {
    id: 12,
    type: "Crane",
    height: 58,
    description: "Mobile crane at port facility in Ålesund. Yellow mobile crane used for ship loading. Position may vary. Estimated height 58m when boom is vertical.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [6.1549, 62.4722]
      },
      properties: {}
    },
    latitude: "62.4722",
    longitude: "6.1549",
    reporter: "Kari Hansen",
    reporterEmail: "kari.hansen@wideroe.no",
    organization: "Widerøe",
    status: "Rejected",
    reportDate: "2024-11-13T14:00:00Z",
    photo: null
  },
  {
    id: 13,
    type: "Communications Tower",
    height: 105,
    description: "Major telecommunications tower on Grefsenkollen overlooking Oslo. Multiple cellular and broadcast antennas. Red aviation warning lights. Very prominent landmark.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [10.8234, 59.9667]
      },
      properties: {}
    },
    latitude: "59.9667",
    longitude: "10.8234",
    reporter: "Lars Bergstrøm",
    reporterEmail: "lars.bergstrom@nla.no",
    organization: "Norsk Luftambulanse",
    status: "Approved",
    reportDate: "2024-11-05T11:10:00Z",
    photo: null
  },
  {
    id: 14,
    type: "Mast/Tower",
    height: 72,
    description: "Meteorological observation tower at Finse mountain station. White painted lattice tower with weather instruments. Located at 1222m elevation.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [7.5005, 60.6042]
      },
      properties: {}
    },
    latitude: "60.6042",
    longitude: "7.5005",
    reporter: "Maria Olsen",
    reporterEmail: "maria.olsen@nla.no",
    organization: "NLA",
    status: "Pending",
    reportDate: "2024-11-18T10:05:00Z",
    photo: null
  },
  {
    id: 15,
    type: "Building (over 15m)",
    height: 34,
    description: "New hotel building in Lillehammer near airport approach. Seven story building with peaked roof. Total height 34m. Reflective windows on south facade.",
    geometry: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [10.4662, 61.1153]
      },
      properties: {}
    },
    latitude: "61.1153",
    longitude: "10.4662",
    reporter: "Erik Johnsen",
    reporterEmail: "erik.johnsen@sas.no",
    organization: "SAS",
    status: "Approved",
    reportDate: "2024-11-06T16:45:00Z",
    photo: null
  }
];

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

// iPad Pro specific optimizations
function optimizeForIPad() {
  // Detect iPad
  const isIPad = /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;

  if (isIPad) {
    document.body.classList.add('ipad-device');

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Better scroll handling
    document.addEventListener('touchmove', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    // Haptic feedback on form submit (if available)
    if (window.navigator && window.navigator.vibrate) {
      $('#obstacleForm').on('submit', function() {
        window.navigator.vibrate(50);
      });

      $('#saveDraftBtn').on('click', function() {
        window.navigator.vibrate(30);
      });
    }
  }
}

// ========================================
// AUTHENTICATION
// ========================================

function normalizeUserRole(user) {
  if (!user) return;
  const raw = (user.role || user.roleID || user.roleId || user.Role || user.RoleId || user.rolePermissions || user.RolePermissions || '').toString().trim().toLowerCase();
  if (raw === 'adm' || raw === 'admin' || raw === 'administrator' || raw.includes('admin')) {
    user.role = 'admin';
  } else if (raw === 'pil' || raw === 'pilot' || raw.includes('pil')) {
    user.role = 'pilot';
  } else {
    // fallback: preserve existing if already normalized, otherwise default to pilot
    user.role = (user.role === 'admin' ? 'admin' : 'pilot');
  }
}

function checkAuthentication() {
  const storedUser = localStorage.getItem('navisafe_user');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    normalizeUserRole(currentUser);
    // persist normalized role back to storage so later loads are consistent
    localStorage.setItem('navisafe_user', JSON.stringify(currentUser));
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

  // Autocomplete for Obstacle Type
  setupObstacleTypeAutocomplete();

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

  // Admin: "Back to map" should show the admin map with all obstacles
  $('#backToMapBtn').click(function () {
    // Make sure the admin dashboard is visible (we stay in admin view)
    $('#adminDashboard').show();

    // Show the map container inside the admin dashboard
    $('#adminMapContainer').show();

    // If reports array is empty, load them (mockReports or from API)
    if (!reports || reports.length === 0) {
      loadReports(); // this will fill "reports" from mockReports in your code
    }

    // Initialize admin map if needed, otherwise just refresh
    if (!adminMap) {
      initAdminMap();
    } else {
      // Redraw obstacles and fix map size
      displayReportsOnAdminMap();
      setTimeout(function () {
        adminMap.invalidateSize();
      }, 200);
    }
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

  // GPS toggle button
  $('#gpsToggleBtn').click(function() {
    const btn = $(this);
    if (btn.hasClass('active')) {
      // Deactivate GPS
      btn.removeClass('active');
      btn.find('span').text('Use My GPS Location');
      useMapLocation();
      if (window.accuracyCircle) {
        map.removeLayer(window.accuracyCircle);
      }
    } else {
      // Activate GPS
      useGPSLocation();
    }
  });

  // Save draft button
  $('#saveDraftBtn').click(function() {
    saveDraft();
  });

  // Drawing mode toggle buttons
  $('#pointModeBtn').click(function() {
    setDrawingMode('point');
  });

  $('#lineModeBtn').click(function() {
    setDrawingMode('line');
  });

  // Clear map button
  $('#clearMapBtn').click(function() {
    clearMapDrawing();
  });

  // Finish line button
  $(document).on('click', '#finishLineBtn button', function() {
    finishLineDrawing();
  });

  // Map click for setting location
  $(document).on('click', '#map', function(e) {
    // This will be handled by Leaflet click event
  });
}

async function login() {
  const email = $('#loginEmail').val();
  const password = $('#loginPassword').val();
  if (!email || !password) { alert('Please enter email and password'); return; }
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({}));
      alert(err.message || 'Login failed');
      return;
    }
    const auth = await res.json();
    currentUser = {
      id: auth.UserId,
      name: auth.Name,
      email: auth.Email,
      organization: auth.Organization,
      // accept either role or roleID from server; normalize below
      role: auth.Role || auth.role || auth.roleID || auth.RoleId || auth.RoleID || ''
    };
    normalizeUserRole(currentUser);
    localStorage.setItem('navisafe_user', JSON.stringify(currentUser));
    if (auth.Token) localStorage.setItem('navisafe_token', auth.Token);
    showMainApp();
  } catch (e) {
    console.error(e);
    alert('Server unreachable');
  }
}

async function register() {
  const firstName = $('#registerName').val().trim().split(' ')[0] || '';
  const lastName = $('#registerName').val().trim().split(' ').slice(1).join(' ') || '';
  const email = $('#registerEmail').val();
  const orgCode = $('#registerOrganization').val();
  const password = $('#registerPassword').val();
  const confirm = $('#registerPasswordConfirm').val();
  if (password !== confirm) { alert('Passwords do not match'); return; }
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        phone: '',
        orgNr: mapOrgToNr(orgCode)
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({}));
      alert(err.message || 'Registration failed');
      return;
    }
    // If API returns the created user (and token), auto-normalize and store; otherwise fall back to manual sign-in
    const created = await res.json().catch(()=>null);
    if (created && created.UserId) {
      const autoUser = {
        id: created.UserId,
        name: created.Name || `${firstName} ${lastName}`.trim(),
        email: created.Email || email,
        organization: created.Organization || orgCode || '',
        role: created.Role || created.role || created.RoleId || created.roleID || ''
      };
      normalizeUserRole(autoUser);
      localStorage.setItem('navisafe_user', JSON.stringify(autoUser));
      if (created.Token) localStorage.setItem('navisafe_token', created.Token);
      alert('Account created and signed in.');
      showMainApp();
      return;
    }

    alert('Account created. You can now sign in.');
    $('.nav-link[data-bs-target="#loginTab"]').tab('show');
    $('#registerForm')[0].reset();
  } catch (e) {
    console.error(e);
    alert('Server unreachable');
  }
}

// Attach JWT to future POST requests (use when calling protected APIs)
async function authorizedPost(url, data) {
  const token = localStorage.getItem('navisafe_token');
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    },
    body: JSON.stringify(data)
  });
}

// Map organization display name to numeric orgNr used by backend
function mapOrgToNr(code) {
  switch (code) {
    case 'Kartverket': return 1;
    case 'NLA': return 2;
    case 'AirForce': return 3;
    case 'Police': return 4;
    default: return 0;
  }
}

// Simple logout that clears local state and shows login again
function logout() {
  try {
    localStorage.removeItem('navisafe_user');
    localStorage.removeItem('navisafe_token');
  } catch {}
  currentUser = null;

  // Tear down maps to avoid stale listeners
  if (map) { try { map.off(); map.remove(); } catch {} map = null; drawnItems = null; }
  if (adminMap) { try { adminMap.off(); adminMap.remove(); } catch {} adminMap = null; adminLayerGroup = null; }

  // Reset UI
  $('#adminDashboard').hide();
  $('#mainApp').hide();
  $('#loginPage').show();
}

// ========================================
// MAIN APP
// ========================================

function showMainApp() {
  // Ensure role normalized (cover any direct modifications)
  normalizeUserRole(currentUser);

  // Hide login page when user is authenticated
  $('#loginPage').hide();

  // Update user info in the header (top-right)
  $('#currentUserName').text(currentUser.name);
  $('#currentUserOrg').text('(' + currentUser.organization + ')');

  // Always initialize the map after login
  // This is important for BOTH pilots and admins
  if (!map) {
    initializeMap();
  }

  if (currentUser.role === 'admin') {
    // Admin users see the admin dashboard instead of the main pilot UI
    $('#mainApp').hide();
    showAdminDashboard();
  } else {
    // Pilot users see the main app with map and report form
    $('#mainApp').show();

    // Load existing reports (mock data for now)
    loadReports();

    // Open the "Report Obstacle" form automatically after a short delay
    setTimeout(function () {
      showReportForm();
    }, 500);
  }
}

function initializeMap() {
  // Create map centered on Norway
  const defaultView = [65.0, 13.0];
  const defaultZoom = 5;

  map = L.map('map', {
    zoomControl: true,
    touchZoom: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: false,
    tap: true,
    tapTolerance: 20, // Increased for better iPad touch
    zoomAnimation: true,
    markerZoomAnimation: true
  }).setView(defaultView, defaultZoom);
  
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
  $('#reportForm').fadeIn(300);

  // Clear previous data
  drawnItems.clearLayers();
  currentObstacleGeometry = null;
  $('#obstacleForm')[0].reset();
  $('#obstacleLat').val('');
  $('#obstacleLon').val('');
  $('#photoPreviewContainer').empty();

  // Reset GPS button
  $('#gpsToggleBtn').removeClass('active');
  $('#gpsToggleBtn').html('<i class="bi bi-crosshair fs-3 me-3"></i><span class="fs-5 fw-bold">Use My GPS Location</span><i class="bi bi-chevron-right fs-4 ms-auto"></i>');

  // Reset photo button
  $('.btn-photo-upload').html('<i class="bi bi-camera fs-2 me-3"></i><span class="fs-5 fw-bold">Take or Select Photo</span>');
  $('.btn-photo-upload').removeClass('border-success');

  // Reset status
  $('#coordsSource').removeClass('alert-success').addClass('alert-light');
  $('#coordsSource').html('<i class="bi bi-cursor-fill text-primary me-2"></i><span class="fw-bold">Tap on map above to set location</span>');

  // Get user's GPS location in background
  getUserLocation();

  // Add map click handler for manual location selection
  map.on('click', onMapClick);

  // Ensure map renders properly
  setTimeout(function() {
    map.invalidateSize();
  }, 350);
}

function hideReportForm() {
  $('#reportForm').fadeOut(300);

  // Remove map click handler
  map.off('click', onMapClick);

  // Clear drawings and markers
  drawnItems.clearLayers();
  currentObstacleGeometry = null;
  if (currentMarker) {
    map.removeLayer(currentMarker);
    currentMarker = null;
  }

  // Clear accuracy circle
  if (window.accuracyCircle) {
    map.removeLayer(window.accuracyCircle);
    window.accuracyCircle = null;
  }
}

function onMapClick(e) {
  if (drawingMode === 'point') {
    // Point mode: single click sets location
    setMapLocation(e.latlng.lat, e.latlng.lng);
  } else if (drawingMode === 'line') {
    // Line mode: build up points for polyline
    addLinePoint(e.latlng);
  }
}

function addLinePoint(latlng) {
  linePoints.push(latlng);

  // Add a marker for this point
  const pointMarker = L.circleMarker(latlng, {
    radius: 8,
    fillColor: '#0d6efd',
    color: 'white',
    weight: 3,
    fillOpacity: 1
  }).addTo(drawnItems);

  // Update or create temporary polyline
  if (linePoints.length > 1) {
    if (tempPolyline) {
      map.removeLayer(tempPolyline);
    }

    tempPolyline = L.polyline(linePoints, {
      color: '#0d6efd',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 5'
    }).addTo(map);

    // Show finish button
    $('#finishLineBtn').show();

    // Update info overlay
    $('#mapInfoText').text(`${linePoints.length} points added - Tap to add more or click Finish Line`);
  } else {
    // First point
    $('#mapInfoText').text('Tap map to add next point');
  }

  // Update coordinates to show first and last point
  const firstPoint = linePoints[0];
  const lastPoint = linePoints[linePoints.length - 1];
  $('#obstacleLat').val(`${firstPoint.lat.toFixed(6)} → ${lastPoint.lat.toFixed(6)}`);
  $('#obstacleLon').val(`${firstPoint.lng.toFixed(6)} → ${lastPoint.lng.toFixed(6)}`);

  // Update status
  $('#coordsSource').removeClass('alert-success').addClass('alert-light');
  $('#coordsSource').html(`<i class=\"bi bi-diagram-3-fill text-primary me-2\"></i><span class=\"fw-bold\">Line drawing: ${linePoints.length} point${linePoints.length > 1 ? 's' : ''}</span>`);
}

function setMapLocation(lat, lng) {
  $('#obstacleLat').val(lat.toFixed(6));
  $('#obstacleLon').val(lng.toFixed(6));

  // Check if GPS is active
  const gpsActive = $('#gpsToggleBtn').hasClass('active');

  if (!gpsActive) {
    $('#coordsSource').removeClass('alert-success').addClass('alert-light');
    $('#coordsSource').html('<i class="bi bi-pin-map-fill text-success me-2"></i><span class="fw-bold">Location set on map</span>');
  }

  // Add visual feedback
  $('#obstacleLat, #obstacleLon').addClass('border-primary');
  setTimeout(function() {
    if (!gpsActive) {
      $('#obstacleLat, #obstacleLon').removeClass('border-primary');
    }
  }, 1500);

  // Add/update marker
  if (currentMarker) {
    map.removeLayer(currentMarker);
  }

  // Custom marker icon for better visibility on iPad
  const markerColor = gpsActive ? '#28a745' : '#0d6efd';
  const customIcon = L.divIcon({
    className: 'custom-obstacle-marker',
    html: `<div style="background-color: ${markerColor}; width: 40px; height: 40px; border-radius: 50%; border: 5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); animation: marker-pop 0.3s ease;"></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  currentMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

  // Pan to marker
  map.panTo([lat, lng]);

  // Create geometry for the point
  currentObstacleGeometry = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat]
    },
    properties: {}
  };
}

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function(position) {
          userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          console.log('GPS acquired:', userLocation);

          // If GPS button is being activated, complete the process
          if ($('#gpsToggleBtn').prop('disabled')) {
            $('#gpsToggleBtn').prop('disabled', false);
            useGPSLocation();
          }
        },
        function(error) {
          console.error('GPS error:', error);
          let errorMsg = 'GPS unavailable';
          let details = 'Try enabling location services';

          if (error.code === 1) {
            errorMsg = 'GPS permission denied';
            details = 'Please allow location access in settings';
          } else if (error.code === 2) {
            errorMsg = 'GPS position unavailable';
            details = 'Cannot determine current location';
          } else if (error.code === 3) {
            errorMsg = 'GPS timeout';
            details = 'Location request took too long';
          }

          // Reset GPS button
          if ($('#gpsToggleBtn').prop('disabled')) {
            $('#gpsToggleBtn').prop('disabled', false);
            $('#gpsToggleBtn').html('<i class="bi bi-crosshair fs-3 me-3"></i><span class="fs-5 fw-bold">Use My GPS Location</span><i class="bi bi-chevron-right fs-4 ms-auto"></i>');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
    );
  }
}

function useGPSLocation() {
  if (userLocation) {
    setMapLocation(userLocation.lat, userLocation.lng);

    // Update GPS button
    const btn = $('#gpsToggleBtn');
    btn.addClass('active');
    btn.html('<i class="bi bi-check-circle-fill fs-2 me-3"></i><span class="fs-5 fw-bold">GPS Location Active</span><i class="bi bi-chevron-right fs-4 ms-auto"></i>');

    // Update status
    $('#coordsSource').removeClass('alert-light').addClass('alert-success');
    $('#coordsSource').html('<i class="bi bi-check-circle-fill text-success me-2"></i><span class="fw-bold">GPS location acquired</span>');

    $('#obstacleLat, #obstacleLon').addClass('border-success');
    map.setView([userLocation.lat, userLocation.lng], 16);

    // Add accuracy circle if available
    if (userLocation.accuracy) {
      if (window.accuracyCircle) {
        map.removeLayer(window.accuracyCircle);
      }
      window.accuracyCircle = L.circle([userLocation.lat, userLocation.lng], {
        radius: userLocation.accuracy,
        color: '#28a745',
        fillColor: '#28a745',
        fillOpacity: 0.15,
        weight: 3,
        dashArray: '10, 5'
      }).addTo(map);
    }
  } else {
    // Show loading
    const btn = $('#gpsToggleBtn');
    btn.prop('disabled', true);
    btn.html('<i class="bi bi-arrow-clockwise spin fs-2 me-3"></i><span class="fs-5 fw-bold">Getting GPS...</span>');

    setTimeout(function() {
      if (!userLocation) {
        alert('⚠️ GPS location not available.\n\nPlease:\n• Allow location access\n• Try again\n• Or tap on map to set location manually');
        btn.prop('disabled', false);
        btn.html('<i class="bi bi-crosshair fs-3 me-3"></i><span class="fs-5 fw-bold">Use My GPS Location</span><i class="bi bi-chevron-right fs-4 ms-auto"></i>');
      }
    }, 5000);

    getUserLocation();
  }
}

function useMapLocation() {
  if ($('#obstacleLat').val() && $('#obstacleLon').val()) {
    $('#coordsSource').removeClass('alert-success').addClass('alert-light');
    $('#coordsSource').html('<i class="bi bi-pin-map-fill text-primary me-2"></i><span class="fw-bold">Using map location</span>');
    $('#obstacleLat, #obstacleLon').removeClass('border-success');
  } else {
    $('#coordsSource').removeClass('alert-success').addClass('alert-light');
    $('#coordsSource').html('<i class="bi bi-cursor-fill text-primary me-2"></i><span class="fw-bold">Tap on map above to set location</span>');
  }
}

function previewPhoto(file) {
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      // Clear existing preview
      $('#photoPreviewContainer').empty();

      // Add new preview with remove button
      const previewHTML = `
        <div class="position-relative">
          <img src="${e.target.result}" alt="Photo preview" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <button type="button" class="btn btn-danger rounded-circle position-absolute" id="removePhotoBtn" style="top: 10px; right: 10px; width: 50px; height: 50px;">
            <i class="bi bi-x-lg fs-4"></i>
          </button>
        </div>
      `;
      $('#photoPreviewContainer').html(previewHTML);

      // Update photo button
      $('.btn-photo-upload').html('<i class="bi bi-camera-fill fs-2 me-3"></i><span class="fs-5 fw-bold text-success">Photo Added ✓</span>');
      $('.btn-photo-upload').addClass('border-success');

      // Remove photo handler
      $('#removePhotoBtn').click(function() {
        $('#photoPreviewContainer').empty();
        $('#obstaclePhoto').val('');
        $('.btn-photo-upload').html('<i class="bi bi-camera fs-2 me-3"></i><span class="fs-5 fw-bold">Take or Select Photo</span>');
        $('.btn-photo-upload').removeClass('border-success');
      });
    };
    reader.readAsDataURL(file);
  }
}

function submitObstacle() {
  // Validate required fields
  const obstacleType = $('#obstacleType').val();
  const obstacleHeight = $('#obstacleHeight').val();
  const lat = $('#obstacleLat').val();
  const lon = $('#obstacleLon').val();

  if (!obstacleType || !obstacleHeight) {
    alert('⚠️ Please fill in all required fields:\n• Obstacle Type\n• Height');
    return;
  }

  if (!lat || !lon) {
    alert('📍 Please set obstacle location:\n• Tap on map, or\n• Enable GPS location');
    return;
  }

  // Show loading state
  const submitBtn = $('button[type="submit"]');
  const originalText = submitBtn.html();
  submitBtn.prop('disabled', true).html('<i class="bi bi-arrow-clockwise spin me-2"></i>Submitting...');

  const formData = {
    type: $('#obstacleType').val(),
    height: $('#obstacleHeight').val() || null,
    description: $('#obstacleDescription').val(),
    geometry: currentObstacleGeometry,
    latitude: lat,
    longitude: lon,
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
  setTimeout(function() {
    const newReport = {
      id: mockReports.length + 1,
      ...formData
    };
    mockReports.push(newReport);
    reports.push(newReport);

    // Success feedback
    submitBtn.prop('disabled', false).html(originalText);

    // Show success message
    const successHTML = `
      <div class="alert alert-success alert-dismissible fade show" role="alert" style="position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 10000; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <i class="bi bi-check-circle-fill me-2"></i>
        <strong>Success!</strong> Obstacle report submitted.
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    $('body').append(successHTML);

    setTimeout(function() {
      $('.alert-success').alert('close');
    }, 3000);

    hideReportForm();
    displayReportsOnMap();

    // Generate permalink
    if (currentObstacleGeometry.geometry.type === 'Point') {
      const coords = currentObstacleGeometry.geometry.coordinates;
      const permalink = `${window.location.origin}${window.location.pathname}?lat=${coords[1]}&lng=${coords[0]}&zoom=15&report=${newReport.id}`;
      console.log('Permalink:', permalink);
    }
  }, 500); // Simulate API delay
}

function saveDraft() {
  const draftData = {
    id: 'draft_' + Date.now(),
    type: $('#obstacleType').val(),
    height: $('#obstacleHeight').val(),
    description: $('#obstacleDescription').val(),
    latitude: $('#obstacleLat').val(),
    longitude: $('#obstacleLon').val(),
    geometry: currentObstacleGeometry,
    savedAt: new Date().toISOString()
  };

  // Show loading state
  const draftBtn = $('#saveDraftBtn');
  const originalText = draftBtn.html();
  draftBtn.prop('disabled', true).html('<i class="bi bi-arrow-clockwise spin me-2"></i>Saving...');

  setTimeout(function() {
    // Save to localStorage
    const existingDrafts = JSON.parse(localStorage.getItem('navisafe_drafts') || '[]');
    existingDrafts.push(draftData);
    localStorage.setItem('navisafe_drafts', JSON.stringify(existingDrafts));

    draftBtn.prop('disabled', false).html(originalText);

    // Success feedback
    const successHTML = `
      <div class="alert alert-info alert-dismissible fade show" role="alert" style="position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 10000; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <i class="bi bi-save-fill me-2"></i>
        <strong>Draft saved!</strong> You can continue later.
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    $('body').append(successHTML);

    setTimeout(function() {
      $('.alert-info').alert('close');
    }, 3000);

    console.log('Draft saved:', draftData);
  }, 300);
}

function setDrawingMode(mode) {
  drawingMode = mode;

  // Update button states
  $('#pointModeBtn').toggleClass('active', mode === 'point');
  $('#lineModeBtn').toggleClass('active', mode === 'line');

  // Clear existing drawings
  drawnItems.clearLayers();
  currentObstacleGeometry = null;
  linePoints = [];
  if (tempPolyline) {
    map.removeLayer(tempPolyline);
    tempPolyline = null;
  }
  if (currentMarker) {
    map.removeLayer(currentMarker);
    currentMarker = null;
  }

  // Reset form
  $('#obstacleLat').val('');
  $('#obstacleLon').val('');

  // Hide finish line button
  $('#finishLineBtn').hide();

  // Update info overlay text based on mode
  if (mode === 'point') {
    $('#mapInfoText').text('Tap map to mark point');
  } else {
    $('#mapInfoText').text('Tap map to start drawing line');
  }

  // Reset status
  $('#coordsSource').removeClass('alert-success').addClass('alert-light');
  if (mode === 'point') {
    $('#coordsSource').html('<i class=\"bi bi-cursor-fill text-primary me-2\"></i><span class=\"fw-bold\">Tap on map to set location</span>');
  } else {
    $('#coordsSource').html('<i class=\"bi bi-diagram-3-fill text-primary me-2\"></i><span class=\"fw-bold\">Tap on map to start drawing line</span>');
  }
}

function finishLineDrawing() {
  if (linePoints.length < 2) {
    alert('⚠️ A line must have at least two points.');
    return;
  }

  // Create a polyline from the points
  const polyline = L.polyline(linePoints, { color: '#0d6efd' }).addTo(drawnItems);

  // Save geometry
  currentObstacleGeometry = polyline.toGeoJSON();

  // Update coordinates display
  $('#obstacleCoords').val(`Line with ${linePoints.length} points`);

  // Clear points
  linePoints = [];
  tempPolyline = null;

  // Hide finish button
  $('#finishLineBtn').hide();

  // Add map click handler for manual location selection
  map.on('click', onMapClick);

  // Ensure map renders properly
  setTimeout(function() {
    map.invalidateSize();
  }, 350);
}

function clearMapDrawing() {
  // Clear all drawn items
  drawnItems.clearLayers();

  // Reset geometry
  currentObstacleGeometry = null;

  // Reset form fields
  $('#obstacleForm')[0].reset();
  $('#obstacleLat').val('');
  $('#obstacleLon').val('');
  $('#photoPreviewContainer').empty();

  // Reset GPS button
  $('#gpsToggleBtn').removeClass('active');
  $('#gpsToggleBtn').html('<i class="bi bi-crosshair fs-3 me-3"></i><span class="fs-5 fw-bold">Use My GPS Location</span><i class="bi bi-chevron-right fs-4 ms-auto"></i>');

  // Reset photo button
  $('.btn-photo-upload').html('<i class="bi bi-camera fs-2 me-3"></i><span class="fs-5 fw-bold">Take or Select Photo</span>');
  $('.btn-photo-upload').removeClass('border-success');

  // Reset status
  $('#coordsSource').removeClass('alert-success').addClass('alert-light');
  $('#coordsSource').html('<i class="bi bi-cursor-fill text-primary me-2"></i><span class="fw-bold">Tap on map above to set location</span>');

  // Get user's GPS location in background
  getUserLocation();

  // Add map click handler for manual location selection
  map.on('click', onMapClick);

  // Ensure map renders properly
  setTimeout(function() {
    map.invalidateSize();
  }, 350);
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
  // Safety check: if the map or drawnItems are not ready, do nothing
  if (!map || !drawnItems) {
    return;
  }

  // Clear existing obstacle layers from the map
  drawnItems.clearLayers();

  // Add each report as a GeoJSON layer on the map
  reports.forEach(report => {
    if (report.geometry) {
      const layer = L.geoJSON(report.geometry, {
        // Style lines and polygons based on report status
        style: function() {
          let color = '#ffc107'; // Pending - yellow by default
          if (report.status === 'Approved') color = '#28a745'; // Approved - green
          if (report.status === 'Rejected') color = '#dc3545'; // Rejected - red

          return {
            color: color,
            weight: 3
          };
        },
        // For point geometries, use a marker
        pointToLayer: function(feature, latlng) {
          return L.marker(latlng);
        },
        // Bind a popup with basic report info
        onEachFeature: function(feature, layer) {
          layer.bindPopup(`
            <div>
              <h6>${report.type}</h6>
              <p class="mb-1"><small>${report.description}</small></p>
              <p class="mb-1"><small><strong>Reported by:</strong> ${report.reporter}</small></p>
              <p class="mb-0"><small><strong>Status:</strong> 
                <span class="badge badge-status-${report.status.toLowerCase()}">${report.status}</span>
              </small></p>
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
  // Hide the pilot main app UI and show the admin dashboard
  $('#mainApp').hide();
  $('#adminDashboard').show();

  // Load all reports (from mockReports for now)
  loadReports();

  // Update the small statistics cards (total, pending, approved, rejected)
  updateStatistics();

  // Build the table with all reports (using current filters)
  loadReportsTable();

  // Re-bind filter change events to refresh the table when filters change
  $('#filterStatus, #filterOrganization, #filterType')
      .off('change')          // Remove any previous handlers to avoid duplicates
      .on('change', loadReportsTable);
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

// Initialize the admin map inside #adminMap
function initAdminMap() {
  if (adminMap) {
    return; // already initialized
  }

  // Create Leaflet map for admin dashboard
  adminMap = L.map('adminMap', {
    zoomControl: true
  }).setView([65.0, 13.0], 5); // Center over Norway

  // Base layer (separate from pilot map so they don't conflict)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(adminMap);

  // Feature group to hold all obstacle layers
  adminLayerGroup = L.featureGroup().addTo(adminMap);

  // Draw all reports on the admin map
  displayReportsOnAdminMap();
}

// Helper: choose color based on report status
function getAdminStatusColor(status) {
  if (status === 'Approved') return '#198754'; // green
  if (status === 'Rejected') return '#dc3545'; // red
  return '#ffc107';                            // yellow for Pending/other
}

// Draw all reports on the admin map using the global "reports" array
function displayReportsOnAdminMap() {
  if (!adminLayerGroup || !adminMap) return;

  adminLayerGroup.clearLayers();

  reports.forEach(report => {
    if (!report.geometry) return;

    const color = getAdminStatusColor(report.status);

    const layer = L.geoJSON(report.geometry, {
      style: function () {
        return {
          color: color,
          weight: 3,
          opacity: 0.9
        };
      },
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9
        });
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup(`
          <div>
            <h6 class="mb-1">${report.type}</h6>
            <p class="mb-1"><small>${report.description}</small></p>
            <p class="mb-1"><small><strong>Height:</strong> ${report.height || 'N/A'} m</small></p>
            <p class="mb-1"><small><strong>Reported by:</strong> ${report.reporter} (${report.organization})</small></p>
            <p class="mb-0">
              <small><strong>Status:</strong>
                <span class="badge badge-status-${report.status.toLowerCase()}">${report.status}</span>
              </small>
            </p>
          </div>
        `);
      }
    });

    adminLayerGroup.addLayer(layer);
  });

  // Fit map to all obstacles
  if (adminLayerGroup.getLayers().length > 0) {
    adminMap.fitBounds(adminLayerGroup.getBounds(), { padding: [20, 20] });
  }
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
// ========================================
// AUTOCOMPLETE FOR OBSTACLE TYPE
// ========================================

function setupObstacleTypeAutocomplete() {
  const $input = $('#obstacleType');
  const $dropdown = $('#obstacleTypeDropdown');
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
    if (!$(e.target).closest('#obstacleType, #obstacleTypeDropdown').length) {
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

  // Handle keyboard navigation
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

