'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';

type Stop = {
  stop_name: string;
  stop_code: string;
  global_stop_id: string;
};

type RouteInfo = {
  minutes: number[];
  route_long_name?: string | null;
  mode_name?: string | null;
};

type Schedule = Record<string, RouteInfo>;

type StopResponse = {
  stop: Stop;
  schedule: Schedule;
};

function useStopData(stopCode: string) {
  const [data, setData] = useState<StopResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/stop?stopNumber=${stopCode}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Error ${res.status}`);
        }

        const json = (await res.json()) as StopResponse;
        if (!cancelled) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stopCode]);

  return { data, loading, error };
}

const REFRESH_INTERVAL_MS = 30_000;
const BASE_CARD_WIDTH = 140;
const STACK_OVERHANG = 48;
const STACK_VISIBLE_GAP = 6;

function formatTime(minutes?: number) {
  if (minutes == null) return '--';
  if (minutes <= 0) return 'Due';
  return `${minutes} min`;
}

const SCREEN_STYLE: CSSProperties = {
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: '#000',
  color: '#f9fafb',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const HEADER_STYLE: CSSProperties = {
  background: 'rgba(2, 6, 23, 0.6)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  padding: '1rem 1.5rem',
  fontSize: '1.2rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  gap: '1rem',
  flexShrink: 0,
  backdropFilter: 'blur(12px)',
};

const PRIMARY_CARD_STYLE: CSSProperties = {
  position: 'relative',
  flex: 1,
  background: 'linear-gradient(120deg, #f8fafc, #e2e8f0)',
  color: '#111827',
  borderRadius: 28,
  padding: '1.3rem 1.5rem',
  border: '1px solid rgba(148, 163, 184, 0.45)',
  boxShadow: '0 20px 32px rgba(15,23,42,0.25)',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'space-between',
  gap: '1.2rem',
};

const STACK_CARD_BASE_STYLE: CSSProperties = {
  height: '100%',
  borderRadius: 26,
  background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
  border: '1px solid rgba(148, 163, 184, 0.45)',
  boxShadow: '0 18px 34px rgba(15, 23, 42, 0.28)',
  display: 'flex',
  alignItems: 'center',
  color: '#111827',
  fontWeight: 600,
};

export default function StopBoardPage() {
  const { stopCode } = useParams() as { stopCode: string };
  const { data, loading, error } = useStopData(stopCode);

  if (loading) {
    return (
      <Screen>
        <Loading>Loading…</Loading>
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <ErrorBox>{error || 'No data available.'}</ErrorBox>
      </Screen>
    );
  }

  const sorted = Object.entries(data.schedule).sort(
    ([, a], [, b]) => (a.minutes[0] ?? 9999) - (b.minutes[0] ?? 9999)
  );

  const stopDetails = (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span>
          Next services at <strong>{data.stop.stop_name}</strong>
        </span>
      </div>
      <span style={{ opacity: 0.8 }}>Stop {data.stop.stop_code}</span>
    </>
  );

  return (
    <Screen>
      {/* HEADER */}
      <Header>{stopDetails}</Header>

      {/* MAIN BOARD */}
      <Board>
        {sorted.map(([route, info], idx) => (
          <Row key={route} route={route} info={info} delay={idx * 0.05} />
        ))}
        <ProtoBuzzAd />
      </Board>

      {/* FOOTER */}
      <Footer mobileHeader={stopDetails}>
        Powered by Transit & Aphrx · ID {data.stop.global_stop_id}
      </Footer>
    </Screen>
  );
}

/* ============================
   STYLED COMPONENTS (INLINE)
   ============================ */

function Screen({ children }: { children: ReactNode }) {
  return (
    <main
      style={SCREEN_STYLE}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
      <GlobalStyles />
    </main>
  );
}

function Loading({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        margin: 'auto',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: '#f3f4f6',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.2)',
          borderTopColor: '#fff',
          animation: 'spin 1s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.95rem' }}>{children}</span>
    </div>
  );
}

function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        margin: 'auto',
        padding: '1.2rem 2rem',
        background:
          'linear-gradient(135deg, rgba(248, 113, 113, 0.2), rgba(248, 113, 113, 0.05))',
        color: '#fecaca',
        borderRadius: 16,
        border: '1px solid rgba(248, 113, 113, 0.3)',
        boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}

function Header({ children }: { children: ReactNode }) {
  return (
    <div className="desktop-header sticky-desktop-top" style={HEADER_STYLE}>
      {children}
    </div>
  );
}

function Board({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.5rem',
        overflow: 'auto',
      }}
    >
      {children}
    </div>
  );
}

type RowProps = {
  route: string;
  info: RouteInfo;
  style?: CSSProperties;
  delay?: number;
};

function Row({ route, info, style, delay = 0 }: RowProps) {
  const { minutes, route_long_name, mode_name } = info;
  const [next, ...rest] = minutes;
  const stack = rest.slice(0, 3);
  const routeCode = route;

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '110px',
        display: 'grid',
        gridTemplateColumns: stack.length > 0 ? 'minmax(0, 1fr) auto' : '1fr',
        columnGap: '1rem',
        alignItems: 'stretch',
        opacity: 0,
        transform: 'translateY(12px)',
        animation: 'row-rise 0.6s ease forwards',
        animationDelay: `${delay}s`,
        ...style,
      }}
    >
      <PrimaryCard hasStack={stack.length > 0}>
        <RowLeft>
          <ModeIcon mode={mode_name} />
          <RoutePill>{routeCode}</RoutePill>
          <RouteLabel name={route_long_name || routeCode} />
        </RowLeft>

        <RowRight>
          <BigTime>{formatTime(next)}</BigTime>
        </RowRight>
      </PrimaryCard>

      {stack.length > 0 && <StackWrapper times={stack} />}
    </div>
  );
}

type StackedCardProps = {
  index: number;
  time: number;
};

function StackedCard({ index, time }: StackedCardProps) {
  const baseWidth = 140;
  const overhang = 48;
  const visibleGap = 5;
  return (
    <div
      style={{
        position: 'relative',
        width: baseWidth + overhang,
        height: '100%',
        borderRadius: 26,
        background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
        border: '1px solid rgba(148, 163, 184, 0.45)',
        boxShadow: '0 18px 34px rgba(15, 23, 42, 0.28)',
        display: 'flex',
        alignItems: 'center',
        color: '#111827',
        fontWeight: 600,
        marginLeft: -(overhang - visibleGap),
        zIndex: 10 - index,
      }}
    >
      <div
        style={{
          width: baseWidth,
          marginLeft: overhang,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.35rem 0.6rem',
        }}
      >
        <span style={{ fontSize: '2rem', fontWeight: 700 }}>{formatTime(time)}</span>
      </div>
    </div>
  );
}

function PrimaryCard({
  children,
  hasStack = false,
}: {
  children: ReactNode;
  hasStack?: boolean;
}) {
  const baseWidth = 140;
  const overhang = 48;
  const visibleGap = 5;
  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        background: 'linear-gradient(120deg, #f8fafc, #e2e8f0)',
        color: '#111827',
        borderRadius: 28,
        padding: '1.3rem 1.5rem',
        border: '1px solid rgba(148, 163, 184, 0.45)',
        boxShadow: '0 20px 32px rgba(15,23,42,0.25)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        gap: '1.2rem',
        zIndex: 100,
        marginRight: hasStack ? -(overhang - visibleGap) / 2 : 0,
      }}
    >
      {children}
    </div>
  );
}

type StackWrapperProps = {
  times: number[];
};

function StackWrapper({ times }: StackWrapperProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        marginLeft: 'auto',
      }}
    >
      {times.map((time, idx) => (
        <StackedCard key={`${time}-${idx}`} index={idx} time={time} />
      ))}
    </div>
  );
}

function RowLeft({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        minWidth: 0,
        flex: 1,
      }}
    >
      {children}
    </div>
  );
}
type RouteLabelProps = {
  name: string;
};

function RouteLabel({ name }: RouteLabelProps) {
  return (
    <div
      style={{
        display: 'flex',
        minWidth: 0,
        color: '#0f172a',
        flex: 1,
        fontSize: '2rem',
        fontWeight: 700,
        whiteSpace: 'normal',
      }}
    >
      {name}
    </div>
  );
}

type ModeIconProps = {
  mode?: string | null;
};

function ModeIcon({ mode }: ModeIconProps) {
  const isBus = mode?.toLowerCase().includes('bus');
  const iconSrc = isBus ? '/bus-icon.svg' : '/bus-icon.svg';
  return (
    <Image
      src={iconSrc}
      alt={mode ?? 'route icon'}
      width={36}
      height={36}
    />
  );
}

function RoutePill({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: 90,
        minWidth: 90,
        height: '100%',
        borderRadius: 18,
        fontWeight: 700,
        fontSize: '1.8rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textTransform: 'uppercase',
        background:
          'linear-gradient(160deg, rgba(248, 113, 113, 0.95), rgba(239, 68, 68, 0.75))',
        boxShadow:
          '0 18px 30px rgba(239, 68, 68, 0.35), inset 0 0 0 1px rgba(255,255,255,0.25)',
        letterSpacing: '0.08em',
      }}
    >
      {children}
    </div>
  );
}

function RowRight({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        textAlign: 'right',
        whiteSpace: 'nowrap',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-end',
        flexShrink: 0,
        width: 'max-content',
        maxWidth: 200,
        alignSelf: 'stretch',
        height: '100%',
      }}
    >
      {children}
    </div>
  );
}

function BigTime({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {children}
    </div>
  );
}

type FooterProps = {
  children: ReactNode;
  mobileHeader: ReactNode;
};

function ProtoBuzzAd() {
  return (
    <a
      href="https://www.protobuzz.com"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        marginTop: 'auto',
        borderRadius: 24,
        padding: '1.3rem 1.5rem',
        background: 'linear-gradient(135deg, #1f2937, #374151)',
        color: '#e5e7eb',
        textDecoration: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.75rem', opacity: 0.7 }}>
          Sponsored · Protobuzz
        </span>
        <strong style={{ fontSize: '1.2rem' }}>
          Protobuzz - Smart Buzzer App for Apartments & Condos
        </strong>
        <span style={{ fontSize: '0.95rem', opacity: 0.85, lineHeight: 1.3 }}>
          With Protobuzz, users can effortlessly automate and schedule buzzer activities to grant access to visitors, deliveries, and guests right from your smartphone.
        </span>
      </div>
      <div
        style={{
          fontSize: '2rem',
          opacity: 0.9,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        ›
      </div>
    </a>
  );
}

function Footer({ children, mobileHeader }: FooterProps) {
  return (
    <div
      className="sticky-desktop-bottom footer-shell"
      style={{
        background: 'rgba(2, 6, 23, 0.7)',
        color: '#cbd5f5',
        padding: '0.75rem 1.5rem',
        fontSize: '0.85rem',
        flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div className="footer-mobile-info" style={{ display: 'none', textAlign: 'left' }}>
        {mobileHeader}
      </div>
      <div style={{ textAlign: 'right', flex: 1 }}>{children}</div>
    </div>
  );
}

function GlobalStyles() {
  return (
    <style jsx global>{`
      @keyframes aurora-move {
        0% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(-4%, -2%, 0) scale(1.1);
        }
        100% {
          transform: translate3d(3%, 2%, 0) scale(1);
        }
      }

      @keyframes row-rise {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse-glow {
        0%,
        100% {
          opacity: 0;
        }
        50% {
          opacity: 0.5;
        }
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      }

      @media (min-width: 768px) {
        .desktop-header {
          display: flex;
        }

        .footer-mobile-info {
          display: none !important;
        }

        .sticky-desktop-top {
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .sticky-desktop-bottom {
          position: sticky;
          bottom: 0;
          z-index: 20;
        }
      }

      @media (max-width: 767px) {
        .desktop-header {
          display: none;
        }

        .footer-mobile-info {
          display: block;
        }
      }
    `}</style>
  );
}
