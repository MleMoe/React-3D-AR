import { useEffect } from 'react';
import { UseBoundStore } from 'zustand';
import { RootState, context } from './store';

export function Provider({
  store,
  element,
}: {
  store: UseBoundStore<RootState>;
  element: React.ReactNode;
}) {
  // useEffect(() => {
  //   const state = store.getState();
  //   // Flag the canvas active, rendering will now begin
  //   // state.set((state) => ({ active: true } ));
  //   // Connect events
  //   // state.events.connect?.(target);
  //   // Notifiy that init is completed, the scene graph exists, but nothing has yet rendered
  //   if (onCreated) onCreated(state);
  // }, []);
  return <context.Provider value={store}>{element}</context.Provider>;
}
