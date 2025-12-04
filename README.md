# AOI (Area of Interest) Creation Application

A web application to search locations, draw AOIs on a map, upload GeoJSON files, and persist AOI features in Supabase. Built with React, TypeScript, Leaflet, Tailwind CSS and Supabase.

## Features
- Interactive map (Leaflet)
  - WMS aerial imagery support
  - Zoom, pan, and draw directly on the map
- Drawing tools
  - Draw polygon, rectangle, point
  - Edit and highlight selected features
  - Save AOIs with a name
- Location search
  - OpenStreetMap (Nominatim) integration
  - Search cities/places and auto-zoom to results
- File upload
  - Import and parse GeoJSON files
- Data storage
  - Save AOIs to Supabase (fallback to localStorage if offline)
- Accessibility
  - ARIA labels, keyboard navigation, screen-reader friendly

## Tech stack
- Frontend: React, TypeScript, Vite  
- UI: Tailwind CSS, Lucide Icons  
- Maps: Leaflet + Leaflet Draw  
- Backend: Supabase (PostgreSQL)  
- Testing: Playwright

## Installation & setup
1. Install dependencies
```bash
npm install
```
2. Start development server
```bash
npm run dev
```
3. Build for production
```bash
npm run build
```
4. Run tests
```bash
npm run test
```

App runs at: http://localhost:5173

## Environment variables
Create a `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_anon_key
```
Find these in Supabase → Project Settings → API.

## Project structure
```
src/
├── components/
│   ├── MapView.tsx
│   ├── Sidebar.tsx
│   ├── FeatureList.tsx
│   └── SaveFeatureModal.tsx
├── services/
│   ├── aoiService.ts
│   └── geocodingService.ts
├── lib/
│   └── supabase.ts
└── store/
    └── useAoiStore.ts
```

## Database schema (Supabase)
```sql
CREATE TABLE aoi_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  geometry jsonb NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Testing (Playwright)
Covered tests:
- App loads
- Map and drawing tools visible
- Location search works
- File upload works
- ARIA labels and keyboard navigation

Run tests:
```bash
npm run test
```

## How AOIs work
1. User draws a shape on the map  
2. A modal prompts for a name  
3. Save writes the AOI to Supabase (or localStorage if needed)  
4. AOIs appear in the list; selecting an AOI centers and highlights it  
5. Deleting an AOI removes it from the map and the database

## Future improvements
- User authentication and per-user AOIs  
- AOI style customization (colors, icons)  
- Measurement tools (area, distance)  
- Clustering or pagination for large datasets  
- Auto-save drafts
