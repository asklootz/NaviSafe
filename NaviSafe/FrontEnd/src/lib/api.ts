import { ObstacleReport, User, ObstacleType, GeometryType, GeoJSONGeometry } from './types';

// API Base URL - Set this to your ASP.NET Core backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:5001/api';

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Authentication API
export const authApi = {
  login: async (username: string, password: string): Promise<{ user: User; token?: string }> => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout: async (): Promise<void> => {
    return apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async (): Promise<User> => {
    return apiCall('/auth/me');
  },
};

// Reports API
export const reportsApi = {
  // Get all reports (with optional filters)
  getReports: async (filters?: {
    status?: 'Draft' | 'Submitted' | 'Approved';
    reporter_id?: string;
    obstacle_type?: ObstacleType;
  }): Promise<ObstacleReport[]> => {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.reporter_id) queryParams.append('reporter_id', filters.reporter_id);
    if (filters?.obstacle_type) queryParams.append('obstacle_type', filters.obstacle_type);

    const query = queryParams.toString();
    return apiCall(`/reports${query ? `?${query}` : ''}`);
  },

  // Get single report by ID
  getReport: async (id: string): Promise<ObstacleReport> => {
    return apiCall(`/reports/${id}`);
  },

  // Create new report
  createReport: async (report: {
    obstacle_type: ObstacleType;
    geometry_type: GeometryType;
    geometry: GeoJSONGeometry;
    height_meters?: number;
    description?: string;
    comments?: string;
    photo?: File;
    status: 'Draft' | 'Submitted';
  }): Promise<ObstacleReport> => {
    // If there's a photo, use FormData instead of JSON
    if (report.photo) {
      const formData = new FormData();
      formData.append('obstacle_type', report.obstacle_type);
      formData.append('geometry_type', report.geometry_type);
      formData.append('geometry', JSON.stringify(report.geometry));
      if (report.height_meters) formData.append('height_meters', report.height_meters.toString());
      if (report.description) formData.append('description', report.description);
      if (report.comments) formData.append('comments', report.comments);
      formData.append('status', report.status);
      formData.append('photo', report.photo);

      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
      }

      return response.json();
    }

    return apiCall('/reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },

  // Update existing report
  updateReport: async (
    id: string,
    updates: Partial<{
      obstacle_type: ObstacleType;
      geometry_type: GeometryType;
      geometry: GeoJSONGeometry;
      height_meters: number;
      description: string;
      comments: string;
      status: 'Draft' | 'Submitted' | 'Approved';
      photo: File;
    }>
  ): Promise<ObstacleReport> => {
    // If there's a photo, use FormData
    if (updates.photo) {
      const formData = new FormData();
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'geometry') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'photo') {
          formData.append(key, value as File);
        } else {
          formData.append(key, String(value));
        }
      });

      const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
      }

      return response.json();
    }

    return apiCall(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete report
  deleteReport: async (id: string): Promise<void> => {
    return apiCall(`/reports/${id}`, {
      method: 'DELETE',
    });
  },

  // Approve report (Admin only)
  approveReport: async (id: string): Promise<ObstacleReport> => {
    return apiCall(`/reports/${id}/approve`, {
      method: 'POST',
    });
  },

  // Merge duplicate reports (Admin only)
  mergeReports: async (primaryId: string, duplicateIds: string[]): Promise<ObstacleReport> => {
    return apiCall(`/reports/${primaryId}/merge`, {
      method: 'POST',
      body: JSON.stringify({ duplicate_ids: duplicateIds }),
    });
  },

  // Get GeoJSON for approved obstacles (for map display)
  getGeoJSON: async (): Promise<{
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      geometry: GeoJSONGeometry;
      properties: ObstacleReport;
    }>;
  }> => {
    return apiCall('/reports/geojson');
  },
};

// Duplicate Detection API
export const duplicatesApi = {
  // Find potential duplicates for a geometry
  findDuplicates: async (geometry: GeoJSONGeometry): Promise<ObstacleReport[]> => {
    return apiCall('/duplicates/find', {
      method: 'POST',
      body: JSON.stringify({ geometry }),
    });
  },
};
