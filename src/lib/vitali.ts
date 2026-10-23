// Velocita' misurata sui visitatori veri (ok del proprietario, 23/10/2026): LCP, CLS, INP, FCP, TTFB
// di ogni pagina, mandati a GA4 come eventi con lo stesso nome della misura. GA4 parte solo dopo il
// consenso (src/components/pubblicita-script.tsx): fino ad allora le misure restano qui in coda e si
// spediscono quando GA4 si accende; senza consenso non lascia la pagina niente.
// Formato degli eventi come nella guida di Google (web-vitals con gtag): `value` = variazione, CLS
// moltiplicato per 1000 (GA4 vuole interi).

export type Vitale = { name: string; value: number; delta: number; id: string; rating?: string };

const MISURE = new Set(["LCP", "CLS", "INP", "FCP", "TTFB"]);
const coda: Vitale[] = [];
// acceso solo da svuotaVitali, cioe' quando parte il NOSTRO GA4: il banner di HB crea una sua
// `window.gtag` prima del consenso, quindi la sua esistenza non vuol dire niente
let acceso = false;

declare global {
  interface Window {
    gtag?: (...a: unknown[]) => void;
  }
}

function spedisci(m: Vitale) {
  window.gtag?.("event", m.name, {
    value: Math.round(m.name === "CLS" ? m.delta * 1000 : m.delta),
    metric_id: m.id,
    metric_value: m.value,
    metric_delta: m.delta,
    metric_rating: m.rating,
    page_path: window.location.pathname,
    non_interaction: true,
  });
}

/** Una misura appena pronta: a GA4 se e' gia' acceso, altrimenti in coda. */
export function registraVitale(m: Vitale): void {
  if (!MISURE.has(m.name)) return;
  if (acceso) spedisci(m);
  else coda.push(m);
}

/** GA4 si e' acceso (consenso dato): parte la coda, e da qui in poi si spedisce subito. */
export function svuotaVitali(): void {
  acceso = true;
  while (coda.length) spedisci(coda.shift()!);
}
