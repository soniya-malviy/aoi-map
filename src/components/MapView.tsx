import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import type { AOIFeature } from '../lib/supabase';

interface MapViewProps {
  onFeatureDrawn: (geometry: GeoJSON.Geometry) => void;
  features: AOIFeature[];
  onFeatureSelect: (feature: AOIFeature | null) => void;
  selectedFeatureId: string | null;
  searchLocation: { lat: number; lon: number; zoom?: number } | null;
}

export function MapView({
  onFeatureDrawn,
  features,
  onFeatureSelect,
  selectedFeatureId,
  searchLocation,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [51.2, 6.5],
      zoom: 10,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const wmsLayer = L.tileLayer.wms(
      'https://www.wms.nrw.de/geobasis/wms_nw_dop',
      {
        layers: 'nw_dop_overlay',
        format: 'image/png',
        transparent: true,
        attribution: '© Land NRW',
        maxZoom: 19,
      }
    );
    wmsLayer.addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    const drawControl = new (L as any).Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
        },
        rectangle: {
          showArea: true,
        },
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: {},
      },
      edit: {
        featureGroup: drawnItems,
        remove: false,
      },
    });
    map.addControl(drawControl);

    L.control.zoom({ position: 'topright' }).addTo(map);

    map.on((L as any).Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);

      const geoJSON = layer.toGeoJSON();
      onFeatureDrawn(geoJSON.geometry);
      setIsDrawingMode(false);
    });

    map.on((L as any).Draw.Event.DRAWSTART, () => {
      setIsDrawingMode(true);
    });

    map.on((L as any).Draw.Event.DRAWSTOP, () => {
      setIsDrawingMode(false);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onFeatureDrawn]);

  useEffect(() => {
    if (!mapRef.current || !drawnItemsRef.current) return;

    drawnItemsRef.current.clearLayers();

    features.forEach((feature) => {
      const geoJSON = L.geoJSON(feature.geometry, {
        style: {
          color: feature.id === selectedFeatureId ? '#f97316' : '#3b82f6',
          weight: 3,
          fillOpacity: 0.2,
        },
        pointToLayer: (_geoJsonPoint, latlng) => {
          return L.circleMarker(latlng, {
            radius: 8,
            color: feature.id === selectedFeatureId ? '#f97316' : '#3b82f6',
            fillColor: feature.id === selectedFeatureId ? '#f97316' : '#3b82f6',
            fillOpacity: 0.5,
            weight: 3,
          });
        },
      });

      geoJSON.on('click', () => {
        onFeatureSelect(feature);
      });

      geoJSON.addTo(drawnItemsRef.current!);
    });
  }, [features, selectedFeatureId, onFeatureSelect]);

  useEffect(() => {
    if (!mapRef.current || !searchLocation) return;

    const { lat, lon, zoom = 14 } = searchLocation;
    mapRef.current.setView([lat, lon], zoom);

    L.marker([lat, lon], {
      icon: L.divIcon({
        className: 'search-marker',
        html: '<div style="background-color: #f97316; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
    }).addTo(mapRef.current);
  }, [searchLocation]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        data-testid="map-container"
      />
      {isDrawingMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg z-[1000]">
          <p className="text-sm text-gray-700">Click to draw your area of interest</p>
        </div>
      )}
    </div>
  );
}

