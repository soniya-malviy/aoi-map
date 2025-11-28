import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { MapView } from "./components/MapView";
import { FeatureList } from "./components/FeatureList";
import { SaveFeatureModal } from "./components/SaveFeatureModal";
import { aoiService } from "./services/aoiService";
import type { AOIFeature } from "./lib/supabase";

function App() {
  const [features, setFeatures] = useState<AOIFeature[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lon: number;
    zoom?: number;
  } | null>(null);

  const [pendingGeometry, setPendingGeometry] = useState<GeoJSON.Geometry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    const loaded = await aoiService.getFeatures();
    setFeatures(loaded);
  };

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
      if (selectedFeatureId === id) setSelectedFeatureId(null);
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
        for (const f of geoJSON.features) {
          await aoiService.saveFeature({
            name: f.properties?.name || file.name,
            geometry: f.geometry,
            properties: f.properties || {},
          });
        }
      } else if (geoJSON.type === "Feature") {
        await aoiService.saveFeature({
          name: geoJSON.properties?.name || file.name,
          geometry: geoJSON.geometry,
          properties: geoJSON.properties || {},
        });
      } else {
        await aoiService.saveFeature({
          name: file.name,
          geometry: geoJSON,
          properties: {},
        });
      }

      await loadFeatures();
    } catch (e) {
      alert("Invalid GeoJSON file.");
    }
  };

  return (
    <div className="h-screen flex">

      <Sidebar
        onLocationSelect={setSearchLocation}
        onFileUpload={handleFileUpload}
      />

      <div className="flex-1 relative">
        <MapView
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
