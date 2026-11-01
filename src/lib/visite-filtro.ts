// Chi non va contato come visita (Umami, 1/11/2026). Dal 28/10 due visite su tre erano programmi che si
// presentano come un Chrome normale ed eseguono la pagina, quindi Umami (che scarta solo chi si dichiara
// bot) li contava. Le regole vengono dalle impronte viste nel suo database: tutte combinazioni che un
// browser vero non ha. Il blocco principale (Singapore e Cina) e' nel firewall di Cloudflare sul contatore.

export type Ambiente = {
  /** navigator.webdriver: vero quando il browser e' guidato da un programma (Playwright, Selenium...) */
  webdriver: boolean;
  userAgent: string;
  /** navigator.maxTouchPoints: ogni telefono vero ne ha almeno uno */
  toccoMax: number;
  larghezza: number;
  altezza: number;
};

// 1280x1200 e 1600x1600 non sono monitor in commercio (2.451 sessioni, tutte da Singapore e Cina);
// 800x600 e' la finestra predefinita dei browser automatici
const SCHERMI_FINTI = new Set(["1280x1200", "1600x1600", "800x600"]);
const TELEFONO = /Android.+Mobile|iPhone|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i;

export function eUnProgramma(a: Ambiente): boolean {
  if (a.webdriver) return true;
  if (SCHERMI_FINTI.has(`${a.larghezza}x${a.altezza}`)) return true;
  const telefono = TELEFONO.test(a.userAgent);
  // telefono simulato su un computer: senza tocco, o con uno schermo da 1920x1080
  if (telefono && a.toccoMax === 0) return true;
  if (telefono && Math.min(a.larghezza, a.altezza) >= 1000) return true;
  // 375x812 e' lo schermo di un iPhone: un Android cosi' e' un'emulazione (317 sessioni, nessuna con segni umani)
  if (/Android/i.test(a.userAgent) && a.larghezza === 375 && a.altezza === 812) return true;
  return false;
}
