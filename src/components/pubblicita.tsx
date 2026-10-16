// Spazio pubblicitario con altezza RISERVATA (niente salti di pagina, CLS < 0,1). Gli annunci di
// HB Agency arrivano in Fase 5; per ora il segnaposto mostra dove e quanto spazio occupano.

const ALTEZZE = {
  // Header Banner / Mobile Leaderboard: 320x100 da telefono, 970x250 da computer
  banner: "min-h-[100px] md:min-h-[250px]",
} as const;

export function SpazioPubblicitario({ formato = "banner" }: { formato?: keyof typeof ALTEZZE }) {
  return (
    <aside
      aria-label="Pubblicità"
      className={`my-6 flex items-center justify-center rounded-lg border border-dashed border-linea text-xs uppercase tracking-[0.04em] text-tenue ${ALTEZZE[formato]}`}
    >
      Pubblicità
    </aside>
  );
}
