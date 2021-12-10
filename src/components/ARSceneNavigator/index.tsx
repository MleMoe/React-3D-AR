import { FC, useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { ARButton } from '../../core/ARButton';
import { useAR } from '../../core/hooks';
import { Scene } from '../../core/Scene';
import { RootState } from '../../core/store';
import { ARContent } from '../ARContent';
import { ARHitTest } from '../ARHitTest';

export const ARSceneNavigator: FC = () => {
  const [storeRef] = useState<{ current: RootState | undefined }>(() => ({
    current: undefined,
  }));
  const overlayRef = useRef<HTMLDivElement>(null!);

  const { support, arSession, startAR, endAR } = useAR();

  const onSessionStarted = useCallback(async (session: THREE.XRSession) => {
    if (storeRef.current) {
      storeRef.current.glRenderer.xr.setReferenceSpaceType('local');
      await storeRef.current.glRenderer.xr.setSession(session);

      const { interactionManager, glRenderer } = storeRef.current;
      const { setCamera, setResponseDom } = interactionManager;
      setCamera(
        glRenderer.xr.getCamera(new THREE.Camera()) as THREE.PerspectiveCamera
      );
      setResponseDom(overlayRef.current);
    }
  }, []);

  return (
    <>
      <div ref={overlayRef} id='overlay'>
        <ARButton
          onStartAR={() => {
            startAR(
              {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
                // @ts-ignore
                domOverlay: { root: overlayRef.current },
              },
              onSessionStarted
            );
          }}
          onEndAR={endAR}
        ></ARButton>
      </div>
      <Scene
        storeRef={storeRef}
        ar={true}
        camera={new THREE.PerspectiveCamera(75)}
      >
        <ambientLight args={[0xaaaaaa]} />
        <directionalLight
          args={[0xaaaaaa]}
          position={{ x: -100, y: -100, z: -100 }}
        />
        <ARContent />
        <ARHitTest />
      </Scene>
    </>
  );
};
