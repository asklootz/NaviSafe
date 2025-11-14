// Mock data for NaviSafe application
import { User, ObstacleReport, Comment } from './types';

export const mockUsers: User[] = [
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

export const mockObstacleReports: ObstacleReport[] = [
  {
    id: 'r1',
    reporter_id: '1',
    reporter_name: 'pilot1',
    organization: 'NLA',
    obstacle_type: 'Tower',
    geometry_type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [8.0182, 58.1599], // Kristiansand area
    },
    height_meters: 45,
    description: 'High tower near Kristiansand Airport',
    comments: 'Observed during landing',
    status: 'Submitted',
    created_at: '2025-10-28T14:30:00Z',
    updated_at: '2025-10-28T14:30:00Z',
    reporter_position: {
      type: 'Point',
      coordinates: [8.0165, 58.1585], // ~200m southwest of obstacle
    },
    reporter_position_accuracy: 12,
  },
  {
    id: 'r6',
    reporter_id: '2',
    reporter_name: 'pilot2',
    organization: 'Luftforsvaret',
    obstacle_type: 'Tower',
    geometry_type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [8.0189, 58.1605], // ~80m from r1 (potential duplicate)
    },
    height_meters: 48,
    description: 'Tall communication tower near airport',
    comments: 'Looks similar to previously reported tower',
    status: 'Submitted',
    created_at: '2025-10-29T11:20:00Z',
    updated_at: '2025-10-29T11:20:00Z',
    reporter_position: {
      type: 'Point',
      coordinates: [8.0175, 58.1595], // ~160m southwest of obstacle
    },
    reporter_position_accuracy: 8,
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
        [10.7522, 59.9139], // Oslo area
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
      coordinates: [10.7611, 59.9170], // Mid-point near the power line
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
      coordinates: [5.7331, 58.9700], // Stavanger area
    },
    height_meters: 80,
    description: 'Wind turbine near Stavanger',
    comments: 'New wind farm',
    status: 'Approved',
    created_at: '2025-10-25T16:45:00Z',
    updated_at: '2025-10-26T11:30:00Z',
    reporter_position: {
      type: 'Point',
      coordinates: [5.7310, 58.9680], // ~250m south of obstacle
    },
    reporter_position_accuracy: 10,
  },
  {
    id: 'r4',
    reporter_id: '2',
    reporter_name: 'pilot2',
    organization: 'Luftforsvaret',
    obstacle_type: 'Building',
    geometry_type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [10.3951, 63.4305], // Trondheim area
    },
    height_meters: 35,
    description: 'High-rise in Trondheim city center',
    comments: 'Not in database',
    status: 'Submitted',
    created_at: '2025-10-24T12:00:00Z',
    updated_at: '2025-10-25T14:20:00Z',
    reporter_position: {
      type: 'Point',
      coordinates: [10.3925, 63.4290], // ~300m southwest of obstacle
    },
    reporter_position_accuracy: 18,
  },
  {
    id: 'r7',
    reporter_id: '1',
    reporter_name: 'pilot1',
    organization: 'NLA',
    obstacle_type: 'Building',
    geometry_type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [10.3956, 63.4310], // ~70m from r4 (potential duplicate)
    },
    height_meters: 38,
    description: 'Tall building in Trondheim center',
    comments: 'Reported during approach to Værnes',
    status: 'Submitted',
    created_at: '2025-10-29T15:45:00Z',
    updated_at: '2025-10-29T15:45:00Z',
    reporter_position: {
      type: 'Point',
      coordinates: [10.3935, 63.4295], // ~270m southwest of obstacle
    },
    reporter_position_accuracy: 9,
  },
  {
    id: 'r8',
    reporter_id: '4',
    reporter_name: 'pilot3',
    organization: 'Politiet',
    obstacle_type: 'Building',
    geometry_type: 'Point',
    geometry: {
      type: 'Point',
      coordinates: [10.3954, 63.4308], // ~50m from r4, ~40m from r7 (potential duplicate)
    },
    height_meters: 33,
    description: 'Office building near city center',
    comments: 'Spotted during low altitude patrol',
    status: 'Submitted',
    created_at: '2025-10-30T09:10:00Z',
    updated_at: '2025-10-30T09:10:00Z',
    reporter_position: {
      type: 'Point',
      coordinates: [10.3940, 63.4298], // ~220m southwest of obstacle
    },
    reporter_position_accuracy: 22,
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
      coordinates: [10.4041, 63.4368], // Trondheim area (different location, no duplicates)
    },
    height_meters: 55,
    description: 'Communication tower',
    comments: 'Need to verify exact height',
    status: 'Draft',
    created_at: '2025-10-29T08:15:00Z',
    updated_at: '2025-10-29T08:15:00Z',
  },
];

export const mockComments: Comment[] = [
  {
    id: 'c1',
    report_id: 'r2',
    user_id: '3',
    user_name: 'admin',
    comment: 'Investigating with power line owner',
    created_at: '2025-10-29T09:00:00Z',
  },
  {
    id: 'c2',
    report_id: 'r3',
    user_id: '3',
    user_name: 'admin',
    comment: 'Approved and registered in NRL',
    created_at: '2025-10-26T11:30:00Z',
  },
  {
    id: 'c3',
    report_id: 'r4',
    user_id: '3',
    user_name: 'admin',
    comment: 'Building is below height threshold for this area',
    created_at: '2025-10-25T14:20:00Z',
  },
];

// Mock login function
export const mockLogin = async (username: string, password: string): Promise<User | null> => {
  // In a real app, this would validate against a backend
  // For demo purposes, accept any password for existing users
  const user = mockUsers.find(u => u.username === username);
  
  if (user && password.length > 0) {
    return user;
  }
  
  return null;
};