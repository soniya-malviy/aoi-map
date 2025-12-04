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

<<<<<<< HEAD
## Testing (Playwright)
Covered tests:
- App loads
- Map and drawing tools visible
- Location search works
- File upload works
- ARIA labels and keyboard navigation
=======
**Indexes**:
- `aoi_features_created_at_idx`: Efficient sorting by creation time

**Security**:
- Row Level Security (RLS) enabled
- Public read/write policies (demo purposes - can be restricted per user)

### ER Diagram

```
┌─────────────────────────────────────┐
│          aoi_features               │
├─────────────────────────────────────┤
│ id (uuid, PK)                       │
│ name (text)                         │
│ geometry (jsonb) - GeoJSON geometry │
│ properties (jsonb) - Metadata       │
│ created_at (timestamptz)            │
│ updated_at (timestamptz)            │
└─────────────────────────────────────┘
```

## API Documentation

### Supabase Database API

All operations use Supabase's auto-generated REST API:

#### Get All Features
```typescript
GET /rest/v1/aoi_features
Response: AOIFeature[]

Example:
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Downtown Area",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[6.5, 51.2], [6.6, 51.2], ...]]
    },
    "properties": {},
    "created_at": "2025-11-28T10:00:00Z",
    "updated_at": "2025-11-28T10:00:00Z"
  }
]
```

#### Create Feature
```typescript
POST /rest/v1/aoi_features
Body: { name: string, geometry: object, properties: object }
Response: AOIFeature

Example Request:
{
  "name": "Agricultural Field",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[6.5, 51.2], [6.6, 51.2], [6.6, 51.3], [6.5, 51.3], [6.5, 51.2]]]
  },
  "properties": { "createdAt": "2025-11-28T10:00:00Z" }
}
```

#### Delete Feature
```typescript
DELETE /rest/v1/aoi_features?id=eq.{id}
Response: 204 No Content
```

### External APIs

#### Nominatim Geocoding
```typescript
GET https://nominatim.openstreetmap.org/search
Params: { q: string, format: 'json', limit: '5', addressdetails: '1' }

Example Response:
[
  {
    "name": "Cologne",
    "display_name": "Cologne, North Rhine-Westphalia, Germany",
    "lat": "50.937531",
    "lon": "6.960279",
    "boundingbox": ["50.8782", "51.0851", "6.7725", "7.1620"]
  }
]
```

## Performance Considerations

### Current Implementation

1. **Efficient Rendering**:
   - Leaflet's canvas renderer handles thousands of features efficiently
   - GeoJSON layers redrawn only when features change
   - Debounced search input (500ms) to reduce API calls

2. **Data Loading**:
   - Features loaded once on mount
   - Cached in localStorage for offline access
   - Incremental updates (no full reload on single change)

3. **Bundle Optimization**:
   - Vite's code splitting and tree shaking
   - Lazy loading of map libraries
   - Optimized Tailwind CSS (purged unused classes)

### Scaling to 1000s of Features

**Strategies Implemented**:

1. **Clustering**: For point markers, implement marker clustering
   ```typescript
   import 'leaflet.markercluster';
   const markers = L.markerClusterGroup();
   ```

2. **Virtual Scrolling**: Feature list uses CSS `overflow-y: auto` with max-height

3. **Spatial Indexing**: PostgreSQL with PostGIS extensions (future enhancement):
   ```sql
   CREATE INDEX aoi_features_geom_idx ON aoi_features USING GIST ((geometry::geometry));
   ```


## Testing Strategy

### Current Test Coverage

**3 Playwright Test Suites** covering:

1. **Core Functionality** (6 tests):
   - Application loads with all elements
   - Location search and result display
   - File upload dialog interaction
   - Map control visibility and interaction
   - Drawing controls presence
   - Search input clearing

2. **Feature Management** (1 test):
   - GeoJSON file upload and parsing

3. **Accessibility** (2 tests):
   - ARIA label presence
   - Keyboard navigation

**Testing Approach**:
- **Integration tests**: Focus on user workflows rather than unit tests
- **Critical path coverage**: Tests cover main user journeys
- **Accessibility checks**: Ensures WCAG compliance
- **No mocking**: Tests run against real application (more confidence)



### Running Tests
>>>>>>> 6ee13b5caa116b48a612d36072263deb9407ef12

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

<<<<<<< HEAD
## Future improvements
- User authentication and per-user AOIs  
- AOI style customization (colors, icons)  
- Measurement tools (area, distance)  
- Clustering or pagination for large datasets  
- Auto-save drafts
=======
### 1. Map Library: Leaflet vs Modern Alternatives

**Decision**: Chose Leaflet over MapLibre GL JS

**Tradeoff**:
- ✅ Simpler, more stable, better documentation
- ✅ Easier integration with WMS layers
- ❌ No GPU acceleration (less smooth for 10k+ features)
- ❌ Raster-focused (less future-proof for vector tiles)

**Why**: For the current requirements (WMS layers, drawing tools, <1000 features initially), Leaflet is more pragmatic. Migration to MapLibre is possible if needed.

### 2. State Management: React Hooks vs Redux

**Decision**: Used React hooks instead of Redux/Zustand

**Tradeoff**:
- ✅ Simpler, less boilerplate
- ✅ Easier to understand and maintain
- ❌ Potential prop drilling if app grows
- ❌ No time-travel debugging

**Why**: Application state is simple (list of features, selection state). Adding Redux would be over-engineering. Can migrate later if complexity increases.

### 3. Persistence: Dual (Supabase + localStorage) vs Single

**Decision**: Implemented dual persistence

**Tradeoff**:
- ✅ Works offline
- ✅ Instant feedback (no waiting for network)
- ❌ More complex synchronization logic
- ❌ Potential data inconsistencies

**Why**: Better UX with immediate feedback. Requirement specified both, so implemented as specified.

### 4. Testing: Integration vs Unit

**Decision**: Focused on Playwright integration tests over unit tests

**Tradeoff**:
- ✅ Tests real user workflows
- ✅ Higher confidence in functionality
- ❌ Slower test execution
- ❌ Harder to debug failures

**Why**: Integration tests provide more value for this application. Unit tests would be added for complex utilities/services with more time.

### 5. Type Safety: Strict TypeScript vs Permissive

**Decision**: Enabled strict mode in TypeScript

**Tradeoff**:
- ✅ Catches bugs at compile time
- ✅ Better IDE autocomplete
- ❌ More time writing types
- ❌ Occasional type gymnastics with libraries

**Why**: Type safety is crucial for maintainability, especially with GeoJSON structures. Worth the upfront cost.

### 6. Styling: Tailwind vs CSS Modules

**Decision**: Used Tailwind CSS

**Tradeoff**:
- ✅ Rapid development
- ✅ Consistent design system
- ✅ Smaller bundle (purged unused classes)
- ❌ Verbose className strings
- ❌ Learning curve for team members

**Why**: Matches project requirements and enables quick iteration on UI matching Figma designs.

### 7. File Upload: Client-side Parsing vs Server-side

**Decision**: Parse GeoJSON files client-side

**Tradeoff**:
- ✅ No server processing needed
- ✅ Instant feedback
- ❌ Limited file size handling
- ❌ Security concerns with large/malicious files

**Why**: Simpler architecture for MVP. Would add server-side validation and size limits for production.



>>>>>>> 6ee13b5caa116b48a612d36072263deb9407ef12
