export type Surface = 'dark' | 'light';

export function surfaceCourante(
  entrees: { surface: Surface; visible: boolean }[],
): Surface {
  const visibles = entrees.filter((e) => e.visible);
  return visibles.length > 0 ? visibles[visibles.length - 1].surface : 'light';
}
