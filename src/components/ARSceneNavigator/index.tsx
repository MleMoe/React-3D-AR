import { FC, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { ARButton } from '../../core/ARButton';
import { useAR } from '../../core/hooks';
import { Instance } from '../../core/renderer';
import { Scene, ThreeRefObj } from '../../core/Scene';
import { Euler } from '../../core/tag-types';

export const ARSceneNavigator: FC = () => {
  const [threeRef] = useState<{ current: ThreeRefObj | undefined }>(() => ({
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
    if (threeRef.current) {
      const { glRenderer, scene, camera } = threeRef.current;

      threeRef.current.glRenderer.xr.setReferenceSpaceType('local');
      await threeRef.current.glRenderer.xr.setSession(session);
      // const outerEle = threeRef.current.glRenderer.domElement.parentElement;
      // if (outerEle) {
      //   threeRef.current.interactionManager.setOuterElement(outerEle);
      // }
      // console.log('outer: ', outerEle);
      function animate() {
        // console.log('test: ');
        // id = requestAnimationFrame(animate);
        // console.log(rotation);
        glRenderer.render(scene, camera);

        setRotation((prev) => ({
          y: (prev.y ?? 0) + 0.01,
        }));
        // setWidth((prev) => (prev + 1) % 20);
      }
      // animate();
      console.log('设置循环');

      glRenderer.setAnimationLoop(animate);
    }
  }, []);

  // useEffect(() => {
  //   // let id = -1;
  //   // const timer = setInterval(() => {
  //   //   setRotation((prev) => ({
  //   //     x: prev.x + 0.1,
  //   //     y: prev.y + 0.1,
  //   //   }));
  //   // }, 10000);
  //   if (threeRef.current) {
  //   }

  //   return () => {
  //     // cancelAnimationFrame(id);
  //     // clearInterval(timer);
  //   };
  // }, []);

  return (
    <>
      <ARButton
        onStartAR={() => {
          startAR({ requiredFeatures: ['hit-test'] }, onSessionStarted);
        }}
      ></ARButton>
      <Scene
        threeRef={threeRef}
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
