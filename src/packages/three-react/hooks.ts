import { useContext, useState, useLayoutEffect } from 'react';
import { context, RootState } from './store';

import { FrameCallback } from './loop';
import { getUuid } from './utils';

export function useStore(rootStore?: RootState) {
  const store = useContext(context)?.getState();
  if (rootStore) return rootStore;

  return store;
}

export function useThree(rootStore?: RootState) {
  const store = useStore(rootStore);
  const [three] = useState(() => {
    const { glRenderer, scene, camera } = store;
    return { glRenderer, scene, camera };
  });
  return three;
}

export function useFrame(callback: FrameCallback, rootStore?: RootState) {
  const store = useStore(rootStore);
  useLayoutEffect(() => {
    const { frameCallbacks } = store;
    const callbackId = getUuid();

    frameCallbacks.set(callbackId, callback);
    return () => {
      frameCallbacks.delete(callbackId);
    };
  }, []);
}
