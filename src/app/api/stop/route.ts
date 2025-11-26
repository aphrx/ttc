import { NextRequest, NextResponse } from 'next/server';

type RouteDetails = {
  minutes: number[];
  route_long_name?: string | null;
  mode_name?: string | null;
};

type Schedule = Record<string, RouteDetails>;

async function findStop(stopNumber: string) {
  const apiKey = process.env.TRANSIT_API_KEY;
  if (!apiKey) {
    console.error('TRANSIT_API_KEY not set');
    return null;
  }

  const apiUrl = `https://external.transitapp.com/v3/public/search_stops?query=${encodeURIComponent(
    stopNumber,
  )}&max_num_results=10&lat=43.690730&lon=-79.418124`;

  const res = await fetch(apiUrl, {
    headers: { apiKey },
  });

  if (!res.ok) {
    console.error('Error from transit search_stops API', res.status);
    return null;
  }

  const data = await res.json();
  const stops: any[] = data.results ?? [];

  // Same logic: pick the first TTC stop
  const ttcStop = stops.find(
    (stop) =>
      typeof stop.global_stop_id === 'string' &&
      stop.global_stop_id.includes('TTC'),
  );

  return ttcStop ?? null;
}

async function getStop(stopNumber: string): Promise<{
  stop: any | null;
  schedule: Schedule | null;
}> {
  const stop = await findStop(stopNumber);
  if (!stop) return { stop: null, schedule: null };

  const apiKey = process.env.TRANSIT_API_KEY!;
  const apiUrl = `https://external.transitapp.com/v3/public/stop_departures?global_stop_id=${encodeURIComponent(
    stop.global_stop_id,
  )}`;

  const res = await fetch(apiUrl, {
    headers: { apiKey },
  });

  if (!res.ok) {
    console.error('Error from transit stop_departures API', res.status);
    return { stop: null, schedule: null };
  }

  const data = await res.json();
  const routes: any[] = data.route_departures ?? [];

  const schedule: Schedule = {};
  const nowMs = Date.now();


  for (const route of routes) {
    const line = route.route_short_name;
    for (const itinerary of route.itineraries ?? []) {
      const branchedLine = `${line}${itinerary.branch_code ?? ''}`;
      for (const depart of itinerary.schedule_items ?? []) {
        const departureMs = (depart.departure_time ?? 0) * 1000;
        const diffMinutes = Math.round((departureMs - nowMs) / 60000);

        // Rough equivalent of "within the next hour"
        if (diffMinutes >= 0 && diffMinutes < 60) {
          if (!schedule[branchedLine]) {
            schedule[branchedLine] = {
              minutes: [],
              route_long_name:
                route.route_long_name || itinerary?.destination || itinerary?.headsign || null,
              mode_name: route.mode_name ?? null,
            };
          }
          schedule[branchedLine].minutes.push(diffMinutes);
        }
      }
    }
  }

  // sort minutes for consistency
  for (const key of Object.keys(schedule)) {
    schedule[key].minutes.sort((a, b) => a - b);
  }

  return { stop, schedule };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stopNumber = searchParams.get('stopNumber');

  if (!stopNumber) {
    return NextResponse.json(
      { error: 'stopNumber query parameter is required' },
      { status: 400 },
    );
  }

  const { stop, schedule } = await getStop(stopNumber);

  if (!stop || !schedule) {
    return NextResponse.json(
      { error: 'Stop could not be found or has no departures' },
      { status: 404 },
    );
  }

  return NextResponse.json({ stop, schedule });
}
