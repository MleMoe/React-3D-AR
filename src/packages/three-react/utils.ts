export function isEqual(a: any, b: any) {
  // 除了两者引用类型都可以判断
  if (!(a instanceof Object) || !(b instanceof Object)) {
    return Object.is(a, b);
  }
  if (Object.keys(a).length !== Object.keys(b).length) {
    return false;
  }

  const keysA = Object.keys(a);
  let result = true;
  for (const key of keysA) {
    result &&= isEqual(a[key], b[key]);
    if (!result) {
      return false;
    }
  }
  return true;
}
