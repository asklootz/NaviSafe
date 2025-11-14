import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { PilotDashboard } from './components/PilotDashboard';
import { PilotReportForm } from './components/PilotReportForm';
import { AdminDashboard } from './components/AdminDashboard';
import { User, ObstacleReport } from './lib/types';
import { mockLogin } from './lib/mockData';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';

type AppView = 'login' | 'pilot-dashboard' | 'pilot-report' | 'admin-dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingReport, setEditingReport] = useState<ObstacleReport | undefined>(undefined);

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    const user = await mockLogin(username, password);
    
    if (user) {
      setCurrentUser(user);
      
      // Route based on user role
      if (user.role === 'admin') {
        setCurrentView('admin-dashboard');
      } else {
        // Pilots go directly to the report form
        setCurrentView('pilot-report');
      }
      
      return true;
    }
    
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setEditingReport(undefined);
  };

  const handleCreateReport = () => {
    setEditingReport(undefined);
    setCurrentView('pilot-report');
  };

  const handleEditReport = (report: ObstacleReport) => {
    setEditingReport(report);
    setCurrentView('pilot-report');
  };

  const handleBackFromReport = () => {
    setEditingReport(undefined);
    setCurrentView('pilot-dashboard');
  };

  const handleViewMyReports = () => {
    setEditingReport(undefined);
    setCurrentView('pilot-dashboard');
  };

  const handleBackFromAdmin = () => {
    handleLogout();
  };

  return (
    <ThemeProvider>
      <>
        {currentView === 'login' && (
          <LoginScreen onLogin={handleLogin} />
        )}

        {currentView === 'pilot-dashboard' && currentUser && (
          <PilotDashboard
            user={currentUser}
            onBack={handleLogout}
            onCreateReport={handleCreateReport}
            onEditReport={handleEditReport}
          />
        )}

        {currentView === 'pilot-report' && currentUser && (
          <PilotReportForm
            user={currentUser}
            onBack={handleBackFromReport}
            onViewMyReports={handleViewMyReports}
            existingReport={editingReport}
          />
        )}

        {currentView === 'admin-dashboard' && currentUser && (
          <AdminDashboard
            user={currentUser}
            onBack={handleBackFromAdmin}
          />
        )}

        <Toaster />
      </>
    </ThemeProvider>
  );
}