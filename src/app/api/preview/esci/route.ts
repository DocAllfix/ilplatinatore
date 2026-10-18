// Esce dall'anteprima delle bozze: spegne la modalita' bozza e torna all'indirizzo da cui si e' usciti.

import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(req: Request) {
  (await draftMode()).disable();
  const verso = new URL(req.url).searchParams.get("verso") ?? "/";
  redirect(verso.startsWith("/") && !verso.startsWith("//") ? verso : "/");
}
