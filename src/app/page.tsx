'use client';

import React, { useState } from 'react';

type Stop = {
  city_name: string;
  global_stop_id: string;
  location_type: number;
  match_strength: number;
  parent_station: string | null;
  parent_station_global_stop_id: string | null;
  raw_stop_id: string;
  route_type: number;
  rt_stop_id: string;
  stop_code: string;
  stop_lat: number;
  stop_lon: number;
  stop_name: string;
  wheelchair_boarding: number;
};

type Schedule = Record<string, number[]>;

type StopResponse = {
  stop: Stop;
  schedule: Schedule;
};

export default function StopPage() {
  const [stopNumber, setStopNumber] = useState('');
  const [data, setData] = useState<StopResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stopNumber.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/stop?stopNumber=${encodeURIComponent(stopNumber)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }
      const json = (await res.json()) as StopResponse;
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format coordinates
  const formatCoord = (value: number) => value.toFixed(6);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        padding: '2rem 1rem',
        backgroundColor: '#0f172a', // slate-900-ish
        color: '#e5e7eb', // gray-200
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 700,
          backgroundColor: '#020617', // slate-950-ish
          borderRadius: 16,
          padding: '1.75rem',
          boxShadow: '0 20px 35px rgba(0,0,0,0.6)',
          border: '1px solid rgba(148,163,184,0.25)',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          TTC Stop Lookup
        </h1>
        <p style={{ marginBottom: '1.5rem', color: '#9ca3af', fontSize: '0.95rem' }}>
          Enter a stop number to see the upcoming departures grouped by route.
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <input
            type="text"
            value={stopNumber}
            onChange={(e) => setStopNumber(e.target.value)}
            placeholder="e.g. 1234"
            style={{
              flex: 1,
              padding: '0.6rem 0.75rem',
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.5)',
              backgroundColor: '#020617',
              color: '#e5e7eb',
              outline: 'none',
              fontSize: '0.95rem',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 999,
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              background:
                'linear-gradient(135deg, rgba(56,189,248,1), rgba(129,140,248,1))',
              color: '#020617',
              fontWeight: 600,
              fontSize: '0.95rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Loading…' : 'Search'}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 0.9rem',
              borderRadius: 8,
              backgroundColor: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.4)',
              color: '#fecaca',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Result */}
        {data && (
          <div
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Stop info card */}
            <section
              style={{
                padding: '1.1rem 1rem',
                borderRadius: 12,
                background:
                  'radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 60%), #020617',
                border: '1px solid rgba(148,163,184,0.4)',
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#6b7280',
                    marginBottom: '0.2rem',
                  }}
                >
                  Stop
                </div>
                <h2
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}
                >
                  {data.stop.stop_name}
                </h2>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                  color: '#9ca3af',
                }}
              >
                <span
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: 999,
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(148,163,184,0.35)',
                  }}
                >
                  Stop code: <strong>{data.stop.stop_code}</strong>
                </span>
                <span
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: 999,
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(148,163,184,0.35)',
                  }}
                >
                  ID: <strong>{data.stop.global_stop_id}</strong>
                </span>
                <span
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: 999,
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(148,163,184,0.35)',
                  }}
                >
                  Lat: {formatCoord(data.stop.stop_lat)} · Lon:{' '}
                  {formatCoord(data.stop.stop_lon)}
                </span>
                {data.stop.wheelchair_boarding === 1 && (
                  <span
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: 999,
                      backgroundColor: 'rgba(22,163,74,0.15)',
                      border: '1px solid rgba(34,197,94,0.4)',
                      color: '#bbf7d0',
                    }}
                  >
                    ♿ Accessible
                  </span>
                )}
              </div>
            </section>

            {/* Schedule list */}
            <section>
              <div
                style={{
                  fontSize: '0.8rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#6b7280',
                  marginBottom: '0.5rem',
                }}
              >
                Upcoming departures (next 60 minutes)
              </div>

              {Object.keys(data.schedule).length === 0 ? (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 10,
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(148,163,184,0.3)',
                    fontSize: '0.9rem',
                    color: '#9ca3af',
                  }}
                >
                  No departures found in the next hour.
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  {Object.entries(data.schedule).map(([route, minutes]) => (
                    <div
                      key={route}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 0.9rem',
                        borderRadius: 10,
                        backgroundColor: 'rgba(15,23,42,0.9)',
                        border: '1px solid rgba(148,163,184,0.35)',
                        gap: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 40,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 999,
                            background:
                              'radial-gradient(circle at top left, rgba(56,189,248,0.3), rgba(79,70,229,0.2))',
                            color: '#020617',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                          }}
                        >
                          {route}
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.85rem',
                              color: '#e5e7eb',
                              fontWeight: 500,
                            }}
                          >
                            Next buses
                          </span>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              color: '#9ca3af',
                            }}
                          >
                            {minutes.length} departure
                            {minutes.length !== 1 ? 's' : ''} in the next hour
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.35rem',
                          justifyContent: 'flex-end',
                        }}
                      >
                        {minutes.map((m, idx) => (
                          <span
                            key={`${route}-${idx}`}
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: 999,
                              fontSize: '0.8rem',
                              backgroundColor: '#020617',
                              border: '1px solid rgba(148,163,184,0.4)',
                              color: '#e5e7eb',
                            }}
                          >
                            {m} min
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Optional hint when nothing loaded */}
        {!data && !error && !loading && (
          <div
            style={{
              marginTop: '0.75rem',
              fontSize: '0.85rem',
              color: '#6b7280',
            }}
          >
            Try something like <code>1234</code> once your API is wired up.
          </div>
        )}
      </div>
    </main>
  );
}
