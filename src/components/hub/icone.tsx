// Un'icona per tipo di aiuto, la stessa in tutto l'hub.

import { DiamondIcon, LightbulbIcon, ScrollIcon, SkullIcon, SwordIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import type { Aiuto } from "@/lib/hub";

const ICONE = {
  "Platino e trofei": TrophyIcon,
  Collezionabili: DiamondIcon,
  Missioni: ScrollIcon,
  Boss: SkullIcon,
  "Armi e potenziamenti": SwordIcon,
  "Meccaniche e consigli": LightbulbIcon,
} satisfies Record<Aiuto, unknown>;

export function IconaAiuto({ aiuto, className }: { aiuto: Aiuto; className?: string }) {
  const I = ICONE[aiuto];
  return <I weight="duotone" className={className} aria-hidden="true" />;
}
