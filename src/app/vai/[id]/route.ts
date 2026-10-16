// I link brevi /?p=<id> di WordPress: oggi rimandano all'articolo con un 301. Il proxy riscrive la
// richiesta qui.

import { articoloPerId } from "@/lib/cms/wp";

export async function GET(_req: Request, ctx: RouteContext<"/vai/[id]">) {
  const { id } = await ctx.params;
  if (!/^\d{1,9}$/.test(id)) return new Response("Not found", { status: 404 });
  const dati = await articoloPerId(Number(id));
  if (!dati) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 301, headers: { Location: dati.articolo.percorso } });
}
