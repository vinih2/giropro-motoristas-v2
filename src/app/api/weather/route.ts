import { NextRequest, NextResponse } from 'next/server';

type GeoDirectEntry = {
  lat: number;
  lon: number;
};

type ForecastEntry = {
  dt_txt: string;
  main: { temp: number };
  weather: Array<{ main: string; description: string; icon: string }>;
  pop?: number;
  wind?: { speed?: number };
};

type ForecastResponse = {
  list?: ForecastEntry[];
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cidade = searchParams.get('cidade');
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!cidade || !apiKey) {
    return NextResponse.json({ error: 'Configuração incompleta' }, { status: 400 });
  }

  try {
    // 1. Geocoding (Descobrir lat/lon da cidade)
    const geoRes = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${cidade},BR&limit=1&appid=${apiKey}`
    );
    const geoData = (await geoRes.json()) as GeoDirectEntry[];

    if (!geoData.length) {
      return NextResponse.json({ error: 'Cidade não encontrada' }, { status: 404 });
    }

    const { lat, lon } = geoData[0];

    // 2. Previsão Horária (5 dias / 3h)
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${apiKey}`
    );
    const forecastData = (await forecastRes.json()) as ForecastResponse;

    if (!forecastData.list?.length) {
      return NextResponse.json({ error: 'Previsão indisponível' }, { status: 500 });
    }

    const current = forecastData.list[0];
    const hourly = forecastData.list.slice(1, 7).map((item) => ({
      time: item.dt_txt,
      temp: Math.round(item.main.temp),
      main: item.weather[0].main,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      rainChance: item.pop ? Math.round(item.pop * 100) : 0,
      wind: item.wind?.speed ?? 0,
    }));

    return NextResponse.json({
      temp: Math.round(current.main.temp),
      descricao: current.weather[0].description,
      icon: current.weather[0].icon,
      principal: current.weather[0].main,
      hourly,
    });

  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar clima' }, { status: 500 });
  }
}
