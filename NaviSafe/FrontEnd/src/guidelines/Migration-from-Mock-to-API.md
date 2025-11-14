# Migration Guide: From Mock Data to Real API

## Overview
This guide shows how to replace mock data with real API calls from your ASP.NET Core backend.

## Current State (Mock Data)
The application currently uses mock authentication and mock data defined in `/lib/mockData.ts`.

## Step 1: Update LoginScreen Component

### Before (Mock):
```typescript
// LoginScreen.tsx - Current implementation
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Mock authentication
  const mockUser = username === 'pilot' ? mockPilot : mockAdmin;
  onLogin(mockUser);
  toast.success(`Welcome, ${mockUser.username}!`);
};
```

### After (Real API):
```typescript
// LoginScreen.tsx - With API integration
import { authApi } from '../lib/api';

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    const { user, token } = await authApi.login(username, password);
    
    // Store token if using JWT
    if (token) {
      localStorage.setItem('auth_token', token);
    }
    
    onLogin(user);
    toast.success(`Welcome, ${user.username}!`);
  } catch (error) {
    toast.error('Login failed. Please check your credentials.');
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};
```

## Step 2: Update PilotDashboard Component

### Before (Mock):
```typescript
// PilotDashboard.tsx - Current implementation
const [reports, setReports] = useState<ObstacleReport[]>(mockReports);

useEffect(() => {
  // Using mock data
  const userReports = mockReports.filter(r => r.reporter_id === user.id);
  setReports(userReports);
}, [user.id]);
```

### After (Real API):
```typescript
// PilotDashboard.tsx - With API integration
import { reportsApi } from '../lib/api';

const [reports, setReports] = useState<ObstacleReport[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await reportsApi.getReports({ reporter_id: user.id });
      setReports(data);
    } catch (error) {
      toast.error('Failed to load reports');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchReports();
}, [user.id]);
```

## Step 3: Update PilotReportForm Component

### Before (Mock):
```typescript
// PilotReportForm.tsx - Current implementation
const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
  e.preventDefault();
  
  setIsSubmitting(true);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create report object
  const report = {
    id: existingReport?.id || `r${Date.now()}`,
    reporter_id: user.id,
    reporter_name: user.username,
    // ... rest of fields
  };
  
  console.log(isDraft ? 'Saving draft:' : 'Submitting report:', report);
  toast.success('Report sent to NRL!');
  setIsSubmitting(false);
  onBack();
};
```

### After (Real API):
```typescript
// PilotReportForm.tsx - With API integration
import { reportsApi } from '../lib/api';

const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
  e.preventDefault();
  
  if (!geometry) {
    toast.error('Please mark the obstacle position on the map');
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    const reportData = {
      obstacle_type: obstacleType,
      geometry_type: geometryType,
      geometry,
      height_meters: heightMeters ? parseFloat(heightMeters) : undefined,
      description,
      comments,
      photo: photoFile || undefined,
      status: isDraft ? 'Draft' as const : 'Submitted' as const,
    };
    
    if (existingReport) {
      // Update existing report
      await reportsApi.updateReport(existingReport.id, reportData);
      toast.success(isDraft ? 'Draft updated!' : 'Report updated!');
    } else {
      // Create new report
      await reportsApi.createReport(reportData);
      toast.success(isDraft ? 'Draft saved!' : 'Report sent to NRL!');
    }
    
    onBack();
  } catch (error) {
    toast.error('Failed to save report');
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};
```

## Step 4: Update AdminDashboard Component

### Before (Mock):
```typescript
// AdminDashboard.tsx - Current implementation
const [reports, setReports] = useState<ObstacleReport[]>(mockReports);

const handleApprove = (reportId: string) => {
  setReports(reports.map(r => 
    r.id === reportId ? { ...r, status: 'Approved' } : r
  ));
  toast.success('Report approved!');
};
```

### After (Real API):
```typescript
// AdminDashboard.tsx - With API integration
import { reportsApi } from '../lib/api';

const [reports, setReports] = useState<ObstacleReport[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await reportsApi.getReports({ status: statusFilter });
      setReports(data);
    } catch (error) {
      toast.error('Failed to load reports');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchReports();
}, [statusFilter]);

const handleApprove = async (reportId: string) => {
  try {
    const updatedReport = await reportsApi.approveReport(reportId);
    setReports(reports.map(r => r.id === reportId ? updatedReport : r));
    toast.success('Report approved and sent to NRL!');
  } catch (error) {
    toast.error('Failed to approve report');
    console.error(error);
  }
};

const handleMerge = async (primaryId: string, duplicateIds: string[]) => {
  try {
    await reportsApi.mergeReports(primaryId, duplicateIds);
    
    // Remove merged reports from list
    setReports(reports.filter(r => !duplicateIds.includes(r.id)));
    toast.success(`Merged ${duplicateIds.length} duplicate reports`);
  } catch (error) {
    toast.error('Failed to merge reports');
    console.error(error);
  }
};
```

## Step 5: Add Loading States

Create a loading component:

```typescript
// components/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
```

Use in components:

```typescript
{isLoading ? (
  <LoadingSpinner />
) : (
  <div>
    {/* Your content */}
  </div>
)}
```

## Step 6: Add Error Boundary

```typescript
// components/ErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Wrap your app:

```typescript
// App.tsx
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* Your app content */}
    </ErrorBoundary>
  );
}
```

## Step 7: Add Authentication Token Handling

Update `/lib/api.ts` to include token in headers:

```typescript
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: 'include',
  });

  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/';
    throw new Error('Unauthorized - please login again');
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return response.json();
}
```

## Step 8: Environment Configuration

Create `.env` file:

```bash
# Development
REACT_APP_API_URL=https://localhost:5001/api

# Production (update when deploying)
# REACT_APP_API_URL=https://api.navisafe.no/api
```

Create `.env.example` for documentation:

```bash
# API Configuration
REACT_APP_API_URL=https://localhost:5001/api
```

## Step 9: Testing Checklist

- [ ] Login with real credentials works
- [ ] Logout clears token and redirects to login
- [ ] Pilot can create new reports
- [ ] Pilot can view their own reports
- [ ] Pilot can edit draft reports
- [ ] Admin can view all submitted reports
- [ ] Admin can approve reports
- [ ] Admin can merge duplicate reports
- [ ] Map displays approved obstacles
- [ ] Photo upload works
- [ ] GPS location is captured
- [ ] Error messages display properly
- [ ] Loading states show correctly
- [ ] Unauthorized access redirects to login

## Step 10: Remove Mock Data (Final Step)

Once everything works with real API:

1. Delete `/lib/mockData.ts`
2. Remove all `import` statements referencing mockData
3. Remove mock authentication logic from LoginScreen
4. Update README to reflect API integration

## Rollback Plan

If integration fails, you can easily rollback:

```bash
git checkout HEAD -- lib/mockData.ts
# Revert component changes
git checkout HEAD -- components/LoginScreen.tsx
git checkout HEAD -- components/PilotDashboard.tsx
# etc.
```

## Support

For issues during migration:
- Check browser console for errors
- Check network tab for API response details
- Verify CORS is configured correctly on backend
- Ensure backend endpoints match `/lib/api.ts`
- Check that database schema matches TypeScript types
