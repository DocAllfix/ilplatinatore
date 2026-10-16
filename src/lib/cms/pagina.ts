// Lettura del numero di pagina dagli indirizzi /page/N/: solo cifre, da 2 in su.
// /page/1/ e numeri strani non sono pagine: WordPress rimanda /page/1/ alla prima.

export function numeroPagina(n: string): number | null {
  if (!/^\d{1,4}$/.test(n)) return null;
  const v = Number(n);
  return v >= 1 ? v : null;
}
