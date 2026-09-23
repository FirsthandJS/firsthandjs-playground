/**
 * What a visitor sees before they have written anything.
 *
 * Short enough to read in one go, and it uses the three things that make this
 * framework what it is: a setup that runs once, signals that the markup reads
 * directly, and a component that is a function rather than a re-render.
 */
export const WEATHER = `import { component, signal } from '@firsthandjs/dom';

/**
 * London, live from open-meteo.com. No key, no build step, no install.
 *
 * The setup below runs ONCE. Everything that updates afterwards is an
 * expression in the markup that read a signal — nothing else re-runs.
 */
const SKY: Record<number, string> = {
  0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle',
  55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Showers',
  81: 'Showers', 82: 'Violent showers', 95: 'Thunderstorm',
};

const LOOK: Record<number, string> = {
  0: '\u2600\uFE0F', 1: '\u{1F324}\uFE0F', 2: '\u26C5', 3: '\u2601\uFE0F',
  45: '\u{1F32B}\uFE0F', 48: '\u{1F32B}\uFE0F', 51: '\u{1F326}\uFE0F',
  53: '\u{1F326}\uFE0F', 55: '\u{1F327}\uFE0F', 61: '\u{1F327}\uFE0F',
  63: '\u{1F327}\uFE0F', 65: '\u{1F327}\uFE0F', 71: '\u{1F328}\uFE0F',
  73: '\u{1F328}\uFE0F', 75: '\u2744\uFE0F', 80: '\u{1F326}\uFE0F',
  81: '\u{1F326}\uFE0F', 82: '\u26C8\uFE0F', 95: '\u26C8\uFE0F',
};

type Weather = { temperature: number; wind: number; code: number };

export default component(() => {
  const weather = signal<Weather | null>(null);
  const failed = signal(false);
  const at = signal('');

  const load = async (): Promise<void> => {
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
    }
  };

  void load();

  // The whole component. Every {...} below is its own reactive scope: when
  // \`weather\` is written, only the expressions that read it are touched.
  return (
    <main>
      <h1>London</h1>

      {failed.value ? (
        <p class="muted">Could not reach the weather service.</p>
      ) : weather.value === null ? (
        <p class="muted">Looking outside…</p>
      ) : (
        <section class="card">
          <div class="look">{LOOK[weather.value.code] ?? '\u{1F30D}'}</div>
          <div>
            <div class="temp">{String(weather.value.temperature)}°C</div>
            <div class="sky">{SKY[weather.value.code] ?? 'Weather'}</div>
            <div class="muted">{String(weather.value.wind)} km/h wind</div>
          </div>
        </section>
      )}

      <button type="button" onClick={() => void load()}>Refresh</button>
      {at.value === '' ? '' : <p class="muted">Updated at {at.value}</p>}

      <style>{\`
        /* The playground hands its light/dark to this document, so a sketch
           can follow it — here, through two custom properties. */
        :root { --ink: #e8ecf8; --dim: #7d89a6; --edge: #23304d; --card: #111726; --page: #0b0f1a; --accent: #64f0d0; }
        :root[data-theme='light'] { --ink: #101626; --dim: #5d6880; --edge: #dde4f0; --card: #ffffff; --page: #f6f8fc; --accent: #0f9e84; }
        main { font: 16px/1.6 ui-sans-serif, system-ui, sans-serif; padding: 2rem; color: var(--ink); }
        h1 { font-size: 1.4rem; letter-spacing: 0.02em; margin: 0 0 1.2rem; font-weight: 600; }
        .card { display: flex; gap: 1.25rem; align-items: center; padding: 1.25rem 1.5rem;
                border: 1px solid var(--edge); border-radius: 16px; background: var(--card); max-width: 22rem; }
        .look { font-size: 3rem; line-height: 1; }
        .temp { font-size: 2.2rem; font-weight: 650; letter-spacing: -0.02em; }
        .sky { color: var(--accent); }
        .muted { color: var(--dim); font-size: 0.9rem; }
        button { margin-top: 1.25rem; padding: 0.55rem 1.1rem; border-radius: 999px; cursor: pointer;
                 border: 1px solid var(--edge); background: var(--card); color: var(--accent); font: inherit; }
        button:hover { border-color: var(--accent); }
        body { margin: 0; background: var(--page); }
      \`}</style>
    </main>
  );
});
`;
