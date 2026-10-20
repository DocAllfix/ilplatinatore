// Un'icona per sezione dell'hub, la stessa in tutto l'hub. Le sezioni stanno nel registro del CMS e il
// proprietario puo' aggiungerne: l'icona si sceglie dalla prima parola del nome, con una di riserva.

import {
  BookOpenIcon,
  DiamondIcon,
  FlagIcon,
  LightbulbIcon,
  NewspaperIcon,
  PuzzlePieceIcon,
  ScrollIcon,
  SkullIcon,
  SwordIcon,
  TrophyIcon,
} from "@phosphor-icons/react/ssr";
import type { Aiuto } from "@/lib/hub";
import { normale } from "@/lib/registro-hub";

const ICONE: Record<string, typeof TrophyIcon> = {
  trofei: TrophyIcon,
  platino: TrophyIcon,
  collezionabili: DiamondIcon,
  missioni: ScrollIcon,
  boss: SkullIcon,
  build: SwordIcon,
  armi: SwordIcon,
  enigmi: PuzzlePieceIcon,
  sfide: FlagIcon,
  novita: NewspaperIcon,
  come: LightbulbIcon,
  consigli: LightbulbIcon,
};

export function IconaAiuto({ aiuto, className }: { aiuto: Aiuto; className?: string }) {
  const I = ICONE[normale(aiuto.split(/[\s,]+/)[0])] ?? BookOpenIcon;
  return <I weight="duotone" className={className} aria-hidden="true" />;
}
