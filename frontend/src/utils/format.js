export function formatarMtbf(horas) {
  const totalMinutos = Math.round(horas * 60);
  if (totalMinutos < 60) return `${totalMinutos}min`;

  const h = Math.floor(totalMinutos / 60);
  const min = totalMinutos % 60;
  if (h < 24) return min > 0 ? `${h}h${min}min` : `${h}h`;

  const dias = Math.floor(h / 24);
  const hRestante = h % 24;
  return hRestante > 0 ? `${dias}d ${hRestante}h` : `${dias}d`;
}
