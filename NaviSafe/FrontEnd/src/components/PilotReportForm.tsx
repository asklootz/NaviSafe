import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { MapComponent } from './MapComponent';
import { User, ObstacleType, GeometryType, GeoJSONGeometry, ObstacleReport } from '../lib/types';
import { ArrowLeft, Camera, Send, Save, Moon, Sun, Navigation, List, Radio, Zap, Wind, Building2, HelpCircle, MapPin, Minus, X, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useTheme } from './ThemeProvider';
import naviSafeLogo from '../assets/NaviSafe_logo.png';
import { Alert, AlertDescription } from './ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

interface PilotReportFormProps {
  user: User;
  onBack: () => void;
  onViewMyReports: () => void;
  existingReport?: ObstacleReport;
}

export function PilotReportForm({ user, onBack, onViewMyReports, existingReport }: PilotReportFormProps) {
  const [obstacleType, setObstacleType] = useState<ObstacleType>(existingReport?.obstacle_type || 'Tower');
  const [geometryType, setGeometryType] = useState<GeometryType>(existingReport?.geometry_type || 'Point');
  const [geometry, setGeometry] = useState<GeoJSONGeometry | null>(existingReport?.geometry || null);
  // Convert meters to feet for display (1 meter = 3.28084 feet)
  const [heightFeet, setHeightFeet] = useState(
    existingReport?.height_meters ? Math.round(existingReport.height_meters * 3.28084).toString() : ''
  );
  const [description, setDescription] = useState(existingReport?.description || '');
  const [comments, setComments] = useState(existingReport?.comments || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // GPS Live Position State
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Autocomplete state
  const [obstacleTypeInput, setObstacleTypeInput] = useState(existingReport?.obstacle_type || '');
  const [isObstacleTypeOpen, setIsObstacleTypeOpen] = useState(false);

  // Manual coordinate inputs
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const isViewOnly = existingReport && existingReport.status !== 'Draft';

  // Predefined obstacle types with icons
  const obstacleTypes: ObstacleType[] = ['Tower', 'Power Line', 'Wind Turbine', 'Building', 'Other'];

  // Update manual coordinates when geometry changes
  useEffect(() => {
    if (geometry && geometry.type === 'Point') {
      setManualLng(geometry.coordinates[0].toFixed(6));
      setManualLat(geometry.coordinates[1].toFixed(6));
    } else {
      setManualLat('');
      setManualLng('');
    }
  }, [geometry]);

  // GPS Live Position Effect
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS not available on this device');
      
      // Mock GPS position for development/desktop
      setCurrentPosition({
        lat: 58.1467, // Kristiansand, Norway
        lng: 7.9956,
        accuracy: 50,
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGpsError(null);
      },
      (error) => {
        // Silently use fallback position when GPS is unavailable
        setCurrentPosition({
          lat: 58.1467, // Kristiansand, Norway
          lng: 7.9956,
          accuracy: 50,
        });
        setGpsError(null);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    
    if (!geometry) {
      toast.error('Please mark the obstacle position on the map');
      return;
    }

    if (!isDraft && !heightFeet.trim()) {
      toast.error('Please provide obstacle height');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Convert feet to meters for storage (1 foot = 0.3048 meters)
    const heightMeters = heightFeet ? parseFloat(heightFeet) * 0.3048 : undefined;

    // Create report object with reporter GPS position if available
    const report = {
      id: existingReport?.id || `r${Date.now()}`,
      reporter_id: user.id,
      reporter_name: user.username,
      organization: user.organization,
      obstacle_type: obstacleType,
      geometry_type: geometryType,
      geometry,
      height_meters: heightMeters,
      description,
      comments,
      photo_url: photoFile ? URL.createObjectURL(photoFile) : existingReport?.photo_url,
      status: isDraft ? 'Draft' : 'Submitted',
      created_at: existingReport?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reporter_position: currentPosition ? {
        type: 'Point' as const,
        coordinates: [currentPosition.lng, currentPosition.lat]
      } : undefined,
      reporter_position_accuracy: currentPosition?.accuracy,
    };

    console.log(isDraft ? 'Saving draft:' : 'Submitting report:', report);
    
    if (isDraft) {
      toast.success('Draft saved!', {
        description: 'Your report has been saved as a draft.',
      });
    } else {
      toast.success('Report sent to NRL!', {
        description: 'Your report has been submitted to Kartverket.',
      });
    }

    setIsSubmitting(false);

    // Go back to dashboard
    onBack();
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      toast.success('Photo uploaded');
    }
  };

  const getObstacleIcon = (type: ObstacleType) => {
    switch (type) {
      case 'Tower':
        return <Radio className="w-6 h-6" />;
      case 'Power Line':
        return <Zap className="w-6 h-6" />;
      case 'Wind Turbine':
        return <Wind className="w-6 h-6" />;
      case 'Building':
        return <Building2 className="w-6 h-6" />;
      case 'Other':
        return <HelpCircle className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={naviSafeLogo} alt="NaviSafe Logo" className="h-12 w-12 object-contain" />
            <div className="text-sm">
              <div>NaviSafe</div>
              <div className="text-gray-600 dark:text-gray-400">{existingReport ? 'Edit Report' : 'New Report'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onViewMyReports} size="lg" className="h-14 hidden md:flex">
              <List className="w-5 h-5 mr-2" />
              My Reports
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="h-14 w-14"
            >
              {theme === 'light' ? (
                <Moon className="h-5 h-5" />
              ) : (
                <Sun className="h-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Main Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Report Aviation Obstacle</CardTitle>
            <CardDescription>
              Select obstacle type and mark position on map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Obstacle Type - Autocomplete */}
              <div className="space-y-3">
                <Label className="text-lg">Obstacle Type *</Label>
                <div className="relative">
                  <Input
                    placeholder="Type to search or enter custom type..."
                    value={obstacleTypeInput}
                    onChange={(e) => {
                      setObstacleTypeInput(e.target.value);
                      setObstacleType(e.target.value as ObstacleType);
                      setIsObstacleTypeOpen(true);
                    }}
                    onFocus={() => setIsObstacleTypeOpen(true)}
                    onBlur={() => {
                      // Delay closing to allow click on suggestions
                      setTimeout(() => setIsObstacleTypeOpen(false), 200);
                    }}
                    className="h-14 text-lg pr-10"
                    required={!isViewOnly}
                    disabled={isViewOnly}
                  />
                  {obstacleTypeInput && obstacleTypes.includes(obstacleTypeInput as ObstacleType) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {getObstacleIcon(obstacleTypeInput as ObstacleType)}
                    </div>
                  )}
                  
                  {/* Suggestions Dropdown */}
                  {isObstacleTypeOpen && obstacleTypeInput && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-auto">
                      {obstacleTypes
                        .filter(type => 
                          type.toLowerCase().includes(obstacleTypeInput.toLowerCase())
                        )
                        .map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setObstacleTypeInput(type);
                              setObstacleType(type);
                              setIsObstacleTypeOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent hover:text-accent-foreground cursor-pointer text-left transition-colors"
                          >
                            {getObstacleIcon(type)}
                            <span>{type}</span>
                            {obstacleTypeInput === type && (
                              <Check className="ml-auto w-4 h-4" />
                            )}
                          </button>
                        ))}
                      {obstacleTypes.filter(type => 
                        type.toLowerCase().includes(obstacleTypeInput.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                          No matching types found. Press Enter to use custom type.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {obstacleTypeInput && !obstacleTypes.includes(obstacleTypeInput as ObstacleType) && (
                  <p className="text-sm text-muted-foreground">
                    Custom obstacle type: <span className="font-medium">{obstacleTypeInput}</span>
                  </p>
                )}
              </div>

              {/* Height Input - Larger */}
              <div className="space-y-3">
                <Label htmlFor="height" className="text-lg">Height (feet) *</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g. 150"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value)}
                  required={!isViewOnly}
                  className="h-16 text-lg"
                />
                {heightFeet && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ≈ {Math.round(parseFloat(heightFeet) * 0.3048)} meters
                  </p>
                )}
              </div>

              {/* Map with Location Type Overlay */}
              <div className="space-y-3">
                <Label className="text-lg">Mark Position on Map *</Label>
                <div className="relative border-4 border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
                  <MapComponent
                    height="450px"
                    drawingMode={true}
                    geometryType={geometryType}
                    onGeometrySelect={(geom) => setGeometry(geom)}
                    userPosition={currentPosition ? [currentPosition.lat, currentPosition.lng] : undefined}
                    selectedGeometry={geometry}
                  />
                  
                  {/* Location Type Buttons - Overlay on Map (Bottom Left) */}
                  <div className="absolute left-3 bottom-3 z-[1000] flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setGeometryType('Point')}
                      className={`
                        flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all shadow-lg
                        ${geometryType === 'Point' 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                        }
                      `}
                      title="Single Point"
                    >
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm">Point</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeometryType('LineString')}
                      className={`
                        flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all shadow-lg
                        ${geometryType === 'LineString' 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                        }
                      `}
                      title="Line/Cable"
                    >
                      <Minus className="w-5 h-5" />
                      <span className="text-sm">Line</span>
                    </button>
                    
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setGeometry(null);
                        toast.info('Drawing cleared', {
                          description: 'Click on map to start drawing again'
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all shadow-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                      title="Clear drawing"
                    >
                      <X className="w-5 h-5" />
                      <span className="text-sm">Clear</span>
                    </button>
                  </div>
                </div>
                
                {/* GPS Position Alert and Use GPS Button */}
                <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <Navigation className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-blue-900 dark:text-blue-100">Live GPS: </span>
                          {currentPosition ? (
                            <span className="text-blue-800 dark:text-blue-200 font-mono">
                              {currentPosition.lat.toFixed(6)}°N, {currentPosition.lng.toFixed(6)}°E
                              <span className="text-blue-600 dark:text-blue-300 text-xs ml-2">
                                (±{currentPosition.accuracy.toFixed(0)}m)
                              </span>
                            </span>
                          ) : gpsError ? (
                            <span className="text-red-600 dark:text-red-400">{gpsError}</span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Acquiring GPS signal...</span>
                          )}
                        </div>
                        {currentPosition && (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                            Active
                          </div>
                        )}
                      </div>
                      
                      {currentPosition && geometryType === 'Point' && (
                        <Button
                          type="button"
                          onClick={() => {
                            const gpsGeometry: GeoJSONGeometry = {
                              type: 'Point',
                              coordinates: [currentPosition.lng, currentPosition.lat]
                            };
                            setGeometry(gpsGeometry);
                            toast.success('GPS position used!', {
                              description: 'Obstacle marked at your current location'
                            });
                          }}
                          variant="outline"
                          size="lg"
                          className="w-full h-16 bg-blue-600 text-white hover:bg-blue-700 border-blue-600 text-lg"
                        >
                          <Navigation className="w-6 h-6 mr-3" />
                          Use My GPS Position
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {geometry && (
                  <div className="text-sm text-green-600 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Position marked on map
                  </div>
                )}

                {/* Manual Coordinate Input - Only for Point geometry */}
                {geometryType === 'Point' && (
                  <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Label className="text-base">Or Enter Coordinates Manually</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="latitude" className="text-sm">Latitude (Y) *</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="0.000001"
                          placeholder="e.g. 58.146700"
                          value={manualLat}
                          onChange={(e) => {
                            setManualLat(e.target.value);
                            const lat = parseFloat(e.target.value);
                            const lng = parseFloat(manualLng);
                            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90) {
                              setGeometry({
                                type: 'Point',
                                coordinates: [lng, lat]
                              });
                            }
                          }}
                          className="h-12"
                          disabled={isViewOnly}
                        />
                        <p className="text-xs text-muted-foreground">Range: -90 to 90</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude" className="text-sm">Longitude (X) *</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="0.000001"
                          placeholder="e.g. 7.995600"
                          value={manualLng}
                          onChange={(e) => {
                            setManualLng(e.target.value);
                            const lat = parseFloat(manualLat);
                            const lng = parseFloat(e.target.value);
                            if (!isNaN(lat) && !isNaN(lng) && lng >= -180 && lng <= 180) {
                              setGeometry({
                                type: 'Point',
                                coordinates: [lng, lat]
                              });
                            }
                          }}
                          className="h-12"
                          disabled={isViewOnly}
                        />
                        <p className="text-xs text-muted-foreground">Range: -180 to 180</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Upload - Large Button */}
              <div className="space-y-3">
                <Label className="text-lg">Photo (optional)</Label>
                <div className="flex flex-col gap-3">
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg"
                    onClick={() => document.getElementById('photo')?.click()}
                    className="h-16 w-full"
                  >
                    <Camera className="w-6 h-6 mr-3" />
                    {photoFile ? `✓ ${photoFile.name}` : 'Take or Upload Photo'}
                  </Button>
                </div>
              </div>

              {/* Description - Larger Textarea */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-lg">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the obstacle..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="text-lg"
                />
              </div>

              {/* Action Buttons - Extra Large */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isSubmitting}
                  className="h-20 text-lg"
                >
                  <Send className="w-6 h-6 mr-3" />
                  {isSubmitting ? 'Sending...' : 'Send Report to NRL'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  size="lg" 
                  disabled={isSubmitting} 
                  onClick={(e) => handleSubmit(e, true)}
                  className="h-20 text-lg"
                >
                  <Save className="w-6 h-6 mr-3" />
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
