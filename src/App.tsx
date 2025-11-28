import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { MapView } from "./components/MapView";
import { FeatureList } from "./components/FeatureList";
import { SaveFeatureModal } from "./components/SaveFeatureModal";
import { aoiService } from "./services/aoiService";
import type { AOIFeature } from "./lib/supabase";
import { useAoiStore } from "./store/useAoiStore";

function App() {
  const [features, setFeatures] = useState<AOIFeature[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lon: number;
    zoom?: number;
  } | null>(null);

  // Zustand store
  const aois = useAoiStore((s) => s.aois);
  const removeAoi = useAoiStore((s) => s.removeAoi);

  const mapRef = useRef<any>(null);

  const [pendingGeometry, setPendingGeometry] = useState<GeoJSON.Geometry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load saved AOIs from Supabase
  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    const loaded = await aoiService.getFeatures();
    setFeatures(loaded);
  };

  // When user draws polygon/rect/marker
  const handleFeatureDrawn = (geometry: GeoJSON.Geometry) => {
    setPendingGeometry(geometry);
    setIsModalOpen(true);
  };

  const handleSaveFeature = async (name: string) => {
    if (!pendingGeometry) return;

    const newFeature = await aoiService.saveFeature({
      name,
      geometry: pendingGeometry,
      properties: { createdAt: new Date().toISOString() },
    });

    if (newFeature) {
      setFeatures((prev) => [newFeature, ...prev]);
    }

    setPendingGeometry(null);
    setIsModalOpen(false);
  };

  const handleFeatureDelete = async (id: string) => {
    const ok = await aoiService.deleteFeature(id);
    if (ok) {
      setFeatures((prev) => prev.filter((f) => f.id !== id));
      if (selectedFeatureId === id) {
        setSelectedFeatureId(null);
      }
    }
  };

  const handleFeatureSelect = (feature: AOIFeature | null) => {
    setSelectedFeatureId(feature?.id || null);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const geoJSON = JSON.parse(text);

      if (geoJSON.type === "FeatureCollection") {
        for (const feature of geoJSON.features) {
          await aoiService.saveFeature({
            name: feature.properties?.name || file.name,
            geometry: feature.geometry,
            properties: feature.properties || {},
          });
        }
      } else if (geoJSON.type === "Feature") {
        await aoiService.saveFeature({
          name: geoJSON.properties?.name || file.name,
          geometry: geoJSON.geometry,
          properties: geoJSON.properties || {},
        });
      } else if (geoJSON.type) {
        await aoiService.saveFeature({
          name: file.name,
          geometry: geoJSON,
          properties: {},
        });
      }

      await loadFeatures();
    } catch (e) {
      console.error("Error parsing file:", e);
      alert("Invalid GeoJSON file.");
    }
  };

  return (
    <div className="h-screen flex">

      <Sidebar
        onLocationSelect={(loc) => setSearchLocation(loc)}
        onFileUpload={handleFileUpload}
        features={aois}
        selectedFeatureId={selectedFeatureId}
        onFeatureSelect={(f) => {
          if (!f) return;

          // Zoom into polygon when clicked
          if (f.geometry.type === "Polygon") {
            const coords = f.geometry.coordinates[0].map((c) => [c[1], c[0]]);
            mapRef.current?.fitBounds(coords);
          }
        }}
        onFeatureDelete={(id) => removeAoi(id)}
      />

      <div className="flex-1 relative">
        <MapView
          mapRef={mapRef}
          onFeatureDrawn={handleFeatureDrawn}
          features={features}
          onFeatureSelect={handleFeatureSelect}
          selectedFeatureId={selectedFeatureId}
          searchLocation={searchLocation}
        />

        <FeatureList
          features={features}
          selectedFeatureId={selectedFeatureId}
          onFeatureSelect={handleFeatureSelect}
          onFeatureDelete={handleFeatureDelete}
        />
      </div>

      <SaveFeatureModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingGeometry(null);
        }}
        onSave={handleSaveFeature}
      />
    </div>
  );
}

export default App;
