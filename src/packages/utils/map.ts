/**
 * map 按 key 排序
 * @param map
 * @returns
 */
export function sortMap(map: Map<string, (...paras: any) => any>) {
  return new Map(
    [...map.entries()]
      .map((kv) => {
        const k = parseFloat(kv[0].split('-')[0]);
        return [k, kv[1]] as [number, (...paras: any) => any];
      })
      .sort()
  );
}

/**
 * 遍历执行
 * @param map
 * @param paras
 */
export function travelMap(
  map: Map<string, (...paras: any[]) => any>,
  ...paras: any[]
) {
  map.forEach((callbackfn) => callbackfn(...paras));
}
