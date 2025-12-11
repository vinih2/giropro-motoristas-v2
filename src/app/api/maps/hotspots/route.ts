// src/app/api/maps/hotspots/route.ts
import { NextResponse } from 'next/server';

const GOOGLE_PLACES_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const GOOGLE_DIRECTIONS_ENDPOINT = 'https://maps.googleapis.com/maps/api/directions/json';

type RouteLeg = {
  distance?: { text?: string };
  duration?: { text?: string };
  duration_in_traffic?: { text?: string };
};

type DirectionsResponse = {
  routes?: Array<{ legs?: RouteLeg[] }>;
};

type PlaceLocation = {
  lat: number;
  lng: number;
};

type PlaceResult = {
  name: string;
  vicinity?: string;
  rating?: number;
  opening_hours?: { open_now?: boolean };
  geometry?: { location?: PlaceLocation };
  place_id?: string;
};

type NearbySearchResponse = {
  results?: PlaceResult[];
};

type HotspotRoute = {
  distance?: string;
  duration?: string;
  durationInTraffic?: string;
} | null;

function buildNearbyUrl(lat: number, lng: number, radius = 5000, keyword = 'ponto de taxi') {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: radius.toString(),
    keyword,
    key: process.env.GOOGLE_MAPS_KEY || '',
    type: 'point_of_interest',
    language: 'pt-BR',
  });
  return `${GOOGLE_PLACES_ENDPOINT}?${params.toString()}`;
}

async function fetchRoutes(origin: string, destination: string): Promise<HotspotRoute> {
  if (!process.env.GOOGLE_MAPS_KEY) return null;
  const params = new URLSearchParams({
    origin,
    destination,
    key: process.env.GOOGLE_MAPS_KEY,
    departure_time: 'now',
    language: 'pt-BR',
  });
  const response = await fetch(`${GOOGLE_DIRECTIONS_ENDPOINT}?${params.toString()}`);
  if (!response.ok) return null;
  const data = (await response.json()) as DirectionsResponse;
  const route = data.routes?.[0]?.legs?.[0];
  if (!route) return null;
  return {
    distance: route.distance?.text,
    duration: route.duration?.text,
    durationInTraffic: route.duration_in_traffic?.text,
  };
}

export async function GET(req: Request) {
  if (!process.env.GOOGLE_MAPS_KEY) {
    return NextResponse.json({ error: "Missing Google Maps key" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const keyword = searchParams.get('keyword') || 'rodoviaria';

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
  }

  const nearbyResponse = await fetch(buildNearbyUrl(lat, lng, 4000, keyword));
  if (!nearbyResponse.ok) {
    const error = await nearbyResponse.text();
    return NextResponse.json({ error }, { status: nearbyResponse.status });
  }
  const data = (await nearbyResponse.json()) as NearbySearchResponse;
  const results = data.results?.slice(0, 5) ?? [];

  const hotspots = (
    await Promise.all(
      results.map(async (place: PlaceResult) => {
        const location = place.geometry?.location;
        if (!location) return null;
        const origin = `${lat},${lng}`;
        const destination = `${location.lat},${location.lng}`;
        const route = await fetchRoutes(origin, destination);
        return {
          name: place.name,
          address: place.vicinity,
          rating: place.rating,
          location,
          openNow: place.opening_hours?.open_now ?? null,
          placeId: place.place_id,
          route,
        };
      })
    )
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return NextResponse.json({ hotspots });
}
