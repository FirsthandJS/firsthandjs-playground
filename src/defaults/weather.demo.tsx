import { component, signal } from '@firsthandjs/dom';
import { createGlobalStyle, styled } from '@firsthandjs/styled';

/**
 * London, live from open-meteo.com. No key, no build step, no install.
 *
 * The setup below runs ONCE. Everything that updates afterwards is an
 * expression in the markup that read a signal — nothing else re-runs.
 *
 * The styling is `@firsthandjs/styled`: real CSS, scoped to the component it
 * belongs to, with props reaching into it. `Card` takes `$stale` and fades
 * while the next answer is on its way.
 */

const SKY: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Showers',
  81: 'Showers',
  82: 'Violent showers',
  95: 'Thunderstorm',
};

const LOOK: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 80: '🌦️', 81: '🌦️', 82: '⛈️', 95: '⛈️',
};

/**
 * The palette, as custom properties.
 *
 * The playground hands its light or dark to this document as `data-theme`, so
 * a sketch can follow it — here, by redefining six variables.
 */
const Palette = createGlobalStyle`
  :root {
    --ink: #e8ecf8;
    --dim: #7d89a6;
    --edge: #23304d;
    --card: #111726;
    --page: #0b0f1a;
    --accent: #64f0d0;
  }

  :root[data-theme='light'] {
    --ink: #101626;
    --dim: #5d6880;
    --edge: #dde4f0;
    --card: #ffffff;
    --page: #f6f8fc;
    --accent: #0f9e84;
  }

  body {
    margin: 0;
    background: var(--page);
    color: var(--ink);
    font: 16px/1.6 ui-sans-serif, system-ui, sans-serif;
  }
`;

const Main = styled.main`
  padding: 2rem;
`;

const Title = styled.h1`
  margin: 0 0 1.2rem;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

/** A prop the CSS can read. `$stale` styles, and never reaches the DOM. */
const Card = styled.section<{ $stale?: boolean }>`
  display: flex;
  gap: 1.25rem;
  align-items: center;
  max-width: 22rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--edge);
  border-radius: 16px;
  background: var(--card);
  opacity: ${(props) => (props.$stale === true ? '0.55' : '1')};
  transition: opacity 120ms ease;
`;

const Look = styled.div`
  font-size: 3rem;
  line-height: 1;
`;

const Temp = styled.div`
  font-size: 2.2rem;
  font-weight: 650;
  letter-spacing: -0.02em;
`;

const Sky = styled.div`
  color: var(--accent);
`;

const Muted = styled.p`
  margin: 0.15rem 0 0;
  color: var(--dim);
  font-size: 0.9rem;
`;

const Refresh = styled.button`
  margin-top: 1.25rem;
  padding: 0.55rem 1.1rem;
  border: 1px solid var(--edge);
  border-radius: 999px;
  background: var(--card);
  color: var(--accent);
  font: inherit;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--accent);
  }

  &:disabled {
    cursor: progress;
    opacity: 0.6;
  }
`;

type Weather = { temperature: number; wind: number; code: number };

export default component(() => {
  const weather = signal<Weather | null>(null);
  const loading = signal(true);
  const failed = signal(false);
  const at = signal('');

  const load = async (): Promise<void> => {
    loading.value = true;
    failed.value = false;
    try {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast' +
          '?latitude=51.5072&longitude=-0.1276&current=temperature_2m,wind_speed_10m,weather_code',
      );
      const body = await response.json();
      weather.value = {
        temperature: Math.round(body.current.temperature_2m),
        wind: Math.round(body.current.wind_speed_10m),
        code: body.current.weather_code,
      };
      at.value = new Date().toLocaleTimeString();
    } catch {
      failed.value = true;
    } finally {
      loading.value = false;
    }
  };

  void load();

  // Every {...} below is a reactive scope of its own: when `weather` is
  // written, only the expressions that read it are touched.
  return (
    <Main>
      <Palette />
      <Title>London</Title>

      {failed.value ? (
        <Muted>Could not reach the weather service.</Muted>
      ) : weather.value === null ? (
        <Muted>Looking outside…</Muted>
      ) : (
        <Card $stale={loading.value}>
          <Look>{LOOK[weather.value.code] ?? '🌍'}</Look>
          <div>
            <Temp>{String(weather.value.temperature)}°C</Temp>
            <Sky>{SKY[weather.value.code] ?? 'Weather'}</Sky>
            <Muted>{String(weather.value.wind)} km/h wind</Muted>
          </div>
        </Card>
      )}

      <Refresh type="button" disabled={loading.value} onClick={() => void load()}>
        {loading.value ? 'Looking…' : 'Refresh'}
      </Refresh>

      {at.value === '' ? '' : <Muted>Updated at {at.value}</Muted>}
    </Main>
  );
});
