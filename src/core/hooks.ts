import { useContext } from 'react';
import { context } from './store';

export function useStore() {
  const store = useContext(context);
  if (!store) throw `请在 scene 的 child 组件使用`;
  return store;
}
