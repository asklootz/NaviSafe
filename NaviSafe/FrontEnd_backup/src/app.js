// ============================================================================
// NaviSafe - Aviation Obstacle Reporting System
// Vanilla JavaScript Implementation
// ============================================================================

// ============================================================================
// DATA & STATE MANAGEMENT
// ============================================================================

// Mock Users
const mockUsers = [
    {
        id: '1',
        username: 'pilot1',
        email: 'pilot1@nla.no',
        role: 'pilot',
        organization: 'NLA',
        created_at: '2025-01-15T10:00:00Z',
    },
    {
        id: '2',
        username: 'pilot2',
        email: 'pilot2@luftforsvaret.no',
        role: 'pilot',
        organization: 'Luftforsvaret',
        created_at: '2025-01-16T10:00:00Z',
    },
    {
        id: '3',
        username: 'admin',
        email: 'admin@kartverket.no',
        role: 'admin',
        organization: 'Kartverket',
        created_at: '2025-01-10T10:00:00Z',
    },
    {
        id: '4',
        username: 'pilot3',
        email: 'pilot3@politiet.no',
        role: 'pilot',
        organization: 'Politiet',
        created_at: '2025-01-17T10:00:00Z',
    },
];

// Mock Obstacle Reports
const mockObstacleReports = [
    {
        id: 'r1',
        reporter_id: '1',
        reporter_name: 'pilot1',
        organization: 'NLA',
        obstacle_type: 'Tower',
        geometry_type: 'Point',
        geometry: {
            type: 'Point',
            coordinates: [8.0182, 58.1599],
        },
        height_meters: 45,
        description: 'High tower near Kristiansand Airport',
        comments: 'Observed during landing',
        status: 'Submitted',
        created_at: '2025-10-28T14:30:00Z',
        updated_at: '2025-10-28T14:30:00Z',
        reporter_position: {
            type: 'Point',
            coordinates: [8.0165, 58.1585],
        },
        reporter_position_accuracy: 12,
    },
    {
        id: 'r2',
        reporter_id: '2',
        reporter_name: 'pilot2',
        organization: 'Luftforsvaret',
        obstacle_type: 'Power Line',
        geometry_type: 'LineString',
        geometry: {
            type: 'LineString',
            coordinates: [
                [10.7522, 59.9139],
                [10.7700, 59.9200],
            ],
        },
        height_meters: 25,
        description: 'Power line over Oslo Fjord',
        comments: 'Difficult to see in poor weather',
        status: 'Submitted',
        created_at: '2025-10-27T10:15:00Z',
        updated_at: '2025-10-29T09:00:00Z',
        reporter_position: {
            type: 'Point',
            coordinates: [10.7611, 59.9170],
        },
        reporter_position_accuracy: 15,
    },
    {
        id: 'r3',
        reporter_id: '1',
        reporter_name: 'pilot1',
        organization: 'NLA',
        obstacle_type: 'Wind Turbine',
        geometry_type: 'Point',
        geometry: {
            type: 'Point',
            coordinates: [5.7331, 58.9700],
        },
        height_meters: 80,
        description: 'Wind turbine near Stavanger',
        comments: 'New wind farm',
        status: 'Approved',
        created_at: '2025-10-25T16:45:00Z',
        updated_at: '2025-10-26T11:30:00Z',
        reporter_position: {
            type: 'Point',
            coordinates: [5.7310, 58.9680],
        },
        reporter_position_accuracy: 10,
    },
    {
        id: 'r5',
        reporter_id: '1',
        reporter_name: 'pilot1',
        organization: 'NLA',
        obstacle_type: 'Tower',
        geometry_type: 'Point',
        geometry: {
            type: 'Point',
            coordinates: [10.4041, 63.4368],
        },
        height_meters: 55,
        description: 'Communication tower',
        comments: 'Need to verify exact height',
        status: 'Draft',
        created_at: '2025-10-29T08:15:00Z',
        updated_at: '2025-10-29T08:15:00Z',
    },
];

// Application State
const state = {
    currentView: 'login',
    currentUser: null,
    theme: localStorage.getItem('navisafe_theme') || 'light',
    reports: [...mockObstacleReports],
    selectedReport: null,
    editingReport: null,
    currentPosition: null,
    gpsWatchId: null,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showToast(message, description = '', type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    const bgColor = type === 'success' ? 'bg-green-50 dark:bg-green-900' : 
                    type === 'error' ? 'bg-red-50 dark:bg-red-900' : 
                    'bg-blue-50 dark:bg-blue-900';
    const textColor = type === 'success' ? 'text-green-900 dark:text-green-100' : 
                      type === 'error' ? 'text-red-900 dark:text-red-100' : 
                      'text-blue-900 dark:text-blue-100';
    
    toast.innerHTML = `
        <div class="${bgColor} ${textColor} p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div class="flex items-start gap-3">
                <span class="text-2xl">${icon}</span>
                <div>
                    <div class="font-medium">${message}</div>
                    ${description ? `<div class="text-sm mt-1 opacity-80">${description}</div>` : ''}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('navisafe_theme', state.theme);
    applyTheme();
}

function applyTheme() {
    if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function mockLogin(username, password) {
    const user = mockUsers.find(u => u.username === username);
    if (user && password.length > 0) {
        return user;
    }
    return null;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
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
// GPS FUNCTIONALITY
// ============================================================================

function startGPSTracking() {
    if (!navigator.geolocation) {
        // Mock GPS position for development
        state.currentPosition = {
            lat: 58.1467,
            lng: 7.9956,
            accuracy: 50,
        };
        return;
    }

    state.gpsWatchId = navigator.geolocation.watchPosition(
        (position) => {
            state.currentPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
            };
        },
        (error) => {
            // Use fallback position on error
            state.currentPosition = {
                lat: 58.1467,
                lng: 7.9956,
                accuracy: 50,
            };
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000,
        }
    );
}

function stopGPSTracking() {
    if (state.gpsWatchId) {
        navigator.geolocation.clearWatch(state.gpsWatchId);
        state.gpsWatchId = null;
    }
}

// ============================================================================
// VIEW RENDERING FUNCTIONS
// ============================================================================

function renderLoginScreen() {
    const savedUsername = localStorage.getItem('navisafe_remembered_username') || '';
    
    return `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div class="absolute top-4 right-4">
                <button onclick="toggleTheme()" class="btn btn-secondary p-3 rounded-full" aria-label="Toggle theme">
                    ${state.theme === 'light' ? 
                        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>' :
                        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>'
                    }
                </button>
            </div>
            <div class="card w-full max-w-md">
                <div class="text-center space-y-4 mb-6">
                    <div class="mx-auto w-48 h-48 flex items-center justify-center">
                        <svg class="w-full h-full text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                    </div>
                    <h1 class="text-2xl font-semibold">Login</h1>
                    <p class="text-gray-600 dark:text-gray-400">Welcome to NaviSafe reporting system</p>
                </div>
                <form onsubmit="handleLogin(event)" class="space-y-4">
                    <div class="space-y-2">
                        <label for="username" class="block font-medium">Username</label>
                        <input 
                            id="username" 
                            type="text" 
                            class="input" 
                            placeholder="Enter username"
                            value="${savedUsername}"
                            required
                        />
                    </div>
                    <div class="space-y-2">
                        <label for="password" class="block font-medium">Password</label>
                        <input 
                            id="password" 
                            type="password" 
                            class="input" 
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    <div class="flex items-center space-x-2">
                        <input 
                            id="remember" 
                            type="checkbox" 
                            ${savedUsername ? 'checked' : ''}
                            class="w-4 h-4 rounded border-gray-300"
                        />
                        <label for="remember" class="text-sm cursor-pointer">Remember me</label>
                    </div>
                    <div id="login-error" class="text-red-500 text-sm hidden"></div>
                    <button type="submit" class="btn btn-primary w-full py-3">
                        Login
                    </button>
                    <div class="text-xs text-center text-gray-500 mt-4">
                        Demo users: pilot1, pilot2 (pilots) | admin (administrator)
                        <br />
                        Password: any
                    </div>
                </form>
            </div>
        </div>
    `;
}

function renderPilotDashboard() {
    const userReports = state.reports.filter(r => r.reporter_id === state.currentUser.id);
    
    return `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div class="max-w-6xl mx-auto space-y-4">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <svg class="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                        <div>
                            <h1 class="text-xl font-semibold">NaviSafe</h1>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${state.currentUser.username} (${state.currentUser.organization})</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="navigateTo('pilot-report')" class="btn btn-primary py-3 px-6">
                            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            New Report
                        </button>
                        <button onclick="toggleTheme()" class="btn btn-secondary p-3 rounded-full">
                            ${state.theme === 'light' ? 
                                '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>' :
                                '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>'
                            }
                        </button>
                        <button onclick="handleLogout()" class="btn btn-secondary py-3 px-6">
                            Logout
                        </button>
                    </div>
                </div>

                <!-- Reports Card -->
                <div class="card">
                    <h2 class="text-xl font-semibold mb-4">My Reports</h2>
                    ${userReports.length === 0 ? `
                        <div class="text-center py-12 text-gray-500">
                            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
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
                                            <td>${new Date(report.created_at).toLocaleDateString('en-US')}</td>
                                            <td>
                                                ${report.status === 'Draft' ? `
                                                    <button onclick="editReport('${report.id}')" class="btn btn-secondary btn-sm px-3 py-1 text-sm">
                                                        Edit
                                                    </button>
                                                ` : `
                                                    <button onclick="viewReport('${report.id}')" class="btn btn-secondary btn-sm px-3 py-1 text-sm">
                                                        View
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
    `;
}

function renderPilotReportForm() {
    const isEditing = !!state.editingReport;
    const report = state.editingReport || {};
    
    return `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div class="max-w-4xl mx-auto space-y-4">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <svg class="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                        <div>
                            <h1 class="text-xl font-semibold">NaviSafe</h1>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${isEditing ? 'Edit Report' : 'New Report'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="navigateTo('pilot-dashboard')" class="btn btn-secondary hidden md:block">
                            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                            My Reports
                        </button>
                        <button onclick="toggleTheme()" class="btn btn-secondary p-3 rounded-full">
                            ${state.theme === 'light' ? 
                                '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>' :
                                '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>'
                            }
                        </button>
                    </div>
                </div>

                <!-- Form Card -->
                <div class="card">
                    <h2 class="text-xl font-semibold mb-2">Report Aviation Obstacle</h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Select obstacle type and mark position on map</p>
                    
                    <form onsubmit="handleSubmitReport(event)" class="space-y-6">
                        <!-- Obstacle Type -->
                        <div class="space-y-3">
                            <label class="block font-medium">Obstacle Type *</label>
                            <div class="relative">
                                <input 
                                    id="obstacle-type-input" 
                                    type="text" 
                                    class="input text-lg h-14"
                                    placeholder="Type to search or enter custom type..."
                                    value="${report.obstacle_type || ''}"
                                    onfocus="showObstacleTypeDropdown()"
                                    onblur="setTimeout(() => hideObstacleTypeDropdown(), 200)"
                                    oninput="filterObstacleTypes(this.value)"
                                    required
                                />
                                <div id="obstacle-type-dropdown" class="autocomplete-dropdown hidden"></div>
                            </div>
                        </div>

                        <!-- Height -->
                        <div class="space-y-3">
                            <label for="height" class="block font-medium">Height (feet) *</label>
                            <input 
                                id="height" 
                                type="number" 
                                class="input text-lg h-16"
                                placeholder="e.g. 150"
                                value="${report.height_meters ? Math.round(report.height_meters * 3.28084) : ''}"
                                oninput="updateHeightMeters(this.value)"
                                required
                            />
                            <p id="height-meters" class="text-sm text-gray-600 dark:text-gray-400"></p>
                        </div>

                        <!-- Map -->
                        <div class="space-y-3">
                            <label class="block font-medium">Mark Position on Map *</label>
                            <div class="relative border-4 border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
                                <div id="map" style="height: 450px; width: 100%;"></div>
                                
                                <!-- Location Type Buttons -->
                                <div class="absolute left-3 bottom-3 z-[1000] flex flex-col gap-2">
                                    <button type="button" id="btn-point" onclick="setGeometryType('Point')" 
                                        class="flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all shadow-lg bg-blue-600 text-white border-blue-600">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        </svg>
                                        <span class="text-sm">Point</span>
                                    </button>
                                    <button type="button" id="btn-line" onclick="setGeometryType('LineString')"
                                        class="flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all shadow-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"></path>
                                        </svg>
                                        <span class="text-sm">Line</span>
                                    </button>
                                    <button type="button" onclick="clearDrawing()"
                                        class="flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all shadow-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                        <span class="text-sm">Clear</span>
                                    </button>
                                </div>
                            </div>

                            <!-- GPS Position Info -->
                            <div class="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div class="flex items-start gap-3">
                                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                    </svg>
                                    <div class="flex-1 space-y-3">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <span class="text-blue-900 dark:text-blue-100">Live GPS: </span>
                                                <span id="gps-coords" class="text-blue-800 dark:text-blue-200 font-mono text-sm">
                                                    ${state.currentPosition ? 
                                                        `${state.currentPosition.lat.toFixed(6)}°N, ${state.currentPosition.lng.toFixed(6)}°E (±${state.currentPosition.accuracy.toFixed(0)}m)` :
                                                        'Acquiring GPS signal...'
                                                    }
                                                </span>
                                            </div>
                                            ${state.currentPosition ? `
                                                <div class="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                                                    <div class="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                                                    Active
                                                </div>
                                            ` : ''}
                                        </div>
                                        <button type="button" id="use-gps-btn" onclick="useGPSPosition()" 
                                            class="btn btn-primary w-full h-16 text-lg ${!state.currentPosition ? 'opacity-50 cursor-not-allowed' : ''}"
                                            ${!state.currentPosition ? 'disabled' : ''}>
                                            <svg class="w-6 h-6 inline mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                            </svg>
                                            Use My GPS Position
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div id="geometry-status" class="text-sm text-green-600 flex items-center gap-2 hidden">
                                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                                Position marked on map
                            </div>

                            <!-- Manual Coordinates -->
                            <div id="manual-coords" class="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <label class="block font-medium text-base">Or Enter Coordinates Manually</label>
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="space-y-2">
                                        <label for="latitude" class="block text-sm">Latitude (Y) *</label>
                                        <input 
                                            id="latitude" 
                                            type="number" 
                                            step="0.000001" 
                                            class="input h-12"
                                            placeholder="e.g. 58.146700"
                                            oninput="updateManualCoordinates()"
                                        />
                                        <p class="text-xs text-gray-500 dark:text-gray-400">Range: -90 to 90</p>
                                    </div>
                                    <div class="space-y-2">
                                        <label for="longitude" class="block text-sm">Longitude (X) *</label>
                                        <input 
                                            id="longitude" 
                                            type="number" 
                                            step="0.000001" 
                                            class="input h-12"
                                            placeholder="e.g. 7.995600"
                                            oninput="updateManualCoordinates()"
                                        />
                                        <p class="text-xs text-gray-500 dark:text-gray-400">Range: -180 to 180</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Photo Upload -->
                        <div class="space-y-3">
                            <label class="block font-medium">Photo (optional)</label>
                            <input 
                                id="photo-input" 
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                onchange="handlePhotoUpload(event)"
                                class="hidden"
                            />
                            <button type="button" onclick="document.getElementById('photo-input').click()" 
                                class="btn btn-secondary h-16 w-full">
                                <svg class="w-6 h-6 inline mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <span id="photo-label">Take or Upload Photo</span>
                            </button>
                        </div>

                        <!-- Description -->
                        <div class="space-y-3">
                            <label for="description" class="block font-medium">Description (optional)</label>
                            <textarea 
                                id="description" 
                                class="input text-lg"
                                rows="4"
                                placeholder="Describe the obstacle..."
                            >${report.description || ''}</textarea>
                        </div>

                        <!-- Action Buttons -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <button type="submit" class="btn btn-primary h-20 text-lg">
                                <svg class="w-6 h-6 inline mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                </svg>
                                Send Report to NRL
                            </button>
                            <button type="button" onclick="handleSubmitReport(event, true)" class="btn btn-secondary h-20 text-lg">
                                <svg class="w-6 h-6 inline mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                                </svg>
                                Save as Draft
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function renderAdminDashboard() {
    const reports = state.reports.filter(r => r.status !== 'Draft');
    
    return `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
            <!-- Header -->
            <div class="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4">
                <div class="flex items-center justify-between max-w-7xl mx-auto">
                    <div class="flex items-center gap-3">
                        <svg class="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                        <div>
                            <h1 class="text-xl font-semibold">Submitted Reports to NRL</h1>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${state.currentUser.username} (Admin)</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="toggleTheme()" class="btn btn-secondary p-3 rounded-full">
                            ${state.theme === 'light' ? 
                                '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>' :
                                '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>'
                            }
                        </button>
                        <button onclick="handleLogout()" class="btn btn-secondary py-3 px-6">
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
                <div class="card">
                    <h2 class="text-xl font-semibold mb-2">Reports Management</h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">View and manage reports from pilots and flight crew</p>
                    
                    <!-- Filters -->
                    <div class="flex flex-col md:flex-row gap-4 mb-6">
                        <div class="flex-1">
                            <label for="admin-sort" class="block text-sm font-medium mb-2">Sort by</label>
                            <select id="admin-sort" onchange="updateAdminView()" class="input">
                                <option value="date-newest">Newest first</option>
                                <option value="date-oldest">Oldest first</option>
                                <option value="duplicates-most">Most duplicates</option>
                            </select>
                        </div>
                        <div class="flex-1">
                            <label for="admin-status" class="block text-sm font-medium mb-2">Status</label>
                            <select id="admin-status" onchange="updateAdminView()" class="input">
                                <option value="all">All</option>
                                <option value="Submitted" selected>Submitted</option>
                                <option value="Approved">Approved</option>
                            </select>
                        </div>
                    </div>

                    <!-- Reports Table -->
                    <div id="reports-list" class="overflow-x-auto">
                        ${renderAdminReportsTable(reports)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderAdminReportsTable(reports) {
    if (reports.length === 0) {
        return `
            <div class="text-center py-12 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p>No reports found</p>
            </div>
        `;
    }

    return `
        <div class="border rounded-lg overflow-hidden">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Organization</th>
                        <th>Reporter</th>
                        <th>Status</th>
                        <th>Duplicates</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${reports.map(report => {
                        const duplicates = findPotentialDuplicates(report, state.reports);
                        return `
                            <tr>
                                <td>${report.id}</td>
                                <td>${report.obstacle_type}</td>
                                <td>${report.organization}</td>
                                <td>${report.reporter_name}</td>
                                <td>
                                    <span class="badge ${
                                        report.status === 'Approved' ? 'badge-green' :
                                        report.status === 'Submitted' ? 'badge-blue' :
                                        'badge-yellow'
                                    }">
                                        ${report.status}
                                    </span>
                                </td>
                                <td>
                                    ${duplicates.length > 0 ? `
                                        <span class="badge badge-yellow">
                                            ⚠ ${duplicates.length}
                                        </span>
                                    ` : `<span class="text-gray-400">-</span>`}
                                </td>
                                <td>${new Date(report.created_at).toLocaleDateString('en-US')}</td>
                                <td>
                                    <button onclick="viewAdminReport('${report.id}')" class="btn btn-secondary px-3 py-1 text-sm">
                                        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                        View
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ============================================================================
// MAP FUNCTIONALITY
// ============================================================================

let map = null;
let drawLayer = null;
let geometryType = 'Point';
let currentGeometry = null;
let linePoints = [];

function initMap() {
    if (map) {
        map.remove();
    }

    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    const centerLat = state.currentPosition ? state.currentPosition.lat : 58.1467;
    const centerLng = state.currentPosition ? state.currentPosition.lng : 7.9956;

    map = L.map('map').setView([centerLat, centerLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(map);

    drawLayer = L.layerGroup().addTo(map);

    // Add user position marker if available
    if (state.currentPosition) {
        const userIcon = L.divIcon({
            className: 'user-position-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
        });

        L.marker([state.currentPosition.lat, state.currentPosition.lng], { icon: userIcon })
            .addTo(map)
            .bindPopup('Your current position');
    }

    // Handle map clicks for drawing
    map.on('click', function(e) {
        if (geometryType === 'Point') {
            // Clear previous markers
            drawLayer.clearLayers();
            linePoints = [];

            // Add new marker
            const markerIcon = L.icon({
                iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEuNCAwLjIgMi43IDAuNyAzLjlsMTEuOCAyNC42IDExLjgtMjQuNmMwLjQtMS4yIDAuNy0yLjYgMC43LTMuOUMyNSA1LjYgMTkuNCAwIDEyLjUgMHptMCAxN2MtMi41IDAtNC41LTItNC41LTQuNXMyLTQuNSA0LjUtNC41IDQuNSAyIDQuNSA0LjUtMiA0LjUtNC41IDQuNXoiIGZpbGw9IiMzMzg4ZmYiLz48L3N2Zz4=',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
            });

            L.marker(e.latlng, { icon: markerIcon }).addTo(drawLayer);

            currentGeometry = {
                type: 'Point',
                coordinates: [e.latlng.lng, e.latlng.lat],
            };

            // Update manual coordinate inputs
            document.getElementById('latitude').value = e.latlng.lat.toFixed(6);
            document.getElementById('longitude').value = e.latlng.lng.toFixed(6);

            showGeometryStatus();
        } else if (geometryType === 'LineString') {
            linePoints.push(e.latlng);

            drawLayer.clearLayers();

            linePoints.forEach(point => {
                L.circleMarker(point, { radius: 5, color: 'red' }).addTo(drawLayer);
            });

            if (linePoints.length >= 2) {
                L.polyline(linePoints, { color: 'red', weight: 3 }).addTo(drawLayer);

                currentGeometry = {
                    type: 'LineString',
                    coordinates: linePoints.map(p => [p.lng, p.lat]),
                };

                showGeometryStatus();
            }
        }
    });
}

function setGeometryType(type) {
    geometryType = type;
    
    // Update button styles
    const btnPoint = document.getElementById('btn-point');
    const btnLine = document.getElementById('btn-line');
    const manualCoords = document.getElementById('manual-coords');
    const useGpsBtn = document.getElementById('use-gps-btn');
    
    if (type === 'Point') {
        btnPoint.className = 'flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all shadow-lg bg-blue-600 text-white border-blue-600';
        btnLine.className = 'flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all shadow-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400';
        if (manualCoords) manualCoords.classList.remove('hidden');
        if (useGpsBtn) useGpsBtn.classList.remove('hidden');
    } else {
        btnPoint.className = 'flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all shadow-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400';
        btnLine.className = 'flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all shadow-lg bg-blue-600 text-white border-blue-600';
        if (manualCoords) manualCoords.classList.add('hidden');
        if (useGpsBtn) useGpsBtn.classList.add('hidden');
    }
    
    clearDrawing();
}

function clearDrawing() {
    if (drawLayer) {
        drawLayer.clearLayers();
    }
    linePoints = [];
    currentGeometry = null;
    hideGeometryStatus();
    
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    if (latInput) latInput.value = '';
    if (lngInput) lngInput.value = '';
    
    showToast('Drawing cleared', 'Click on map to start drawing again', 'info');
}

function useGPSPosition() {
    if (!state.currentPosition || geometryType !== 'Point') return;
    
    if (drawLayer) {
        drawLayer.clearLayers();
    }
    
    const markerIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEuNCAwLjIgMi43IDAuNyAzLjlsMTEuOCAyNC42IDExLjgtMjQuNmMwLjQtMS4yIDAuNy0yLjYgMC43LTMuOUMyNSA1LjYgMTkuNCAwIDEyLjUgMHptMCAxN2MtMi41IDAtNC41LTItNC41LTQuNXMyLTQuNSA0LjUtNC41IDQuNSAyIDQuNSA0LjUtMiA0LjUtNC41IDQuNXoiIGZpbGw9IiMzMzg4ZmYiLz48L3N2Zz4=',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    });
    
    L.marker([state.currentPosition.lat, state.currentPosition.lng], { icon: markerIcon }).addTo(drawLayer);
    
    currentGeometry = {
        type: 'Point',
        coordinates: [state.currentPosition.lng, state.currentPosition.lat],
    };
    
    document.getElementById('latitude').value = state.currentPosition.lat.toFixed(6);
    document.getElementById('longitude').value = state.currentPosition.lng.toFixed(6);
    
    map.setView([state.currentPosition.lat, state.currentPosition.lng], 16);
    
    showGeometryStatus();
    showToast('GPS position used!', 'Obstacle marked at your current location');
}

function updateManualCoordinates() {
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        if (drawLayer) {
            drawLayer.clearLayers();
        }
        
        const markerIcon = L.icon({
            iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEuNCAwLjIgMi43IDAuNyAzLjlsMTEuOCAyNC42IDExLjgtMjQuNmMwLjQtMS4yIDAuNy0yLjYgMC43LTMuOUMyNSA1LjYgMTkuNCAwIDEyLjUgMHptMCAxN2MtMi41IDAtNC15LTItNC41LTQuNXMyLTQuNSA0LjUtNC41IDQuNSAyIDQuNSA0LjUtMiA0LjUtNC41IDQuNXoiIGZpbGw9IiMzMzg4ZmYiLz48L3N2Zz4=',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
        });
        
        L.marker([lat, lng], { icon: markerIcon }).addTo(drawLayer);
        map.setView([lat, lng], 14);
        
        currentGeometry = {
            type: 'Point',
            coordinates: [lng, lat],
        };
        
        showGeometryStatus();
    }
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
// OBSTACLE TYPE AUTOCOMPLETE
// ============================================================================

const obstacleTypes = ['Tower', 'Power Line', 'Wind Turbine', 'Building', 'Other'];

function showObstacleTypeDropdown() {
    const input = document.getElementById('obstacle-type-input');
    const dropdown = document.getElementById('obstacle-type-dropdown');
    if (dropdown) {
        filterObstacleTypes(input.value);
        dropdown.classList.remove('hidden');
    }
}

function hideObstacleTypeDropdown() {
    const dropdown = document.getElementById('obstacle-type-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

function filterObstacleTypes(value) {
    const dropdown = document.getElementById('obstacle-type-dropdown');
    if (!dropdown) return;
    
    const filtered = obstacleTypes.filter(type => 
        type.toLowerCase().includes(value.toLowerCase())
    );
    
    if (filtered.length === 0 && value) {
        dropdown.innerHTML = `
            <div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No matching types found. Press Enter to use custom type.
            </div>
        `;
    } else {
        dropdown.innerHTML = filtered.map(type => `
            <button type="button" class="autocomplete-item" onclick="selectObstacleType('${type}')">
                ${getObstacleIcon(type)}
                <span>${type}</span>
            </button>
        `).join('');
    }
    
    dropdown.classList.remove('hidden');
}

function selectObstacleType(type) {
    document.getElementById('obstacle-type-input').value = type;
    hideObstacleTypeDropdown();
}

function getObstacleIcon(type) {
    const icons = {
        'Tower': '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>',
        'Power Line': '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>',
        'Wind Turbine': '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        'Building': '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>',
        'Other': '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    };
    return icons[type] || icons['Other'];
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
    
    if (!currentGeometry) {
        showToast('Please mark the obstacle position on the map', '', 'error');
        return;
    }
    
    const obstacleType = document.getElementById('obstacle-type-input').value;
    const heightFeet = document.getElementById('height').value;
    const description = document.getElementById('description').value;
    
    if (!isDraft && !heightFeet) {
        showToast('Please provide obstacle height', '', 'error');
        return;
    }
    
    const heightMeters = heightFeet ? parseFloat(heightFeet) * 0.3048 : undefined;
    
    const report = {
        id: state.editingReport?.id || `r${Date.now()}`,
        reporter_id: state.currentUser.id,
        reporter_name: state.currentUser.username,
        organization: state.currentUser.organization,
        obstacle_type: obstacleType,
        geometry_type: currentGeometry.type,
        geometry: currentGeometry,
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
    
    // Update or add report
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
        state.selectedReport = report;
        // Simple alert for now - could be enhanced with modal
        alert(`Report #${report.id}\n\nType: ${report.obstacle_type}\nHeight: ${report.height_meters}m\nStatus: ${report.status}\nDescription: ${report.description}`);
    }
}

function viewAdminReport(reportId) {
    const report = state.reports.find(r => r.id === reportId);
    if (report) {
        state.selectedReport = report;
        showAdminReportModal(report);
    }
}

function showAdminReportModal(report) {
    const duplicates = findPotentialDuplicates(report, state.reports);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2 class="text-2xl font-semibold mb-2">Report Details #${report.id}</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Reported by ${report.reporter_name} (${report.organization}) on ${new Date(report.created_at).toLocaleDateString('en-US')}
            </p>
            
            ${duplicates.length > 0 ? `
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6">
                    <div class="flex items-start gap-3">
                        <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        <div>
                            <h3 class="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Potential Duplicate Reports</h3>
                            <p class="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                                Found ${duplicates.length} similar report${duplicates.length > 1 ? 's' : ''} within 100m with the same obstacle type.
                            </p>
                            <div class="space-y-2">
                                ${duplicates.map(dup => `
                                    <div class="bg-white dark:bg-gray-800 rounded border border-yellow-200 dark:border-yellow-800 p-3">
                                        <div><strong>Report #${dup.id}</strong> - ${dup.obstacle_type}</div>
                                        <div class="text-sm">Distance: ${Math.round(dup.distance)}m</div>
                                        <div class="text-sm">Height: ${dup.height_meters}m</div>
                                        <div class="text-sm">Reporter: ${dup.reporter_name} (${dup.organization})</div>
                                        <div class="text-sm">Status: ${dup.status}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <div class="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block font-medium mb-2">Status</label>
                    <span class="badge ${
                        report.status === 'Approved' ? 'badge-green' :
                        report.status === 'Submitted' ? 'badge-blue' :
                        'badge-yellow'
                    }">
                        ${report.status}
                    </span>
                </div>
                <div>
                    <label class="block font-medium mb-2">Obstacle Type</label>
                    <p>${report.obstacle_type}</p>
                </div>
                <div>
                    <label class="block font-medium mb-2">Height</label>
                    <p>${report.height_meters ? `${report.height_meters} meters` : 'Not specified'}</p>
                </div>
                <div>
                    <label class="block font-medium mb-2">Geometry</label>
                    <p>${report.geometry_type === 'Point' ? 'Point' : 'Line'}</p>
                </div>
            </div>
            
            <div class="mb-6">
                <label class="block font-medium mb-2">Description</label>
                <p>${report.description}</p>
            </div>
            
            ${report.reporter_position ? `
                <div class="mb-6">
                    <label class="block font-medium mb-2">Reporter GPS Position</label>
                    <p class="text-sm font-mono">
                        ${report.reporter_position.coordinates[1].toFixed(6)}°N, ${report.reporter_position.coordinates[0].toFixed(6)}°E
                        ${report.reporter_position_accuracy ? `(±${report.reporter_position_accuracy.toFixed(0)}m accuracy)` : ''}
                    </p>
                </div>
            ` : ''}
            
            <div class="flex gap-4">
                ${report.status === 'Submitted' ? `
                    <button onclick="approveReport('${report.id}')" class="btn btn-primary flex-1">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Approve Report
                    </button>
                ` : `
                    <div class="flex-1 flex items-center justify-center gap-2 text-green-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Already Approved</span>
                    </div>
                `}
                <button onclick="this.closest('.modal').remove()" class="btn btn-secondary flex-1">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function approveReport(reportId) {
    const index = state.reports.findIndex(r => r.id === reportId);
    if (index >= 0) {
        state.reports[index].status = 'Approved';
        state.reports[index].updated_at = new Date().toISOString();
        
        showToast('Report Approved', 'The report has been approved and registered in NRL.');
        
        // Close modal and refresh view
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
        
        navigateTo('admin-dashboard');
    }
}

function updateAdminView() {
    const sortBy = document.getElementById('admin-sort').value;
    const statusFilter = document.getElementById('admin-status').value;
    
    let reports = state.reports.filter(r => r.status !== 'Draft');
    
    // Filter by status
    if (statusFilter !== 'all') {
        reports = reports.filter(r => r.status === statusFilter);
    }
    
    // Sort
    reports.sort((a, b) => {
        switch (sortBy) {
            case 'date-newest':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'date-oldest':
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'duplicates-most':
                const dupCountA = findPotentialDuplicates(a, state.reports).length;
                const dupCountB = findPotentialDuplicates(b, state.reports).length;
                return dupCountB - dupCountA;
            default:
                return 0;
        }
    });
    
    const listEl = document.getElementById('reports-list');
    if (listEl) {
        listEl.innerHTML = renderAdminReportsTable(reports);
    }
}

// ============================================================================
// NAVIGATION
// ============================================================================

function navigateTo(view) {
    state.currentView = view;
    render();
    
    // Start GPS tracking when entering pilot report form
    if (view === 'pilot-report') {
        startGPSTracking();
        setTimeout(() => {
            initMap();
            
            // Update GPS display periodically
            setInterval(() => {
                const gpsEl = document.getElementById('gps-coords');
                if (gpsEl && state.currentPosition) {
                    gpsEl.textContent = `${state.currentPosition.lat.toFixed(6)}°N, ${state.currentPosition.lng.toFixed(6)}°E (±${state.currentPosition.accuracy.toFixed(0)}m)`;
                }
            }, 1000);
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
    
    // Initialize Lucide icons if available
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    render();
});
