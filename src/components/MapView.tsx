import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

interface MapViewProps {
  onFeatureDrawn: (geometry: GeoJSON.Geometry) => void;
  features: any[];
  onFeatureSelect: (feature: any | null) => void;
  selectedFeatureId: string | null;
  searchLocation: {
    lat: number;
    lon: number;
    zoom?: number;
    boundingBox?: [number, number, number, number];
  } | null;
  baseLayer: string;
  selectedGeojson?: GeoJSON.GeoJSON | null;
  onBaseLayerChange?: (layer: string) => void;
}

function startDrawing(type: 'polygon' | 'rectangle' | 'circle') {
  const map = (window as any).mapInstance;
  if (!map) return;
  
  if (type === 'polygon') {
    new (L.Draw as any).Polygon(map).enable();
  } else if (type === 'rectangle') {
    new (L.Draw as any).Rectangle(map).enable();
  } else if (type === 'circle') {
    new (L.Draw as any).Circle(map).enable();
  }
}

function switchBaseLayer(layer: string, onBaseLayerChange?: (layer: string) => void) {
  const map = (window as any).mapInstance;
  if (!map) return;
  
  // Remove existing tile layers
  map.eachLayer((l: any) => {
    if (l instanceof L.TileLayer) {
      map.removeLayer(l);
    }
  });
  
  let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  let attribution = '© OpenStreetMap contributors';
  
  if (layer === 'satellite') {
    url = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
    attribution = '© Google';
  }
  
  L.tileLayer(url, { 
    maxZoom: 18,
    attribution: attribution,
    subdomains: layer === 'satellite' ? ['mt0', 'mt1', 'mt2', 'mt3'] : ['a', 'b', 'c']
  }).addTo(map);
  
  if (onBaseLayerChange) {
    onBaseLayerChange(layer);
  }
}

export function MapView({
  onFeatureDrawn,
  features,
  onFeatureSelect,
  selectedFeatureId,
  searchLocation,
  baseLayer,
  selectedGeojson,
  onBaseLayerChange
}: MapViewProps) {

  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const searchBorderLayerRef = useRef<L.Layer | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  //
  // DRAW SELECTED GEOJSON OUTLINE
  //
  useEffect(() => {
    if (!mapRef.current) return;

    // remove old outline
    if (searchBorderLayerRef.current) {
      mapRef.current.removeLayer(searchBorderLayerRef.current);
      searchBorderLayerRef.current = null;
    }

    if (!selectedGeojson) return;

    try {
      const layer = L.geoJSON(selectedGeojson, {
        style: {
          color: "#c05621",
          weight: 2,
          dashArray: "4 4",
          fillOpacity: 0.05
        }
      }).addTo(mapRef.current);

      searchBorderLayerRef.current = layer;

      // AUTO FIT BOUNDS
      mapRef.current.fitBounds(layer.getBounds(), { padding: [20, 20], animate: false });

    } catch (e) {
      console.log("GeoJSON error", e);
    }

  }, [selectedGeojson]);


  //
  // CREATE MAP
  //
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 10],
      zoom: 2
    });

    // Initialize with the current base layer
    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '© OpenStreetMap contributors';
    
    if (baseLayer === 'satellite') {
      url = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
      attribution = '© Google';
    }

    L.tileLayer(url, {
      maxZoom: 18,
      attribution: attribution,
      subdomains: baseLayer === 'satellite' ? ['mt0', 'mt1', 'mt2', 'mt3'] : ['a', 'b', 'c']
    }).addTo(map);

    const fg = new L.FeatureGroup();
    drawnItemsRef.current = fg;
    map.addLayer(fg);

    mapRef.current = map;
    (window as any).mapInstance = map;
    
    // Add drawing event listeners
    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      const geoJSON = layer.toGeoJSON();
      onFeatureDrawn(geoJSON.geometry);
    });
  }, [baseLayer]);


  // Remove outline when a new feature is saved into features[]
useEffect(() => {
  if (!mapRef.current) return;

  // If outline exists, remove it when AOIs change
  if (searchBorderLayerRef.current) {
    mapRef.current.removeLayer(searchBorderLayerRef.current);
    searchBorderLayerRef.current = null;
  }

}, [features]);


  //
  // AUTO ZOOM FROM SEARCH
  //
  useEffect(() => {
    if (!mapRef.current || !searchLocation) return;

    const { lat, lon, zoom = 12, boundingBox } = searchLocation;

    mapRef.current.setView([lat, lon], zoom);

    if (boundingBox) {
      const [south, north, west, east] = boundingBox;

      mapRef.current.fitBounds(
        [
          [south, west],
          [north, east]
        ],
        { padding: [20, 20], animate: false }
      );
    }
  }, [searchLocation]);


  //
  // RENDER AOI FEATURES
  //
  useEffect(() => {
    if (!drawnItemsRef.current) return;

    drawnItemsRef.current.clearLayers();

    features.forEach((f) => {
      const layer = L.geoJSON(f.geometry, {
        style: {
          color: f.id === selectedFeatureId ? "#f97316" : "#3b82f6",
          weight: 3,
          fillOpacity: 0.2
        }
      });

      layer.on("click", () => onFeatureSelect(f));
      layer.addTo(drawnItemsRef.current!);
    });
  }, [features, selectedFeatureId]);

  return (
    <div className="w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      
   {/* Right Sidebar Toolbar */}
<div className="absolute right-6 top-1/2 -translate-y-1/2 z-[1000]">

  <div className="bg-white rounded-xl shadow-xl p-3 flex flex-col items-center gap-3 border border-gray-200">

    {/* --- Drawing Tools --- */}
    <button
      onClick={() => startDrawing('polygon')}
      className="p-2 hover:bg-gray-100 rounded-lg transition"
      title="Draw Polygon"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E28444" strokeWidth="2">
        <path d="M12 2l7 4v8l-7 4-7-4V6l7-4z" />
      </svg>
    </button>

    <button
      onClick={() => startDrawing('rectangle')}
      className="p-2 hover:bg-gray-100 rounded-lg transition"
      title="Draw Rectangle"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E28444" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="3" />
      </svg>
    </button>

    <button
      onClick={() => startDrawing('circle')}
      className="p-2 hover:bg-gray-100 rounded-lg transition"
      title="Draw Circle"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E28444" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
      </svg>
    </button>

    {/* Divider */}
    <div className="w-full h-[1px] bg-gray-300" />

    {/* --- Zoom Controls --- */}
    <button
      onClick={() => (window as any).mapInstance?.zoomIn()}
      className="p-2 hover:bg-gray-100 rounded-lg transition"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="11" y1="8" x2="11" y2="14"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    </button>

    <button
      onClick={() => (window as any).mapInstance?.zoomOut()}
      className="p-2 hover:bg-gray-100 rounded-lg transition"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    </button>

    {/* Divider */}
    <div className="w-full h-[1px] bg-gray-300" />

    {/* --- Base Layer Switch --- */}
    <button
      onClick={() => switchBaseLayer('streets', onBaseLayerChange)}
      className={`p-2 rounded-lg transition ${
        baseLayer === 'streets' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
      }`}
      title="Street View"
    >
      🗺️
    </button>

    <button
      onClick={() => switchBaseLayer('satellite', onBaseLayerChange)}
      className={`p-2 rounded-lg transition ${
        baseLayer === 'satellite' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
      }`}
      title="Satellite View"
    >
      🛰️
    </button>

  </div>

</div>


    </div>
  );
}
