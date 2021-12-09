import { useContext, useState, useLayoutEffect, useCallback } from 'react';
import { context } from './store';
import { XRSessionInit, WebGLRenderer, XRSession, XRSessionMode } from 'three';

export interface XRSystem extends EventTarget {
  isSessionSupported: (sessionMode: XRSessionMode) => Promise<boolean>;
  requestSession: (
    sessionMode: XRSessionMode,
    sessionInit?: any
  ) => Promise<XRSession>;
}

export function useStore() {
  const store = useContext(context).getState();
  if (!store)
    throw `请在 scene 的 child 组件使用，若不是，请使用 Scene 的 storeRef`;
  return store;
}

export function useFrame(callback: () => void) {
  const store = useContext(context).getState();
  useLayoutEffect(() => {
    const { frameCallbacks } = store;
    frameCallbacks.push(callback);
  }, []);
}

export function useAR() {
  const [xr] = useState(() => {
    if ('xr' in navigator) {
      return (navigator as any).xr as XRSystem;
    }
  });
  const [support, setSupport] = useState<boolean>();
  const [arSession, setArSession] = useState<XRSession>();
  useLayoutEffect(() => {
    xr?.isSessionSupported('immersive-ar').then((isSupport) => {
      setSupport(isSupport);
    });
  }, []);

  const startAR = useCallback(
    (
      sessionInit: XRSessionInit,
      onSessionStarted: (session: XRSession) => Promise<void>
    ) => {
      if (!xr || !support) {
        return { support: false };
      }
      xr.requestSession('immersive-ar', sessionInit).then((session) => {
        setArSession(session);
        onSessionStarted(session);
      });
    },
    [xr, support]
  );
  return {
    support,
    arSession,
    startAR,
  };
}
