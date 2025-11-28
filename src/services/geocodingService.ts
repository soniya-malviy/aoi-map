export interface GeocodeResult {
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  boundingBox?: [number, number, number, number];
}

export const geocodingService = {
  async searchLocation(query: string): Promise<GeocodeResult[]> {
    if (!query.trim()) return [];

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: query,
            format: 'json',
            limit: '5',
            addressdetails: '1',
          }),
        {
          headers: {
            'User-Agent': 'AOI-Creation-App/1.0',
          },
        }
      );

      if (!response.ok) throw new Error('Geocoding request failed');

      const data = await response.json();

      return data.map((item: any) => ({
        name: item.name,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        boundingBox: item.boundingbox
          ? [
              parseFloat(item.boundingbox[0]),
              parseFloat(item.boundingbox[1]),
              parseFloat(item.boundingbox[2]),
              parseFloat(item.boundingbox[3]),
            ]
          : undefined,
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  },
};
