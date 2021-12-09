import { FC, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { ARButton } from '../../core/ARButton';
import { useAR } from '../../core/hooks';
import { Instance } from '../../core/renderer';
import { Scene } from '../../core/Scene';
import { RootState } from '../../core/store';
import { Euler } from '../../core/tag-types';

export const ARSceneNavigator: FC = () => {
  const [storeRef] = useState<{ current: RootState | undefined }>(() => ({
    current: undefined,
  }));

  const [rotation, setRotation] = useState<Euler>(() => ({
    x: 0,
    y: 10,
    z: 0,
  }));

  const [width, setWidth] = useState(10);
  const [color, setColor] = useState(0xff0000);

  const { support, arSession, startAR } = useAR();

  const onSessionStarted = useCallback(async (session: THREE.XRSession) => {
    if (storeRef.current) {
      const { glRenderer, scene, camera, frameCallbacks } = storeRef.current;

      storeRef.current.glRenderer.xr.setReferenceSpaceType('local');
      await storeRef.current.glRenderer.xr.setSession(session);

      function animate() {
        setRotation((prev) => ({
          y: (prev.y ?? 0) + 0.01,
        }));
        // setWidth((prev) => (prev + 1) % 20);
      }
      frameCallbacks.push(animate);
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

        <mesh
          rotation={rotation}
          position={{
            x: 0,
            y: 0,
            z: -50,
          }}
          geometry={new THREE.BoxGeometry(width, width, width)}
          material={
            new THREE.MeshPhongMaterial({
              color,
            })
          }
          onClick={(event) => {
            const instance = event.target as Instance;
            console.log('触发单击事件！');
            setWidth((prev) => prev + 1);
            // startAR({ requiredFeatures: ['hit-test'] }, onSessionStarted);
          }}
        ></mesh>
      </Scene>
    </>
  );
};
