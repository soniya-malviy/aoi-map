import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, Upload, X } from 'lucide-react';


export interface GeocodeResult {
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  boundingBox?: [number, number, number, number];
  display_name?: string;
  geojson?: GeoJSON.GeoJSON;
}

interface SidebarProps {
  onLocationSelect: (location: { lat: number; lon: number; zoom?: number; boundingBox?: [number, number, number, number] }) => void;
  onFileUpload: (file: File) => void;
  sidebarMode: "none" | "search" | "project";
  onCloseSidebar: () => void;
  onApplyOutline: (data: any) => void;
  baseLayer: string;
  onBaseLayerChange: (layer: string) => void;
  features: any[];
  onFeatureSelect: (feature: any) => void;
  onFeatureDelete: (id: string) => void;
  onGeojsonSelect: (geojson: GeoJSON.GeoJSON | null) => void;
  onConfirmAOI: () => void;
}

export function Sidebar({ onLocationSelect, onFileUpload, onApplyOutline, features, onFeatureDelete, sidebarMode, onGeojsonSelect, onConfirmAOI }: SidebarProps) {
  
  if (sidebarMode === "project") {
    return (
<div className="w-[320px] bg-white/20 backdrop-blur-xl h-full shadow-xl border-l border-white/30 flex flex-col rounded-l-2xl">
        <div className="flex items-center px-4 h-[60px] border-b border-gray-200 bg-[#fdf7ed] rounded-tr-2xl">
          <button
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-[#E28444] transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="mx-3 text-gray-400">|</span>
          <h1 className="text-lg font-medium text-[#E28444]">
            Define Project Scope
          </h1>
        </div>
        <div className="p-6">
          <p className="text-gray-600 text-sm mb-4">Configure your project scope and review saved AOI features.</p>
          {features.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Saved AOI Features</h3>
              <div className="space-y-2">
                {features.map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{feature.name}</p>
                      <p className="text-xs text-gray-500">Polygon</p>
                    </div>
                    <button
                      onClick={() => onFeatureDelete(feature.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(null);
  

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


const runNominatim = async (q: string) => {
  if (!q.trim()) {
    setSearchResults([]);
    setIsSearching(false);
    return;
  }

  setIsSearching(true);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&addressdetails=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "aoi-tool/1.0" }
    });
    const data = await res.json();

    setSearchResults(data);
    setShowResults(true);
  } catch (e) {
    console.error("Search error:", e);
    setSearchResults([]);
  }

  setIsSearching(false);  // ← REQUIRED FIX
};



  const handleSearch = () => {
    runNominatim(searchQuery);
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      runNominatim(searchQuery);
    }, 200);
  }, [searchQuery]);

  // const applyOutlineAsBase = () => {
  //   if (!selectedLocation || !selectedLocation.geojson) return;

  //   const newAoi = {
  //     id: crypto.randomUUID(),
  //     name: selectedLocation.display_name || searchQuery || 'Search AOI',
  //     geojson: selectedLocation.geojson,
  //     createdAt: new Date().toISOString(),
  //     visible: true
  //   };

  //   addAoi(newAoi);

  //   // send to map view
  //   onApplyOutline({
  //     geojson: selectedLocation.geojson
  //   });
  // };


const handleSearchResultClick = (result: any) => {
  setIsSearching(false); // ← stops the spinner immediately

  const lat = Number(result.lat);
  const lon = Number(result.lon);

  const bbox = result.boundingbox;
  const south = Number(bbox?.[0]);
  const north = Number(bbox?.[1]);
  const west  = Number(bbox?.[2]);
  const east  = Number(bbox?.[3]);

  onLocationSelect({
    lat,
    lon,
    zoom: 13,
    boundingBox: [south, north, west, east],
  });

  setSelectedLocation({
    name: result.display_name,
    displayName: result.display_name,
    lat,
    lon,
    boundingBox: [south, north, west, east],
    geojson: result.geojson || null,
  });

  setSearchQuery(result.display_name);
  setShowResults(false);
};




const applyOutlineAsBase = () => {
  if (!selectedLocation?.geojson) return;
  // Only show outline on map
  onGeojsonSelect(selectedLocation.geojson);
};


  
  const confirmAreaOfInterest = async () => {
    if (!selectedLocation?.geojson) return;

    // Save to aoiService
    const geometry = selectedLocation.geojson.type === 'Feature' 
      ? selectedLocation.geojson.geometry 
      : selectedLocation.geojson as GeoJSON.Geometry;
      
    const aoiData = {
      name: selectedLocation.display_name || searchQuery || 'Search AOI',
      geometry: geometry,
      properties: {}
    };

    // Pass to parent to save and navigate
    onApplyOutline(aoiData);
    onConfirmAOI();
  };
  return (
    <div className="flex h-full">

    

      {/* MAIN RIGHT SIDEBAR */}

      
<div className="w-[320px] bg-white backdrop-blur-xl h-full shadow-xl border-l border-white/30 flex flex-col rounded-l-2xl">

<div className='h-[50px] w-full bg-[#F5EEE0]'></div>

        {/* Header */}
<div className="flex items-center px-4 h-[60px] border-b border-white/20 bg-white/10 backdrop-blur-xl rounded-tl-2xl">


          <button
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-[#E28444] transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span className="mx-3 text-gray-400">|</span>

          <h1 className="text-lg font-medium text-[#E28444]">
            Define Area of Interest
          </h1>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">

          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            <span className="font-semibold text-black">
              Define the area(s)
            </span>{' '}
            where you will apply your object count & detection model
          </p>

          {/* OPTIONS LABEL */}
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Options:
          </label>

          {/* SEARCH INPUT BOX */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-4 text-gray-400 w-5 h-5" />

            <textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Search for a city, town…\nor draw area on map"
              className="w-full pl-10 pr-10 py-4 h-[110px] resize-none bg-[#F5EEE0] border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-black/20"
            />

            {searchQuery && (
              <button
                onClick={() => { 
                  setSearchQuery(''); 
                  setShowResults(false); 
                  setSelectedLocation(null);
                }}
                className="absolute right-3 top-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={searchQuery.trim().length < 2 || isSearching}
              className="absolute right-3 bottom-4 bg-[#E28444] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#d17a3e] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* SEARCH DROPDOWN */}
          {showResults && searchResults.length > 0 && (
            <div className="z-20 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {searchResults.slice(0, 6).map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchResultClick(result)}
                  className="text-left px-4 py-3 hover:bg-orange-50 border-b last:border-none w-full"
                >
                  <p className="font-medium text-gray-900 text-sm">{result.display_name}</p>
                  <p className="text-xs text-gray-500">Location</p>
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <div className="mt-2 p-4 bg-white border rounded-lg text-center text-gray-500">
              Searching…
            </div>
          )}

          {/* SHAPEFILE UPLOAD */}
          <div className="mt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,.json,.shp,.kml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) onFileUpload(e.target.files[0]);
              }}
            />


          <div className="mt-4">
            <button
              onClick={applyOutlineAsBase}
              disabled={!selectedLocation || !selectedLocation.geojson}
              className="w-full bg-[#7E786F] text-white py-3 rounded-lg shadow-sm hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply outline as base image
            </button>
            <div className="text-xs text-gray-400 mt-2">
              {selectedLocation && selectedLocation.geojson ? 
                `Show outline for ${selectedLocation.display_name || searchQuery}` : 
                'Search for a location first'
              }
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={confirmAreaOfInterest}
              disabled={!selectedLocation || !selectedLocation.geojson}
              className="w-full bg-[#B8642B] text-white py-3 rounded-lg shadow-sm hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Area of Interest
            </button>
          </div>



            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 bg-[#F5EEE0] rounded-xl hover:bg-[#f3e8d1] mt-4"
            >
              <Upload className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 text-sm">Upload a shape file</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}





export function getAvailableBaseLayers() {
  return [
    { id: "streets", label: "Streets", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" },

    { id: "satellite", label: "Satellite", url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" },

    { id: "hybrid", label: "Hybrid", url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" },

    { id: "terrain", label: "Terrain", url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}" },

    { id: "dark", label: "Dark Mode", url: "https://tiles.stadiamaps.com/tiles/alidade_dark/{z}/{x}/{y}.png" },

    { id: "light", label: "Light Mode", url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png" },

    { id: "outdoors", label: "Outdoors", url: "https://tile.opentopomap.org/{z}/{x}/{y}.png" },
  ];
}
