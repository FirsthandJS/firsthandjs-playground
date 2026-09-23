import { component, provide } from '@firsthandjs/dom';
import {
  createData,
  createFetchClient,
  DataContext,
  tag,
  useInvalidate,
  useResource,
} from '@firsthandjs/data';
import { createGlobalStyle, styled } from '@firsthandjs/styled';

/**
 * London, live from open-meteo.com. No key, no build step, no install.
 *
 * Three things worth watching.
 *
 * **The setup runs once.** Everything that updates afterwards is an expression
 * in the markup that read a signal — nothing else re-runs.
 *
 * **The data is a resource.** `useResource` owns the request: it tracks
 * loading, keeps the previous answer on screen while the next one is fetched,
 * aborts what nobody is waiting for any more, and is reloaded by name —
 * `invalidate(tag('weather'))` — rather than by calling something again.
 *
 * **The styling is CSS.** `@firsthandjs/styled` scopes it to the component it
 * belongs to, and props reach into it: `Card` takes `$stale` and fades while
 * the next answer is on its way.
 */

/** Configured once. A base URL, and answers cached for half a minute. */
const api = createFetchClient({
  baseUrl: 'https://api.open-meteo.com/v1/',
  cache: { ttl: 30_000 },
});

const FORECAST =
  'forecast?latitude=51.5072&longitude=-0.1276&current=temperature_2m,wind_speed_10m,weather_code';

type Forecast = {
  current: { temperature_2m: number; wind_speed_10m: number; weather_code: number };
};

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
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌧️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '🌨️',
  73: '🌨️',
  75: '❄️',
  80: '🌦️',
  81: '🌦️',
  82: '⛈️',
  95: '⛈️',
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

const Weather = component(() => {
  const forecast = useResource(({ request, tags }) => {
    // What this resource is about. Anything that invalidates `weather`
    // reloads it, without knowing that this component exists.
    tags(tag('weather', { city: 'london' }));
    return api.get<Forecast>(FORECAST)(request);
  });

  const invalidate = useInvalidate();
  const reload = (): void => {
    // By name, not by reference: this reaches every resource tagged
    // `weather`, and through the client's cache, which would otherwise answer
    // a reload with the answer being reloaded.
    void invalidate(tag('weather'));
  };

  return () => {
    const now = forecast.data.value?.current;

    return (
      <Main>
        <Palette />
        <Title>London</Title>

        {forecast.status.value === 'error' ? (
          <Muted>Could not reach the weather service.</Muted>
        ) : now === undefined ? (
          <Muted>Looking outside…</Muted>
        ) : (
          // `loading` is true while the next answer is on its way, with the
          // previous one still on screen — which `status` alone cannot say.
          <Card $stale={forecast.loading.value}>
            <Look>{LOOK[now.weather_code] ?? '🌍'}</Look>
            <div>
              <Temp>{String(Math.round(now.temperature_2m))}°C</Temp>
              <Sky>{SKY[now.weather_code] ?? 'Weather'}</Sky>
              <Muted>{String(Math.round(now.wind_speed_10m))} km/h wind</Muted>
            </div>
          </Card>
        )}

        <Refresh type="button" disabled={forecast.loading.value} onClick={reload}>
          {forecast.loading.value ? 'Looking…' : 'Refresh'}
        </Refresh>
      </Main>
    );
  };
});

/**
 * The store lives above whatever uses it.
 *
 * It holds the resources and matches invalidations against their tags. An
 * application provides it once, at the root; here that root is this file.
 */
export default component(() => {
  provide(DataContext, createData());
  return <Weather />;
});
