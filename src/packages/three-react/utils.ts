import { v4 as uuidv4 } from 'uuid';

/**
 * 生成一个 v4-uuid
 */
export function getUuid() {
  return uuidv4();
}

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
