/** Переключает наличие типизированного id в списке без мутации исходного массива. */
export function toggleIdInList<TId extends string>(
  ids: readonly TId[],
  id: TId,
): TId[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}
