import { Trash2, MapPin, Square } from 'lucide-react';
import type { AOIFeature } from '../lib/supabase';

interface FeatureListProps {
  features: AOIFeature[];
  selectedFeatureId: string | null;
  onFeatureSelect: (feature: AOIFeature) => void;
  onFeatureDelete: (id: string) => void;
}

export function FeatureList({
  features,
  selectedFeatureId,
  onFeatureSelect,
  onFeatureDelete,
}: FeatureListProps) {
  if (features.length === 0) {
    return null;
  }

  const getFeatureIcon = (geometry: GeoJSON.Geometry) => {
    switch (geometry.type) {
      case 'Point':
        return <MapPin className="w-4 h-4" />;
      case 'Polygon':
      case 'LineString':
        return <Square className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  return (
    <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-4 max-w-sm z-[1000]">
      <h3 className="font-semibold text-gray-900 mb-3">Saved AOI Features</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {features.map((feature) => (
          <div
            key={feature.id}
            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors cursor-pointer ${
              selectedFeatureId === feature.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onFeatureSelect(feature)}
            data-testid={`feature-item-${feature.id}`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="text-gray-600">
                {getFeatureIcon(feature.geometry)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {feature.name || 'Unnamed Feature'}
                </p>
                <p className="text-xs text-gray-500">
                  {feature.geometry.type}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFeatureDelete(feature.id!);
              }}
              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
              aria-label={`Delete ${feature.name || 'feature'}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
