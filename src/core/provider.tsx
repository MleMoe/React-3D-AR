import { UseBoundStore } from 'zustand';
import { RootState, context } from './store';

export function Provider({
  store,
  element,
}: {
  store: UseBoundStore<RootState>;
  element: React.ReactNode;
}) {
  return <context.Provider value={store}>{element}</context.Provider>;
}
