import { FC, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ARButton } from '../../core/ARButton';
import { useAR } from '../../core/hooks';
import { Scene } from '../../core/Scene';
import { RootState } from '../../core/store';
import { ARContent } from '../ARContent';

export const ARSceneNavigator: FC = () => {
  const [storeRef] = useState<{ current: RootState | undefined }>(() => ({
    current: undefined,
  }));

  const { support, arSession, startAR } = useAR();

  const onSessionStarted = useCallback(async (session: THREE.XRSession) => {
    if (storeRef.current) {
      const { glRenderer, scene, camera, frameCallbacks } = storeRef.current;

      storeRef.current.glRenderer.xr.setReferenceSpaceType('local');
      await storeRef.current.glRenderer.xr.setSession(session);
    }
  }, []);

  return (
    <>
      <ARButton
        onStartAR={() => {
          startAR({ requiredFeatures: ['hit-test'] }, onSessionStarted);
        }}
      ></ARButton>
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
      </Scene>
    </>
  );
};
