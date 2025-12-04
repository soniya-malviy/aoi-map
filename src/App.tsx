import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { MapView } from "./components/MapView";

import { SaveFeatureModal } from "./components/SaveFeatureModal";
import { aoiService } from "./services/aoiService";
import type { AOIFeature } from "./lib/supabase";
import { TransparentToolbar } from "./components/TransparentToolbar";
import { useAoiStore } from "./store/useAoiStore";

function App() {
  const [features, setFeatures] = useState<AOIFeature[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [baseLayer, setBaseLayer] = useState("streets");
  
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lon: number;
    zoom?: number;
    boundingBox?: [number, number, number, number];
  } | null>(null);

  // Incoming geojson to render as outline (from search OR upload)
  const [selectedGeojson, setSelectedGeojson] = useState<GeoJSON.GeoJSON | null>(null);

  // used by SaveFeatureModal
  const [pendingGeometry, setPendingGeometry] = useState<GeoJSON.Geometry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<"none" | "search" | "project">("search");

  
  const { loadFromDisk } = useAoiStore();

  useEffect(() => {
    loadFeatures();
    loadFromDisk();
    
    // Listen for delete events from map
    const handleDelete = (event: any) => {
      const featureId = event.detail;
      aoiService.deleteFeature(featureId);
      setFeatures(prev => prev.filter(f => f.id !== featureId));
      setSelectedFeatureId(null);
    };
    
    window.addEventListener('deleteSelectedFeature', handleDelete);
    return () => window.removeEventListener('deleteSelectedFeature', handleDelete);
  }, []);
  
  const loadFeatures = async () => {
    const loaded = await aoiService.getFeatures();
    setFeatures(loaded);
  };

  // ---------- HELPERS: GeoJSON parsing + bounds ----------
  function extractGeometryFromGeoJSON(obj: any): GeoJSON.Geometry | null {
    if (!obj) return null;
    // If FeatureCollection, take first feature geometry (you can adapt)
    if (obj.type === "FeatureCollection" && Array.isArray(obj.features) && obj.features.length > 0) {
      return obj.features[0].geometry ?? null;
    }
    // If single Feature
    if (obj.type === "Feature" && obj.geometry) return obj.geometry;
    // If it's a bare Geometry object
    if (["Polygon","MultiPolygon","Point","LineString","MultiLineString","GeometryCollection"].includes(obj.type)) {
      return obj as GeoJSON.Geometry;
    }
    return null;
  }

  function computeBBoxFromGeoJSON(geojson: GeoJSON.GeoJSON): [number, number, number, number] | null {
    try {
      // We'll compute lat/lon min/max from coordinates (simple reducer)
      let coords: number[][] = [];

      const collect = (g: any) => {
        if (!g) return;
        if (g.type === "Feature") return collect(g.geometry);
        if (g.type === "FeatureCollection") {
          g.features.forEach((f: any) => collect(f.geometry));
          return;
        }
        if (g.type === "GeometryCollection") {
          g.geometries.forEach((gg: any) => collect(gg));
          return;
        }
        if (g.type === "Point") coords.push([g.coordinates[1], g.coordinates[0]]);
        if (g.type === "LineString" || g.type === "MultiPoint") g.coordinates.forEach((c:any)=>coords.push([c[1],c[0]]));
        if (g.type === "Polygon" || g.type === "MultiLineString") {
          const loops = g.type === "Polygon" ? g.coordinates : g.coordinates;
          loops.flat(Infinity).forEach((c:any)=> {
            if (Array.isArray(c) && c.length>=2) coords.push([c[1], c[0]]);
          });
        }
        if (g.type === "MultiPolygon") {
          g.coordinates.flat(2).forEach((c:any)=> coords.push([c[1], c[0]]));
        }
      };

      collect(geojson);
      if (coords.length === 0) return null;

      let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
      coords.forEach(([lat, lon]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
      });

      // Nominatim-like [south,north,west,east]
      return [minLat, maxLat, minLon, maxLon];
    } catch (e) {
      console.warn("computeBBox error", e);
      return null;
    }
  }

  // ---------- FILE UPLOAD HANDLER (wired to Sidebar.onFileUpload) ----------
  const handleFileUpload = (file: File) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    // Support only geojson/json in this implementation.
    if (name.endsWith(".geojson") || name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || "");
          const parsed = JSON.parse(text);
          const geometry = extractGeometryFromGeoJSON(parsed);
          if (!geometry) {
            alert("Uploaded file does not contain a valid GeoJSON geometry/feature.");
            return;
          }

          // Show outline on map
          setSelectedGeojson(parsed);

          // compute bounding box and center the map via searchLocation
          const bbox = computeBBoxFromGeoJSON(parsed);
          if (bbox) {
            const [south, north, west, east] = bbox;
            const centerLat = (south + north) / 2;
            const centerLon = (west + east) / 2;
            setSearchLocation({
              lat: centerLat,
              lon: centerLon,
              zoom: 12,
              boundingBox: [south, north, west, east],
            });
          }

          // open save modal with geometry ready for save (use Feature geometry)
          setPendingGeometry(geometry);
          setIsModalOpen(true);
          // Keep sidebar open (user said "no not close") — we won't auto-close it
        } catch (err) {
          console.error("Failed to parse GeoJSON file:", err);
          alert("Could not parse the uploaded GeoJSON file.");
        }
      };
      reader.readAsText(file);
      return;
    }

    // KML or Shapefile: ask for library or tell user to convert to GeoJSON
    if (name.endsWith(".kml") || name.endsWith(".kmz") || name.endsWith(".zip") || name.endsWith(".shp")) {
      alert("This demo supports GeoJSON/JSON uploads. For KML or Shapefile support, add libraries like 'togeojson' (KML) or 'shpjs' (shapefile), or convert to GeoJSON first.");
      return;
    }

    alert("Unsupported file type. Please upload a .geojson or .json file containing GeoJSON.");
  };

  return (
    <div className="h-screen w-screen relative  overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-[80px] z-[50] pointer-events-auto bg-transparent">
        <TransparentToolbar
          onHomeClick={() => setSidebarMode("search")}
          onProjectClick={() => setSidebarMode("project")}
        />
      </div>

      {/* LEFT SIDEBAR */}
      <div className="absolute left-[80px] top-0 w-[320px] bg-white h-full z-[40]">
        <Sidebar
          sidebarMode={sidebarMode}
          onLocationSelect={(loc) => setSearchLocation(loc)}
          onApplyOutline={async (data) => {
            if (data.geometry) {
              const saved = await aoiService.saveFeature(data);
              if (saved) {
                setFeatures(prev => [saved, ...prev]);
              }
            }
            setSelectedGeojson(null); 
            setSearchLocation(null);
          }}
          onGeojsonSelect={(geojson) => setSelectedGeojson(geojson)}
          onConfirmAOI={() => {
            setSidebarMode("project");
            setSelectedGeojson(null);
          }}
          onCloseSidebar={() => setSidebarMode("none")}
          baseLayer={baseLayer}
          onBaseLayerChange={setBaseLayer}
          onFileUpload={handleFileUpload}
          features={features}
          onFeatureSelect={(f) => setSelectedFeatureId(f?.id || null)}
          onFeatureDelete={async (id) => {
            await aoiService.deleteFeature(id);
            setFeatures(prev => prev.filter(f => f.id !== id));
            if (selectedFeatureId === id) setSelectedFeatureId(null);
          }}
        />
      </div>

      {/* MAP */}
      <div className="absolute inset-0 z-[8]">
        <MapView
          onFeatureDrawn={(g) => {
            setPendingGeometry(g);
            setIsModalOpen(true);
          }}
          features={features}
          onFeatureSelect={(f) => setSelectedFeatureId(f?.id || null)}
          selectedFeatureId={selectedFeatureId}
          searchLocation={searchLocation}
          baseLayer={baseLayer}
          selectedGeojson={selectedGeojson}
          onBaseLayerChange={setBaseLayer}
        />
      </div>

      {/* SAVE MODAL */}
      <SaveFeatureModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingGeometry(null);
        }}
        onSave={async (name) => {
          if (!pendingGeometry) return;
          const saved = await aoiService.saveFeature({
            name,
            geometry: pendingGeometry,
            properties: {},
          });
          if (saved) setFeatures((prev) => [saved, ...prev]);
          setIsModalOpen(false);
          setPendingGeometry(null);
          setSelectedGeojson(null);
        }}
      />
    </div>
  );
}

export default App;
