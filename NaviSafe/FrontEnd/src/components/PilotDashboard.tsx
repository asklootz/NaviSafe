import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User, ObstacleReport, ReportStatus } from '../lib/types';
import { mockObstacleReports } from '../lib/mockData';
import { Edit, Eye, Plus, LogOut, Moon, Sun } from 'lucide-react';
import naviSafeLogo from '../assets/NaviSafe_logo.png';
import { useTheme } from './ThemeProvider';

interface PilotDashboardProps {
  user: User;
  onBack: () => void;
  onCreateReport: () => void;
  onEditReport: (report: ObstacleReport) => void;
}

export function PilotDashboard({ user, onBack, onCreateReport, onEditReport }: PilotDashboardProps) {
  const [reports] = useState<ObstacleReport[]>(
    mockObstacleReports.filter(r => r.reporter_id === user.id)
  );
  const { theme, toggleTheme } = useTheme();

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
      case 'Submitted':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const draftReports = reports.filter(r => r.status === 'Draft');
  const submittedReports = reports.filter(r => r.status !== 'Draft');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <img src={naviSafeLogo} alt="NaviSafe Logo" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="text-lg">NaviSafe</h1>
                <p className="text-xs text-muted-foreground">Pilot Dashboard</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button onClick={onCreateReport} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Report
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button
                onClick={onBack}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600 dark:bg-red-700 dark:hover:bg-red-800 dark:border-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reports Overview</CardTitle>
                <CardDescription>
                  View and manage your obstacle reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">
                      All ({reports.length})
                    </TabsTrigger>
                    <TabsTrigger value="drafts">
                      Drafts ({draftReports.length})
                    </TabsTrigger>
                    <TabsTrigger value="submitted">
                      Submitted ({submittedReports.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-6">
                    <ReportsTable
                      reports={reports}
                      onEditReport={onEditReport}
                      getStatusColor={getStatusColor}
                    />
                  </TabsContent>

                  <TabsContent value="drafts" className="mt-6">
                    <ReportsTable
                      reports={draftReports}
                      onEditReport={onEditReport}
                      getStatusColor={getStatusColor}
                    />
                  </TabsContent>

                  <TabsContent value="submitted" className="mt-6">
                    <ReportsTable
                      reports={submittedReports}
                      onEditReport={onEditReport}
                      getStatusColor={getStatusColor}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
  );
}

interface ReportsTableProps {
  reports: ObstacleReport[];
  onEditReport: (report: ObstacleReport) => void;
  getStatusColor: (status: ReportStatus) => string;
}

function ReportsTable({ reports, onEditReport, getStatusColor }: ReportsTableProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No reports found
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Obstacle Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>{report.id}</TableCell>
              <TableCell>{report.obstacle_type}</TableCell>
              <TableCell className="max-w-xs truncate">{report.description}</TableCell>
              <TableCell>{new Date(report.created_at).toLocaleDateString('en-US')}</TableCell>
              <TableCell>
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
              </TableCell>
              <TableCell>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onEditReport(report)}
                >
                  {report.status === 'Draft' ? (
                    <>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}