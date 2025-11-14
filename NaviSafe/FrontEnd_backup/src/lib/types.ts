// Type definitions for NaviSafe application

export type UserRole = 'pilot' | 'admin';

export type OrganizationType = 'NLA' | 'Luftforsvaret' | 'Politiet' | 'Kartverket';

export type ObstacleType = 
  | 'Tower'
  | 'Power Line'
  | 'Wind Turbine'
  | 'Building'
  | 'Other';

export type ReportStatus = 
  | 'Draft'
  | 'Submitted'
  | 'Approved';

export type GeometryType = 'Point' | 'LineString';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  organization: OrganizationType;
  created_at: string;
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONLineString {
  type: 'LineString';
  coordinates: [number, number][]; // array of [longitude, latitude]
}

export type GeoJSONGeometry = GeoJSONPoint | GeoJSONLineString;

export interface ObstacleReport {
  id: string;
  reporter_id: string;
  reporter_name: string;
  organization: OrganizationType;
  obstacle_type: ObstacleType;
  geometry_type: GeometryType;
  geometry: GeoJSONGeometry;
  height_meters?: number;
  description: string;
  comments?: string;
  photo_url?: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  reporter_position?: GeoJSONPoint; // GPS position of reporter at time of report
  reporter_position_accuracy?: number; // GPS accuracy in meters
}

export interface Comment {
  id: string;
  report_id: string;
  user_id: string;
  user_name: string;
  comment: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}