import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { GeoJSONGeometry, GeometryType, ObstacleReport } from '../lib/types';

interface MapComponentProps {
  height?: string;
  center?: [number, number];
  zoom?: number;
  onGeometrySelect?: (geometry: GeoJSONGeometry, geometryType: GeometryType) => void;
  drawingMode?: boolean;
  geometryType?: GeometryType;
  existingGeometry?: GeoJSONGeometry;
  obstacles?: ObstacleReport[];
  userPosition?: [number, number]; // GPS position [lat, lng]
  selectedGeometry?: GeoJSONGeometry | null; // Externally selected geometry
}

export function MapComponent({
  height = '400px',
  center = [59.9139, 10.7522], // Oslo default
  zoom = 13,
  onGeometrySelect,
  drawingMode = false,
  geometryType = 'Point',
  existingGeometry,
  obstacles,
  userPosition,
  selectedGeometry,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawLayerRef = useRef<L.LayerGroup | null>(null);
  const obstaclesLayerRef = useRef<L.LayerGroup | null>(null);
  const userPositionLayerRef = useRef<L.LayerGroup | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [linePoints, setLinePoints] = useState<L.LatLng[]>([]);

  useEffect(() => {
    // Inject Leaflet CSS
    if (typeof document !== 'undefined') {
      const leafletCSS = document.getElementById('leaflet-css');
      if (!leafletCSS) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }
      
      // Inject Leaflet Locate CSS
      const locateCSS = document.getElementById('leaflet-locate-css');
      if (!locateCSS) {
        const link = document.createElement('link');
        link.id = 'leaflet-locate-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/leaflet.locatecontrol@0.79.0/dist/L.Control.Locate.min.css';
        document.head.appendChild(link);
      }
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create custom icon using data URL to avoid image loading issues
    const markerIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEuNCAwLjIgMi43IDAuNyAzLjlsMTEuOCAyNC42IDExLjgtMjQuNmMwLjQtMS4yIDAuNy0yLjYgMC43LTMuOUMyNSA1LjYgMTkuNCAwIDEyLjUgMHptMCAxN2MtMi41IDAtNC41LTItNC41LTQuNXMyLTQuNSA0LjUtNC41IDQuNSAyIDQuNSA0LjUtMiA0LjUtNC41IDQuNXoiIGZpbGw9IiMzMzg4ZmYiLz48L3N2Zz4=',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZWxsaXBzZSBjeD0iMTMiIGN5PSI0MCIgcng9IjEzIiByeT0iNCIgZmlsbD0iIzAwMCIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+',
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    });

    // Initialize map
    const map = L.map(mapRef.current).setView(userPosition || center, zoom);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create layer for drawing
    const drawLayer = L.layerGroup().addTo(map);
    drawLayerRef.current = drawLayer;

    // Add locate control button
    const locateControl = L.control({ position: 'topright' });
    locateControl.onAdd = function () {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.innerHTML = '<a href="#" title="Min posisjon" style="background: white; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; text-decoration: none; color: #333; font-size: 20px;">📍</a>';
      div.onclick = (e) => {
        e.preventDefault();
        map.locate({ setView: true, maxZoom: 16 });
      };
      return div;
    };
    locateControl.addTo(map);

    map.on('locationfound', (e) => {
      const radius = e.accuracy / 2;
      L.marker(e.latlng, { icon: markerIcon }).addTo(map).bindPopup(`Du er innenfor ${radius.toFixed(0)} meter fra dette punktet`).openPopup();
      L.circle(e.latlng, radius).addTo(map);
    });

    // Display existing geometry if provided
    if (existingGeometry) {
      if (existingGeometry.type === 'Point') {
        const [lng, lat] = existingGeometry.coordinates;
        L.marker([lat, lng], { icon: markerIcon }).addTo(drawLayer);
        map.setView([lat, lng], 14);
      } else if (existingGeometry.type === 'LineString') {
        const latLngs = existingGeometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
        L.polyline(latLngs, { color: 'red', weight: 3 }).addTo(drawLayer);
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds);
      }
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const drawLayer = drawLayerRef.current;
    if (!map || !drawLayer || !drawingMode) return;

    const markerIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEuNCAwLjIgMi43IDAuNyAzLjlsLTEuOCAyNC42IDExLjgtMjQuNmMwLjQtMS4yIDAuNy0yLjYgMC43LTMuOUMyNSA1LjYgMTkuNCAwIDEyLjUgMHptMCAxN2MtMi41IDAtNC41LTItNC41LTQuNXMyLTQuNSA0LjUtNC41IDQuNSAyIDQuNSA0LjUtMiA0LjUtNC41IDQuNXoiIGZpbGw9IiMzMzg4ZmYiLz48L3N2Zz4=',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (geometryType === 'Point') {
        // Clear previous markers
        drawLayer.clearLayers();
        
        // Add new marker
        L.marker(e.latlng, { icon: markerIcon }).addTo(drawLayer);
        
        // Notify parent with GeoJSON Point
        const geometry: GeoJSONGeometry = {
          type: 'Point',
          coordinates: [e.latlng.lng, e.latlng.lat],
        };
        onGeometrySelect?.(geometry, 'Point');
      } else if (geometryType === 'LineString') {
        // Add point to line
        const newPoints = [...linePoints, e.latlng];
        setLinePoints(newPoints);
        
        // Clear and redraw
        drawLayer.clearLayers();
        
        // Draw markers for each point
        newPoints.forEach(point => {
          L.circleMarker(point, { radius: 5, color: 'red' }).addTo(drawLayer);
        });
        
        // Draw line if we have 2+ points
        if (newPoints.length >= 2) {
          L.polyline(newPoints, { color: 'red', weight: 3 }).addTo(drawLayer);
          
          // Notify parent with GeoJSON LineString
          const geometry: GeoJSONGeometry = {
            type: 'LineString',
            coordinates: newPoints.map(p => [p.lng, p.lat]),
          };
          onGeometrySelect?.(geometry, 'LineString');
        }
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [drawingMode, geometryType, linePoints, onGeometrySelect]);

  // Handle externally selected geometry (e.g., from "Use My GPS Position" button)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const drawLayer = drawLayerRef.current;
    if (!map || !drawLayer) return;

    // If selectedGeometry is null, clear everything
    if (!selectedGeometry) {
      drawLayer.clearLayers();
      setLinePoints([]);
      return;
    }

    const markerIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEuNCAwLjIgMi43IDAuNyAzLjlsLTEuOCAyNC42IDExLjgtMjQuNmMwLjQtMS4yIDAuNy0yLjYgMC43LTMuOUMyNSA1LjYgMTkuNCAwIDEyLjUgMHptMCAxN2MtMi41IDAtNC41LTItNC41LTQuNXMyLTQuNSA0LjUtNC41IDQuNSAyIDQuNSA0LjUtMiA0LjUtNC41IDQuNXoiIGZpbGw9IiMzMzg4ZmYiLz48L3N2Zz4=',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    // Clear previous drawings
    drawLayer.clearLayers();
    setLinePoints([]);

    if (selectedGeometry.type === 'Point') {
      const [lng, lat] = selectedGeometry.coordinates;
      L.marker([lat, lng], { icon: markerIcon }).addTo(drawLayer);
      map.setView([lat, lng], 16);
    } else if (selectedGeometry.type === 'LineString') {
      const latLngs = selectedGeometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      latLngs.forEach(point => {
        L.circleMarker(point, { radius: 5, color: 'red' }).addTo(drawLayer);
      });
      if (latLngs.length >= 2) {
        L.polyline(latLngs, { color: 'red', weight: 3 }).addTo(drawLayer);
      }
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds);
    }
  }, [selectedGeometry]);

  // Handle obstacles display - update when obstacles change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !obstacles) return;

    // Clear previous obstacles layer
    if (obstaclesLayerRef.current) {
      obstaclesLayerRef.current.clearLayers();
      map.removeLayer(obstaclesLayerRef.current);
    }

    // Create green marker icon for approved obstacles
    const approvedMarkerIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEuNCAwLjIgMi43IDAuNyAzLjlsMTEuOCAyNC42IDExLjgtMjQuNmMwLjQtMS4yIDAuNy0yLjYgMC43LTMuOUMyNSA1LjYgMTkuNCAwIDEyLjUgMHptMCAxN2MtMi41IDAtNC41LTItNC41LTQuNXMyLTQuNSA0LjUtNC41IDQuNSAyIDQuNSA0LjUtMiA0LjUtNC41IDQuNXoiIGZpbGw9IiMxMGI5ODEiLz48L3N2Zz4=',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZWxsaXBzZSBjeD0iMTMiIGN5PSI0MCIgcng9IjEzIiByeT0iNCIgZmlsbD0iIzAwMCIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+',
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    });

    // Create new obstacles layer
    const obstaclesLayer = L.layerGroup().addTo(map);
    obstaclesLayerRef.current = obstaclesLayer;

    // Add all obstacles to the map
    const allPoints: L.LatLng[] = [];
    obstacles.forEach(obstacle => {
      if (obstacle.geometry.type === 'Point') {
        const [lng, lat] = obstacle.geometry.coordinates;
        const latLng = L.latLng(lat, lng);
        allPoints.push(latLng);
        
        const popupContent = `
          <div style="min-width: 200px;">
            <strong>${obstacle.obstacle_type}</strong><br/>
            <strong>Report #${obstacle.id}</strong><br/>
            Height: ${obstacle.height_meters || 'N/A'}m<br/>
            ${obstacle.description}<br/>
            <em>Reporter: ${obstacle.reporter_name}</em><br/>
            <em>Status: ${obstacle.status}</em>
          </div>
        `;
        
        L.marker(latLng, { icon: approvedMarkerIcon })
          .addTo(obstaclesLayer)
          .bindPopup(popupContent);
      } else if (obstacle.geometry.type === 'LineString') {
        const latLngs = obstacle.geometry.coordinates.map(([lng, lat]) => L.latLng(lat, lng));
        allPoints.push(...latLngs);
        
        const popupContent = `
          <div style="min-width: 200px;">
            <strong>${obstacle.obstacle_type}</strong><br/>
            <strong>Report #${obstacle.id}</strong><br/>
            ${obstacle.description}<br/>
            <em>Reporter: ${obstacle.reporter_name}</em><br/>
            <em>Status: ${obstacle.status}</em>
          </div>
        `;
        
        L.polyline(latLngs, { color: '#10b981', weight: 4 })
          .addTo(obstaclesLayer)
          .bindPopup(popupContent);
      }
    });

    // Fit map bounds to show all obstacles
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [obstacles]);

  // Handle user position marker - update when position changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userPosition) return;

    // Clear previous user position layer
    if (userPositionLayerRef.current) {
      userPositionLayerRef.current.clearLayers();
      map.removeLayer(userPositionLayerRef.current);
    }

    // Create red/orange pulsing marker icon for user position
    const userPositionIcon = L.divIcon({
      className: 'user-position-marker',
      html: `
        <div style="position: relative; width: 20px; height: 20px;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); animation: pulse 2s infinite;"></div>
        </div>
        <style>
          @keyframes pulse {
            0% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); transform: translate(-50%, -50%) scale(1); }
            50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); transform: translate(-50%, -50%) scale(1.1); }
            100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); transform: translate(-50%, -50%) scale(1); }
          }
        </style>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // Create new user position layer
    const userPositionLayer = L.layerGroup().addTo(map);
    userPositionLayerRef.current = userPositionLayer;

    // Add user position marker
    L.marker(userPosition, { icon: userPositionIcon })
      .addTo(userPositionLayer)
      .bindPopup('Your current position');

    // Center map on user position when it first becomes available
    map.setView(userPosition, 14);
  }, [userPosition]);

  const clearDrawing = () => {
    if (drawLayerRef.current) {
      drawLayerRef.current.clearLayers();
      setLinePoints([]);
      onGeometrySelect?.(null as any, geometryType);
    }
  };

  return (
    <div className="relative">
      <div ref={mapRef} style={{ height, width: '100%', borderRadius: '8px' }} />
    </div>
  );
}