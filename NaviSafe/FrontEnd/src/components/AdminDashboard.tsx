import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MapComponent } from './MapComponent';
import { User, ObstacleReport, ReportStatus } from '../lib/types';
import { mockObstacleReports, mockUsers } from '../lib/mockData';
import { Eye, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { SidebarProvider, SidebarInset, SidebarTrigger } from './ui/sidebar';
import { AdminAppSidebar } from './AdminAppSidebar';

// Calculate distance between two geographical points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

// Find potential duplicate reports
function findPotentialDuplicates(
  report: ObstacleReport,
  allReports: ObstacleReport[],
  radiusMeters: number = 100
): Array<ObstacleReport & { distance: number }> {
  const duplicates: Array<ObstacleReport & { distance: number }> = [];

  // Only check Point geometries for now
  if (report.geometry.type !== 'Point') return duplicates;

  const [lon, lat] = report.geometry.coordinates;

  for (const otherReport of allReports) {
    // Skip self and drafts
    if (otherReport.id === report.id || otherReport.status === 'Draft') continue;

    if (otherReport.geometry.type === 'Point') {
      const [otherLon, otherLat] = otherReport.geometry.coordinates;
      const distance = calculateDistance(lat, lon, otherLat, otherLon);

      // Check if within radius and similar type
      if (distance <= radiusMeters && otherReport.obstacle_type === report.obstacle_type) {
        duplicates.push({ ...otherReport, distance });
      }
    }
  }

  return duplicates.sort((a, b) => a.distance - b.distance);
}

interface AdminDashboardProps {
  user: User;
  onBack: () => void;
}

export function AdminDashboard({ user, onBack }: AdminDashboardProps) {
  const [reports, setReports] = useState<ObstacleReport[]>(
    mockObstacleReports.filter(r => r.status !== 'Draft') // Exclude drafts from admin view
  );
  const [selectedReport, setSelectedReport] = useState<ObstacleReport | null>(null);
  const [sortBy, setSortBy] = useState<string>('date-newest');
  const [statusFilter, setStatusFilter] = useState<string>('Submitted');
  const [adminComment, setAdminComment] = useState('');
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [duplicatesToMerge, setDuplicatesToMerge] = useState<Array<ObstacleReport & { distance: number }>>([]);
  const [activeView, setActiveView] = useState<'list' | 'map'>('list');

  // Filter reports by status
  const filteredReports = reports.filter(report => {
    if (statusFilter === 'all') return true;
    return report.status === statusFilter;
  });

  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    switch (sortBy) {
      case 'date-newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'date-oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'duplicates-most':
        const dupCountA = findPotentialDuplicates(a, reports).length;
        const dupCountB = findPotentialDuplicates(b, reports).length;
        return dupCountB - dupCountA;
      default:
        return 0;
    }
  });

  const handleAddComment = () => {
    if (!adminComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    toast.success('Comment added', {
      description: 'Your comment has been saved to the report.',
    });

    setAdminComment('');
    setSelectedReport(null);
  };

  const handleApproveReport = (reportId: string) => {
    // Check for duplicates first
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const duplicates = findPotentialDuplicates(report, reports);

    // If duplicates exist and report is being approved for the first time, show merge dialog
    if (duplicates.length > 0 && report.status === 'Submitted') {
      setDuplicatesToMerge(duplicates);
      setShowMergeDialog(true);
      return;
    }

    // Otherwise, approve directly
    proceedWithApproval(reportId);
  };

  const proceedWithApproval = (reportId: string) => {
    setReports(reports.map(report => {
      if (report.id === reportId) {
        return {
          ...report,
          status: 'Approved' as ReportStatus,
          updated_at: new Date().toISOString(),
        };
      }
      return report;
    }));

    // Update selectedReport if it's the one being approved
    if (selectedReport?.id === reportId) {
      setSelectedReport({
        ...selectedReport,
        status: 'Approved' as ReportStatus,
        updated_at: new Date().toISOString(),
      });
    }

    setShowMergeDialog(false);

    toast.success('Report Approved', {
      description: 'The report has been approved and registered in NRL.',
    });
  };

  const handleMergeAndApprove = () => {
    if (!selectedReport) return;

    // Approve the current report
    proceedWithApproval(selectedReport.id);

    // Remove duplicate reports from the list
    const duplicateIds = duplicatesToMerge.map(d => d.id);
    setReports(reports.filter(r => !duplicateIds.includes(r.id)));

    toast.success('Reports Merged', {
      description: `Merged ${duplicatesToMerge.length} duplicate report(s) into a single obstacle.`,
    });
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <AdminAppSidebar 
        user={user} 
        onLogout={onBack} 
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <SidebarInset>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
          <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1>Submitted Reports to NRL</h1>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reports Management</CardTitle>
                <CardDescription>
                  View and manage reports from pilots and flight crew
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="space-y-2 flex-1 md:w-48">
                      <Label htmlFor="sort-by" className="sr-only">
                        Sort by
                      </Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger id="sort-by">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-newest">Newest first</SelectItem>
                          <SelectItem value="date-oldest">Oldest first</SelectItem>
                          <SelectItem value="duplicates-most">Most duplicates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 flex-1 md:w-48">
                      <Label htmlFor="status-filter" className="sr-only">
                        Status
                      </Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger id="status-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="Submitted">Submitted</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {activeView === 'list' ? (
                  <ReportsTable
                    reports={sortedReports}
                    allReports={reports}
                    onSelectReport={setSelectedReport}
                  />
                ) : (
                  <MapComponent
                    height="600px"
                    obstacles={filteredReports}
                    zoom={6}
                    center={[60.472, 8.4689]} // Center of Norway
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Report Detail Dialog */}
        {selectedReport && (() => {
          // Always get the latest version of the report from state
          const currentReport = reports.find(r => r.id === selectedReport.id);
          if (!currentReport) return null;
          
          const duplicates = findPotentialDuplicates(currentReport, reports);
          
          return (
            <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Report Details #{currentReport.id}</DialogTitle>
                  <DialogDescription>
                    Reported by {currentReport.reporter_name} ({currentReport.organization}) on{' '}
                    {new Date(currentReport.created_at).toLocaleDateString('en-US')}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Duplicate Warning */}
                  {duplicates.length > 0 && (
                    <Alert className="bg-yellow-50 border-yellow-300">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Potential Duplicate Reports</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        Found {duplicates.length} similar report{duplicates.length > 1 ? 's' : ''} within 100m with the same obstacle type.
                        <div className="mt-3 space-y-2">
                          {duplicates.map((dup) => (
                            <div key={dup.id} className="p-3 bg-card rounded border border-yellow-200 dark:border-yellow-800">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div><strong>Report #{dup.id}</strong> - {dup.obstacle_type}</div>
                                  <div className="text-sm">Distance: {Math.round(dup.distance)}m</div>
                                  <div className="text-sm">Height: {dup.height_meters}m</div>
                                  <div className="text-sm">Reporter: {dup.reporter_name} ({dup.organization})</div>
                                  <div className="text-sm">Status: {dup.status}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <div className="inline-block px-3 py-1 rounded-full text-sm mt-2 bg-green-100 text-green-800">
                        {currentReport.status}
                      </div>
                    </div>
                    <div>
                      <Label>Obstacle Type</Label>
                      <p className="mt-2">{currentReport.obstacle_type}</p>
                    </div>
                    <div>
                      <Label>Height</Label>
                      <p className="mt-2">{currentReport.height_meters ? `${currentReport.height_meters} meters` : 'Not specified'}</p>
                    </div>
                    <div>
                      <Label>Geometry</Label>
                      <p className="mt-2">{currentReport.geometry_type === 'Point' ? 'Point' : 'Line'}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <p className="mt-2">{currentReport.description}</p>
                  </div>

                  {currentReport.comments && (
                    <div>
                      <Label>Reporter Comments</Label>
                      <p className="mt-2">{currentReport.comments}</p>
                    </div>
                  )}

                  {currentReport.reporter_position && (
                    <div>
                      <Label>Reporter GPS Position</Label>
                      <p className="mt-2 text-sm text-gray-800 dark:text-gray-200 font-mono">
                        {currentReport.reporter_position.coordinates[1].toFixed(6)}°N, {currentReport.reporter_position.coordinates[0].toFixed(6)}°E
                        {currentReport.reporter_position_accuracy && (
                          <span className="ml-2 text-gray-600 dark:text-gray-400">(±{currentReport.reporter_position_accuracy.toFixed(0)}m accuracy)</span>
                        )}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label>Obstacle Position on Map</Label>
                    <div className="mt-2">
                      <MapComponent
                        height="300px"
                        existingGeometry={currentReport.geometry}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="admin-comment">Add Note</Label>
                    <Textarea
                      id="admin-comment"
                      placeholder="Write a note about this report..."
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleAddComment}
                      variant="outline"
                      className="flex-1"
                    >
                      Save Note
                    </Button>
                    {currentReport.status === 'Submitted' && (
                      <Button
                        onClick={() => handleApproveReport(currentReport.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Report
                      </Button>
                    )}
                    {currentReport.status === 'Approved' && (
                      <div className="flex-1 flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span>Already Approved</span>
                      </div>
                    )}
                    <Button
                      onClick={() => setSelectedReport(null)}
                      variant="outline"
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })()}

        {/* Merge Dialog */}
        {showMergeDialog && (
          <AlertDialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Merge Reports</AlertDialogTitle>
                <AlertDialogDescription>
                  You have {duplicatesToMerge.length} potential duplicate report(s) for this obstacle. Do you want to merge them into a single report?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleMergeAndApprove}
                >
                  Merge and Approve
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

interface ReportsTableProps {
  reports: ObstacleReport[];
  allReports: ObstacleReport[];
  onSelectReport: (report: ObstacleReport) => void;
}

function ReportsTable({ reports, allReports, onSelectReport }: ReportsTableProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No reports found
      </div>
    );
  }

  const getStatusBadge = (status: ReportStatus) => {
    if (status === 'Approved') {
      return <Badge className="bg-green-500 dark:bg-green-700 text-white">Approved</Badge>;
    } else if (status === 'Submitted') {
      return <Badge className="bg-blue-500 dark:bg-blue-700 text-white">Submitted</Badge>;
    }
    return <Badge className="bg-gray-500 dark:bg-gray-700 text-white">{status}</Badge>;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Reporter</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duplicates</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const duplicates = findPotentialDuplicates(report, allReports);
            return (
              <TableRow key={report.id}>
                <TableCell>{report.id}</TableCell>
                <TableCell>{report.obstacle_type}</TableCell>
                <TableCell>{report.organization}</TableCell>
                <TableCell>{report.reporter_name}</TableCell>
                <TableCell>{getStatusBadge(report.status)}</TableCell>
                <TableCell>
                  {duplicates.length > 0 ? (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {duplicates.length}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>{new Date(report.created_at).toLocaleDateString('en-US')}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => onSelectReport(report)}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}