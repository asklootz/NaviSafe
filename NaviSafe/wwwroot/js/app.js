// ============================================================================
// NaviSafe - Aviation Obstacle Reporting System
// 100% Vanilla JavaScript Implementation (NO TypeScript!)
// ============================================================================

// ============================================================================
// MOCK DATA
// ============================================================================

const mockUsers = [
    { id: '1', username: 'pilot1', email: 'pilot1@nla.no', role: 'pilot', organization: 'NLA', created_at: '2025-01-15T10:00:00Z' },
    { id: '2', username: 'pilot2', email: 'pilot2@luftforsvaret.no', role: 'pilot', organization: 'Luftforsvaret', created_at: '2025-01-16T10:00:00Z' },
    { id: '3', username: 'admin', email: 'admin@kartverket.no', role: 'admin', organization: 'Kartverket', created_at: '2025-01-10T10:00:00Z' },
    { id: '4', username: 'pilot3', email: 'pilot3@politiet.no', role: 'pilot', organization: 'Politiet', created_at: '2025-01-17T10:00:00Z' },
];

const mockObstacleReports = [
    {
        id: 'r1', reporter_id: '1', reporter_name: 'pilot1', organization: 'NLA',
        obstacle_type: 'Tower', geometry_type: 'Point',
        geometry: { type: 'Point', coordinates: [8.0182, 58.1599] },
        height_meters: 45, description: 'High tower near Kristiansand Airport',
        comments: 'Observed during landing', status: 'Submitted',
        created_at: '2025-10-28T14:30:00Z', updated_at: '2025-10-28T14:30:00Z',
        reporter_position: { type: 'Point', coordinates: [8.0165, 58.1585] },
        reporter_position_accuracy: 12,
    },
    {
        id: 'r2', reporter_id: '2', reporter_name: 'pilot2', organization: 'Luftforsvaret',
        obstacle_type: 'Power Line', geometry_type: 'LineString',
        geometry: { type: 'LineString', coordinates: [[10.7522, 59.9139], [10.7700, 59.9200]] },
        height_meters: 25, description: 'Power line over Oslo Fjord',
        comments: 'Difficult to see in poor weather', status: 'Submitted',
        created_at: '2025-10-27T10:15:00Z', updated_at: '2025-10-29T09:00:00Z',
        reporter_position: { type: 'Point', coordinates: [10.7611, 59.9170] },
        reporter_position_accuracy: 15,
    },
    {
        id: 'r3', reporter_id: '1', reporter_name: 'pilot1', organization: 'NLA',
        obstacle_type: 'Wind Turbine', geometry_type: 'Point',
        geometry: { type: 'Point', coordinates: [5.7331, 58.9700] },
        height_meters: 80, description: 'Wind turbine near Stavanger',
        comments: 'New wind farm', status: 'Approved',
        created_at: '2025-10-25T16:45:00Z', updated_at: '2025-10-26T11:30:00Z',
        reporter_position: { type: 'Point', coordinates: [5.7310, 58.9680] },
        reporter_position_accuracy: 10,
    },
    {
        id: 'r5', reporter_id: '1', reporter_name: 'pilot1', organization: 'NLA',
        obstacle_type: 'Tower', geometry_type: 'Point',
        geometry: { type: 'Point', coordinates: [10.4041, 63.4368] },
        height_meters: 55, description: 'Communication tower',
        comments: 'Need to verify exact height', status: 'Draft',
        created_at: '2025-10-29T08:15:00Z', updated_at: '2025-10-29T08:15:00Z',
    },
];

// ============================================================================
// APPLICATION STATE
// ============================================================================

const state = {
    currentView: 'login',
    currentUser: null,
    theme: localStorage.getItem('navisafe_theme') || 'light',
    reports: JSON.parse(JSON.stringify(mockObstacleReports)),
    editingReport: null,
    currentPosition: null,
    gpsWatchId: null,
    map: null,
    drawLayer: null,
    geometryType: 'Point',
    currentGeometry: null,
    linePoints: [],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showToast(title, description = '') {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div style="font-weight: 600; margin-bottom: ${description ? '0.25rem' : '0'};">${title}</div>
        ${description ? `<div style="font-size: 0.875rem; color: var(--muted-foreground);">${description}</div>` : ''}
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('navisafe_theme', state.theme);
    if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function mockLogin(username, password) {
    const user = mockUsers.find(u => u.username === username);
    return (user && password.length > 0) ? user : null;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function findPotentialDuplicates(report, allReports, radiusMeters = 100) {
    const duplicates = [];
    if (report.geometry.type !== 'Point') return duplicates;

    const [lon, lat] = report.geometry.coordinates;

    for (const otherReport of allReports) {
        if (otherReport.id === report.id || otherReport.status === 'Draft') continue;

        if (otherReport.geometry.type === 'Point') {
            const [otherLon, otherLat] = otherReport.geometry.coordinates;
            const distance = calculateDistance(lat, lon, otherLat, otherLon);

            if (distance <= radiusMeters && otherReport.obstacle_type === report.obstacle_type) {
                duplicates.push({ ...otherReport, distance });
            }
        }
    }

    return duplicates.sort((a, b) => a.distance - b.distance);
}

// ============================================================================
// GPS TRACKING
// ============================================================================

function startGPSTracking() {
    if (!navigator.geolocation) {
        state.currentPosition = { lat: 58.1467, lng: 7.9956, accuracy: 50 };
        return;
    }

    state.gpsWatchId = navigator.geolocation.watchPosition(
        (position) => {
            state.currentPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
            };
            updateGPSDisplay();
        },
        (error) => {
            state.currentPosition = { lat: 58.1467, lng: 7.9956, accuracy: 50 };
            updateGPSDisplay();
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
}

function stopGPSTracking() {
    if (state.gpsWatchId) {
        navigator.geolocation.clearWatch(state.gpsWatchId);
        state.gpsWatchId = null;
    }
}

function updateGPSDisplay() {
    const gpsEl = document.getElementById('gps-coords');
    if (gpsEl && state.currentPosition) {
        gpsEl.textContent = `${state.currentPosition.lat.toFixed(6)}°N, ${state.currentPosition.lng.toFixed(6)}°E (±${state.currentPosition.accuracy.toFixed(0)}m)`;
    }
}

// ============================================================================
// SVG ICONS
// ============================================================================

const Icons = {
    moon: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>',
    sun: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>',
    arrowLeft: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>',
    list: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>',
    navigation: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>',
    camera: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>',
    send: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>',
    save: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>',
    mapPin: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>',
    minus: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"></path></svg>',
    x: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
    eye: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>',
    check: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
    checkCircle: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    alertTriangle: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
};

// ============================================================================
// VIEW RENDERING
// ============================================================================

function renderLoginScreen() {
    const savedUsername = localStorage.getItem('navisafe_remembered_username') || '';
    
    return `
        <div class="min-h-screen flex items-center justify-center p-4" style="background: linear-gradient(135deg, #EBF4FF 0%, #C3DAFE 100%);">
            <div class="absolute top-4 right-4">
                <button onclick="toggleTheme()" class="btn btn-outline btn-icon">
                    ${state.theme === 'light' ? Icons.moon : Icons.sun}
                </button>
            </div>
            <div class="card w-full max-w-md">
                <div class="card-header text-center" style="padding-bottom: 1.5rem;">
                    <div class="mx-auto w-32 h-32 flex items-center justify-center mb-4">
                        <svg viewBox="0 0 120 120" class="w-full h-full">
                            <!-- Background circle -->
                            <circle cx="60" cy="60" r="55" fill="#3B82F6" opacity="0.1"/>
                            <!-- Airplane icon -->
                            <g transform="translate(60,60)">
                                <path d="M 0,-25 L -8,-15 L -20,-15 L -5,0 L -20,15 L -8,15 L 0,25 L 8,15 L 20,15 L 5,0 L 20,-15 L 8,-15 Z" 
                                      fill="#3B82F6" 
                                      stroke="#3B82F6" 
                                      stroke-width="2"/>
                            </g>
                        </svg>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 2rem; font-weight: 700; color: #3B82F6; margin-bottom: 0.75rem;">NaviSafe</div>
                        <p class="card-description" style="line-height: 1.6;">Welcome to NaviSafe reporting system</p>
                    </div>
                </div>
                <div class="card-content">
                    <form onsubmit="handleLogin(event)" style="display: flex; flex-direction: column; gap: 1.25rem;">
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label for="username" class="label">Username</label>
                            <input id="username" type="text" class="input" placeholder="Enter username" value="${savedUsername}" required />
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label for="password" class="label">Password</label>
                            <input id="password" type="password" class="input" placeholder="Enter password" required />
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <input id="remember" type="checkbox" ${savedUsername ? 'checked' : ''} class="w-4 h-4 rounded border-gray-300" />
                            <label for="remember" style="font-size: 0.875rem; cursor: pointer;">Remember me</label>
                        </div>
                        <div id="login-error" class="text-red-500 text-sm hidden"></div>
                        <button type="submit" class="btn btn-primary w-full">Login</button>
                        <div style="font-size: 0.75rem; text-align: center; color: #6b7280; margin-top: 0.5rem; line-height: 1.8;">
                            Demo users: <strong>pilot1</strong>, <strong>pilot2</strong> (pilots) | <strong>admin</strong> (administrator)<br />
                            Password: any
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function renderPilotDashboard() {
    const userReports = state.reports.filter(r => r.reporter_id === state.currentUser.id);
    
    return `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div class="max-w-6xl mx-auto space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div style="font-size: 1.875rem; font-weight: 700; color: #3B82F6;">NaviSafe</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">${state.currentUser.username} (${state.currentUser.organization})</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="navigateTo('pilot-report')" class="btn btn-primary">
                            <span style="font-size: 1.25rem; margin-right: 0.5rem;">+</span>
                            New Report
                        </button>
                        <button onclick="toggleTheme()" class="btn btn-outline btn-icon">
                            ${state.theme === 'light' ? Icons.moon : Icons.sun}
                        </button>
                        <button onclick="handleLogout()" class="btn btn-outline">Logout</button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">My Reports</h2>
                    </div>
                    <div class="card-content">
                        ${userReports.length === 0 ? `
                            <div class="text-center py-12 text-gray-500">
                                <p>No reports yet. Click "New Report" to create your first obstacle report.</p>
                            </div>
                        ` : `
                            <div class="overflow-x-auto">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${userReports.map(report => `
                                            <tr>
                                                <td>${report.id}</td>
                                                <td>${report.obstacle_type}</td>
                                                <td>
                                                    <span class="badge ${
                                                        report.status === 'Approved' ? 'badge-green' :
                                                        report.status === 'Submitted' ? 'badge-blue' :
                                                        'badge-yellow'
                                                    }">
                                                        ${report.status}
                                                    </span>
                                                </td>
                                                <td>${new Date(report.created_at).toLocaleDateString('en-GB')}</td>
                                                <td>
                                                    ${report.status === 'Draft' ? `
                                                        <button onclick="editReport('${report.id}')" class="btn btn-outline" style="padding: 0.25rem 0.75rem;">
                                                            Edit
                                                        </button>
                                                    ` : `
                                                        <button onclick="viewReport('${report.id}')" class="btn btn-outline" style="padding: 0.25rem 0.75rem;">
                                                            ${Icons.eye} View
                                                        </button>
                                                    `}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPilotReportForm() {
    const isEditing = !!state.editingReport;
    const report = state.editingReport || {};
    
    return `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div class="max-w-4xl mx-auto space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <button onclick="navigateTo('pilot-dashboard')" class="btn btn-outline btn-icon">
                            ${Icons.arrowLeft}
                        </button>
                        <div style="font-size: 1.875rem; font-weight: 700; color: #3B82F6;">NaviSafe</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">${isEditing ? 'Edit Report' : 'New Report'}</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="navigateTo('pilot-dashboard')" class="btn btn-outline hidden md:flex">
                            ${Icons.list} My Reports
                        </button>
                        <button onclick="toggleTheme()" class="btn btn-outline btn-icon">
                            ${state.theme === 'light' ? Icons.moon : Icons.sun}
                        </button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Report Aviation Obstacle</h2>
                        <p class="card-description">Select obstacle type and mark position on map</p>
                    </div>
                    <div class="card-content">
                        <form onsubmit="handleSubmitReport(event)" class="space-y-6">
                            <div class="space-y-2">
                                <label class="label">Obstacle Type *</label>
                                <input 
                                    id="obstacle-type-input" 
                                    type="text" 
                                    class="input"
                                    placeholder="e.g., Tower, Power Line, Wind Turbine..."
                                    value="${report.obstacle_type || ''}"
                                    required
                                />
                            </div>

                            <div class="space-y-2">
                                <label for="height" class="label">Height (feet) *</label>
                                <input 
                                    id="height" 
                                    type="number" 
                                    class="input"
                                    placeholder="e.g., 150"
                                    value="${report.height_meters ? Math.round(report.height_meters * 3.28084) : ''}"
                                    oninput="updateHeightMeters(this.value)"
                                    required
                                />
                                <p id="height-meters" class="text-sm text-gray-600 dark:text-gray-400"></p>
                            </div>

                            <div class="space-y-2">
                                <label class="label">Mark Position on Map *</label>
                                
                                <div class="toggle-group mb-3">
                                    <button type="button" id="btn-point" onclick="setGeometryType('Point')" class="toggle-item active">
                                        ${Icons.mapPin} Point
                                    </button>
                                    <button type="button" id="btn-line" onclick="setGeometryType('LineString')" class="toggle-item">
                                        ${Icons.minus} Line
                                    </button>
                                </div>

                                <div style="position: relative; border: 2px solid var(--border); border-radius: var(--radius); overflow: hidden;">
                                    <div id="map" style="height: 400px; width: 100%;"></div>
                                </div>

                                <div class="alert alert-blue">
                                    <div>${Icons.navigation}</div>
                                    <div class="flex-1">
                                        <div class="font-medium mb-1">Live GPS Position</div>
                                        <div id="gps-coords" class="text-sm font-mono mb-2">
                                            ${state.currentPosition ? 
                                                `${state.currentPosition.lat.toFixed(6)}°N, ${state.currentPosition.lng.toFixed(6)}°E (±${state.currentPosition.accuracy.toFixed(0)}m)` :
                                                'Acquiring GPS signal...'
                                            }
                                        </div>
                                        <button type="button" onclick="useGPSPosition()" class="btn btn-primary" style="width: 100%;">
                                            Use My GPS Position
                                        </button>
                                    </div>
                                </div>

                                <div id="geometry-status" class="hidden text-sm text-green-600 dark:text-green-400">
                                    ✓ Position marked on map
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Photo (optional)</label>
                                <input id="photo-input" type="file" accept="image/*" capture="environment" onchange="handlePhotoUpload(event)" class="hidden" />
                                <button type="button" onclick="document.getElementById('photo-input').click()" class="btn btn-outline" style="width: 100%;">
                                    ${Icons.camera} <span id="photo-label" style="margin-left: 0.5rem;">Take or Upload Photo</span>
                                </button>
                            </div>

                            <div class="space-y-2">
                                <label for="description" class="label">Description (optional)</label>
                                <textarea 
                                    id="description" 
                                    class="textarea"
                                    rows="4"
                                    placeholder="Describe the obstacle..."
                                >${report.description || ''}</textarea>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button type="submit" class="btn btn-primary">
                                    ${Icons.send} Send Report to NRL
                                </button>
                                <button type="button" onclick="handleSubmitReport(event, true)" class="btn btn-outline">
                                    ${Icons.save} Save as Draft
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderAdminDashboard() {
    const reports = state.reports.filter(r => r.status !== 'Draft');
    
    return `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
            <div class="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 p-4">
                <div class="max-w-7xl mx-auto flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div style="font-size: 1.875rem; font-weight: 700; color: #3B82F6;">NaviSafe</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">${state.currentUser.username} (Admin)</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="toggleTheme()" class="btn btn-outline btn-icon">
                            ${state.theme === 'light' ? Icons.moon : Icons.sun}
                        </button>
                        <button onclick="handleLogout()" class="btn btn-outline">Logout</button>
                    </div>
                </div>
            </div>

            <div class="p-4 max-w-7xl mx-auto">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Submitted Reports to NRL</h2>
                        <p class="card-description">View and manage reports from pilots and flight crew</p>
                    </div>
                    <div class="card-content">
                        ${reports.length === 0 ? `
                            <div class="text-center py-12 text-gray-500">
                                <p>No reports found</p>
                            </div>
                        ` : `
                            <div class="overflow-x-auto">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Type</th>
                                            <th>Organization</th>
                                            <th>Reporter</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${reports.map(report => `
                                            <tr>
                                                <td>${report.id}</td>
                                                <td>${report.obstacle_type}</td>
                                                <td>${report.organization}</td>
                                                <td>${report.reporter_name}</td>
                                                <td>
                                                    <span class="badge ${report.status === 'Approved' ? 'badge-green' : 'badge-blue'}">
                                                        ${report.status}
                                                    </span>
                                                </td>
                                                <td>${new Date(report.created_at).toLocaleDateString('en-GB')}</td>
                                                <td>
                                                    <button onclick="viewAdminReport('${report.id}')" class="btn btn-outline" style="padding: 0.25rem 0.75rem;">
                                                        ${Icons.eye} View
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// MAP FUNCTIONS
// ============================================================================

function initMap() {
    if (state.map) {
        state.map.remove();
    }

    const centerLat = state.currentPosition ? state.currentPosition.lat : 58.1467;
    const centerLng = state.currentPosition ? state.currentPosition.lng : 7.9956;

    state.map = L.map('map').setView([centerLat, centerLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(state.map);

    state.drawLayer = L.layerGroup().addTo(state.map);

    state.map.on('click', function(e) {
        if (state.geometryType === 'Point') {
            state.drawLayer.clearLayers();
            state.linePoints = [];

            const markerIcon = L.icon({
                iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEuNCAwLjIgMi43IDAuNyAzLjlsMTEuOCAyNC42IDExLjgtMjQuNmMwLjQtMS4yIDAuNy0yLjYgMC43LTMuOUMyNSA1LjYgMTkuNCAwIDEyLjUgMHptMCAxN2MtMi41IDAtNC41LTItNC41LTQuNXMyLTQuNSA0LjUtNC41IDQuNSAyIDQuNSA0LjUtMiA0LjUtNC41IDQuNXoiIGZpbGw9IiMzMzg4ZmYiLz48L3N2Zz4=',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
            });

            L.marker(e.latlng, { icon: markerIcon }).addTo(state.drawLayer);

            state.currentGeometry = {
                type: 'Point',
                coordinates: [e.latlng.lng, e.latlng.lat],
            };

            showGeometryStatus();
        } else if (state.geometryType === 'LineString') {
            state.linePoints.push(e.latlng);

            state.drawLayer.clearLayers();

            state.linePoints.forEach(point => {
                L.circleMarker(point, { radius: 5, color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 1 }).addTo(state.drawLayer);
            });

            if (state.linePoints.length >= 2) {
                L.polyline(state.linePoints, { color: '#3B82F6', weight: 3 }).addTo(state.drawLayer);

                state.currentGeometry = {
                    type: 'LineString',
                    coordinates: state.linePoints.map(p => [p.lng, p.lat]),
                };

                showGeometryStatus();
            }
        }
    });
}

function setGeometryType(type) {
    state.geometryType = type;
    
    const btnPoint = document.getElementById('btn-point');
    const btnLine = document.getElementById('btn-line');
    
    if (type === 'Point') {
        btnPoint.classList.add('active');
        btnLine.classList.remove('active');
    } else {
        btnPoint.classList.remove('active');
        btnLine.classList.add('active');
    }
    
    clearDrawing();
}

function clearDrawing() {
    if (state.drawLayer) {
        state.drawLayer.clearLayers();
    }
    state.linePoints = [];
    state.currentGeometry = null;
    hideGeometryStatus();
}

function useGPSPosition() {
    if (!state.currentPosition || state.geometryType !== 'Point') return;
    
    if (state.drawLayer) {
        state.drawLayer.clearLayers();
    }
    
    const markerIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEuNCAwLjIgMi43IDAuNyAzLjlsMTEuOCAyNC42IDExLjgtMjQuNmMwLjQtMS4yIDAuNy0yLjYgMC43LTMuOUMyNSA1LjYgMTkuNCAwIDEyLjUgMHptMCAxN2MtMi41IDAtNC41LTItNC41LTQuNXMyLTQuNSA0LjUtNC41IDQuNSAyIDQuNSA0LjUtMiA0LjUtNC41IDQuNXoiIGZpbGw9IiMzMzg4ZmYiLz48L3N2Zz4=',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    });
    
    L.marker([state.currentPosition.lat, state.currentPosition.lng], { icon: markerIcon }).addTo(state.drawLayer);
    
    state.currentGeometry = {
        type: 'Point',
        coordinates: [state.currentPosition.lng, state.currentPosition.lat],
    };
    
    state.map.setView([state.currentPosition.lat, state.currentPosition.lng], 16);
    
    showGeometryStatus();
    showToast('GPS position used!', 'Obstacle marked at your current location');
}

function showGeometryStatus() {
    const statusEl = document.getElementById('geometry-status');
    if (statusEl) {
        statusEl.classList.remove('hidden');
    }
}

function hideGeometryStatus() {
    const statusEl = document.getElementById('geometry-status');
    if (statusEl) {
        statusEl.classList.add('hidden');
    }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    const user = mockLogin(username, password);
    
    if (user) {
        state.currentUser = user;
        
        if (remember) {
            localStorage.setItem('navisafe_remembered_username', username);
        } else {
            localStorage.removeItem('navisafe_remembered_username');
        }
        
        // Route based on user role - pilots go directly to report form
        if (user.role === 'admin') {
            navigateTo('admin-dashboard');
        } else {
            navigateTo('pilot-report');
        }
    } else {
        const errorEl = document.getElementById('login-error');
        if (errorEl) {
            errorEl.textContent = 'Invalid username or password';
            errorEl.classList.remove('hidden');
        }
    }
}

function handleLogout() {
    state.currentUser = null;
    state.editingReport = null;
    stopGPSTracking();
    navigateTo('login');
}

function handleSubmitReport(event, isDraft = false) {
    if (event) event.preventDefault();
    
    if (!state.currentGeometry) {
        showToast('Please mark the obstacle position on the map');
        return;
    }
    
    const obstacleType = document.getElementById('obstacle-type-input').value;
    const heightFeet = document.getElementById('height').value;
    const description = document.getElementById('description').value;
    
    if (!isDraft && !heightFeet) {
        showToast('Please provide obstacle height');
        return;
    }
    
    const heightMeters = heightFeet ? parseFloat(heightFeet) * 0.3048 : undefined;
    
    const report = {
        id: state.editingReport?.id || `r${Date.now()}`,
        reporter_id: state.currentUser.id,
        reporter_name: state.currentUser.username,
        organization: state.currentUser.organization,
        obstacle_type: obstacleType,
        geometry_type: state.currentGeometry.type,
        geometry: state.currentGeometry,
        height_meters: heightMeters,
        description: description,
        comments: '',
        status: isDraft ? 'Draft' : 'Submitted',
        created_at: state.editingReport?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reporter_position: state.currentPosition ? {
            type: 'Point',
            coordinates: [state.currentPosition.lng, state.currentPosition.lat]
        } : undefined,
        reporter_position_accuracy: state.currentPosition?.accuracy,
    };
    
    const index = state.reports.findIndex(r => r.id === report.id);
    if (index >= 0) {
        state.reports[index] = report;
    } else {
        state.reports.push(report);
    }
    
    if (isDraft) {
        showToast('Draft saved!', 'Your report has been saved as a draft.');
    } else {
        showToast('Report sent to NRL!', 'Your report has been submitted to Kartverket.');
    }
    
    state.editingReport = null;
    navigateTo('pilot-dashboard');
}

function updateHeightMeters(feet) {
    const heightMetersEl = document.getElementById('height-meters');
    if (heightMetersEl && feet) {
        const meters = Math.round(parseFloat(feet) * 0.3048);
        heightMetersEl.textContent = `≈ ${meters} meters`;
    } else if (heightMetersEl) {
        heightMetersEl.textContent = '';
    }
}

function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (file) {
        const label = document.getElementById('photo-label');
        if (label) {
            label.textContent = `✓ ${file.name}`;
        }
        showToast('Photo uploaded');
    }
}

function editReport(reportId) {
    const report = state.reports.find(r => r.id === reportId);
    if (report) {
        state.editingReport = report;
        navigateTo('pilot-report');
    }
}

function viewReport(reportId) {
    const report = state.reports.find(r => r.id === reportId);
    if (report) {
        alert(`Report #${report.id}\n\nType: ${report.obstacle_type}\nHeight: ${report.height_meters}m\nStatus: ${report.status}\nDescription: ${report.description}`);
    }
}

function viewAdminReport(reportId) {
    const report = state.reports.find(r => r.id === reportId);
    if (report) {
        const duplicates = findPotentialDuplicates(report, state.reports);
        let message = `Report #${report.id}\n\nType: ${report.obstacle_type}\nHeight: ${report.height_meters}m\nOrganization: ${report.organization}\nReporter: ${report.reporter_name}\nStatus: ${report.status}\nDescription: ${report.description}`;
        
        if (duplicates.length > 0) {
            message += `\n\n⚠ Warning: ${duplicates.length} potential duplicate(s) found within 100m!`;
        }
        
        if (report.status === 'Submitted') {
            if (confirm(message + '\n\nApprove this report?')) {
                approveReport(reportId);
            }
        } else {
            alert(message);
        }
    }
}

function approveReport(reportId) {
    const index = state.reports.findIndex(r => r.id === reportId);
    if (index >= 0) {
        state.reports[index].status = 'Approved';
        state.reports[index].updated_at = new Date().toISOString();
        
        showToast('Report Approved', 'The report has been approved and registered in NRL.');
        
        navigateTo('admin-dashboard');
    }
}

// ============================================================================
// NAVIGATION
// ============================================================================

function navigateTo(view) {
    state.currentView = view;
    render();
    
    if (view === 'pilot-report') {
        startGPSTracking();
        setTimeout(() => {
            initMap();
            setInterval(updateGPSDisplay, 1000);
        }, 100);
    } else {
        stopGPSTracking();
    }
}

function render() {
    const app = document.getElementById('app');
    
    let html = '';
    
    switch (state.currentView) {
        case 'login':
            html = renderLoginScreen();
            break;
        case 'pilot-dashboard':
            html = renderPilotDashboard();
            break;
        case 'pilot-report':
            html = renderPilotReportForm();
            break;
        case 'admin-dashboard':
            html = renderAdminDashboard();
            break;
        default:
            html = renderLoginScreen();
    }
    
    app.innerHTML = html;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize app when DOM is ready and all scripts are loaded
function initApp() {
    if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
    }
    render();
}

// Make sure Leaflet is loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM already loaded, check if Leaflet is ready
    if (typeof L !== 'undefined') {
        initApp();
    } else {
        // Wait for Leaflet to load
        window.addEventListener('load', initApp);
    }
}