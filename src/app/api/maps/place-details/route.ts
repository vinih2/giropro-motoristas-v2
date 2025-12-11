// src/app/api/maps/place-details/route.ts
import { NextResponse } from "next/server";

const GOOGLE_PLACE_DETAILS_ENDPOINT = "https://maps.googleapis.com/maps/api/place/details/json";

export async function GET(req: Request) {
  const apiKey = process.env.GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing Google Maps key" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("place_id");

  if (!placeId) {
    return NextResponse.json({ error: "Missing place_id" }, { status: 400 });
  }

  const fields = [
    "name",
    "formatted_address",
    "rating",
    "user_ratings_total",
    "price_level",
    "business_status",
    "international_phone_number",
    "current_opening_hours",
  ].join(",");

  const params = new URLSearchParams({
    place_id: placeId,
    fields,
    language: "pt-BR",
    key: apiKey,
  });

  const response = await fetch(`${GOOGLE_PLACE_DETAILS_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: errorText }, { status: response.status });
  }

  const data = await response.json();
  if (data.status !== "OK") {
    return NextResponse.json({ error: data.status || "Erro ao buscar detalhes" }, { status: 500 });
  }

  const result = data.result || {};
  return NextResponse.json({
    result: {
      name: result.name,
      address: result.formatted_address,
      rating: result.rating,
      userRatingsTotal: result.user_ratings_total,
      priceLevel: result.price_level,
      phoneNumber: result.international_phone_number,
      openNow: result.current_opening_hours?.open_now ?? null,
      businessStatus: result.business_status,
      weekdayText: result.current_opening_hours?.weekday_text,
    },
  });
}
