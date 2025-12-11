// src/services/placesService.ts
export type Hotspot = {
  name: string;
  address?: string;
  rating?: number;
  location: { lat: number; lng: number };
  openNow?: boolean | null;
  placeId?: string;
  category?: string;
  route?: {
    distance?: string;
    duration?: string;
    durationInTraffic?: string;
  } | null;
};

export type HotspotDetails = {
  name?: string;
  address?: string;
  phoneNumber?: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  openNow?: boolean | null;
  businessStatus?: string;
  weekdayText?: string[];
};

export async function fetchHotspots(lat: number, lng: number, keyword?: string): Promise<Hotspot[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
  });
  if (keyword) params.set("keyword", keyword);

  const response = await fetch(`/api/maps/hotspots?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Não foi possível buscar hotspots.");
  }
  const data = await response.json();
  return data.hotspots || [];
}

export async function fetchHotspotDetails(placeId: string): Promise<HotspotDetails | null> {
  if (!placeId) return null;
  const params = new URLSearchParams({ place_id: placeId });
  const response = await fetch(`/api/maps/place-details?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Não foi possível buscar detalhes desse hotspot.");
  }
  const data = await response.json();
  return data.result || null;
}
