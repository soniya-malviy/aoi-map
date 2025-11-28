import { useState, useEffect, useRef } from 'react';
import { Search, Upload, X } from 'lucide-react';
import { geocodingService } from '../services/geocodingService';


export interface GeocodeResult {
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  boundingBox?: [number, number, number, number];
}

interface SidebarProps {
  onLocationSelect: (location: { lat: number; lon: number; zoom?: number }) => void;
  onFileUpload: (file: File) => void;
}

export function Sidebar({ onLocationSelect, onFileUpload }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      const results = await geocodingService.searchLocation(searchQuery);
      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleResultClick = (result: GeocodeResult) => {
    onLocationSelect({
      lat: result.lat,
      lon: result.lon,
      zoom: 14,
    });
    setSearchQuery(result.name);
    setShowResults(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="w-96 bg-white shadow-xl flex flex-col h-full">
      <div className="p-6 flex-1">
        <h1 className="text-2xl font-semibold text-orange-500 mb-2">
          Define Area of Interest
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          Define the area(s) where you will apply your object count & detection
          model
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options:
            </label>

            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a city, town... or draw area on map"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                data-testid="search-input"
                aria-label="Search for location"
                autoFocus
                tabIndex={0}

                
                />

                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowResults(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {showResults && searchResults.length > 0 && (
                <div
                  className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                  data-testid="search-results"
                >
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-medium text-gray-900">{result.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {result.displayName}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {isSearching && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                  Searching...
                </div>
              )}
            </div>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,.json,.shp,.kml"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload shape file"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group"
              data-testid="upload-button"
              aria-label="Upload shape file"
            >
              <Upload className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
              <span className="text-gray-600 group-hover:text-orange-500">
                Uploading a shape file
              </span>
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Drawing Tools</h3>
          <p className="text-sm text-blue-700">
            Use the map controls on the right to draw polygons, rectangles, or
            place markers to define your area of interest.
          </p>
        </div>
      </div>
    </div>
  );
}
