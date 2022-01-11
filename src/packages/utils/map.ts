/**
 * map 按 key 排序
 * @param map
 * @returns
 */
export function sortMap(map: Map<number, (...paras: any) => any>) {
  return new Map([...map.entries()].sort());
}

/**
 * 遍历执行
 * @param map
 * @param paras
 */
export function travelMap(
  map: Map<number, (...paras: any[]) => any>,
  ...paras: any[]
) {
  map.forEach((callbackfn) => callbackfn(...paras));
}
