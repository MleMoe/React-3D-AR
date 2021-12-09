import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scene } from '../../core/Scene';
import { Euler } from '../../core/tag-types';
import * as THREE from 'three';
import { Instance } from '../../core/renderer';
import { XRSession } from 'three';
import { useAR } from '../../core/hooks';
import { RootState } from '../../core/store';
// import { ARButton } from '../../core/ARButton';

function App() {
  const [threeRef] = useState<{ current: RootState | undefined }>(() => ({
    current: undefined,
  }));
  const meshRef = useRef<Instance>();
  const [rotation, setRotation] = useState<Euler>(() => ({
    x: 0,
    y: 10,
    z: 0,
  }));

  const [width, setWidth] = useState(5);
  const [color, setColor] = useState(0xff0000);

  const { support, arSession, startAR } = useAR();
  console.log('support, arSession: ', support, arSession);

  const onSessionStarted = useCallback(async (session: XRSession) => {
    if (threeRef.current?.glRenderer) {
      threeRef.current.glRenderer.xr.setReferenceSpaceType('local');
      await threeRef.current.glRenderer.xr.setSession(session);
    }
  }, []);

  useEffect(() => {
    let id = -1;
    // const timer = setInterval(() => {
    //   setRotation((prev) => ({
    //     x: prev.x + 0.1,
    //     y: prev.y + 0.1,
    //   }));
    // }, 10000);

    function animate() {
      // console.log('test: ');
      id = requestAnimationFrame(animate);
      // console.log(rotation);

      setRotation((prev) => ({
        y: (prev.y ?? 0) + 0.01,
      }));
      // setWidth((prev) => (prev + 1) % 20);
    }
    // animate();

    return () => {
      cancelAnimationFrame(id);
      // clearInterval(timer);
    };
  }, []);
  // console.log(rotation);

  useEffect(() => {
    console.log('meshRef.current: ', meshRef.current);
  }, [meshRef]);

  return (
    <>
      <Scene
        storeRef={threeRef}
        ar={true}
        camera={new THREE.PerspectiveCamera(75)}
      >
        <ambientLight args={[0xaaaaaa]} />
        <directionalLight
          args={[0xaaaaaa]}
          position={{ x: -100, y: -100, z: -100 }}
        />
        <mesh
          ref={meshRef}
          rotation={rotation}
          position={{
            x: 0,
            y: 0,
            z: -100,
          }}
          scale={{
            x: 3,
            y: 3,
            z: 3,
          }}
          geometry={new THREE.BoxGeometry(width, width, width)}
          material={
            new THREE.MeshBasicMaterial({
              color,
            })
          }
          onClick={(event) => {
            const instance = event.target as Instance;
            console.log('触发单击事件！');
            startAR({ requiredFeatures: ['hit-test'] }, onSessionStarted);

            // console.log(event);
            // setWidth((prev) => prev + 1); // ?? setWidth 顺序在 color.set 后，color.set 会失效
            // // instance.material.color.set(0x0000ff);
            // setColor(0x0000ff);

            // const { x, y, z } = instance.scale;
            // instance.scale.set(x + 1.0, y + 1.0, z + 1.0);

            // console.log(meshRef.current);
            // console.log('threeRef: ', threeRef.current);
          }}
        ></mesh>
        {/* <mesh
        rotation={rotation}
        position={{
          x: 0,
          y: 0,
          z: 0,
        }}
        geometry={new THREE.BoxGeometry(width, width, width)}
        material={
          new THREE.MeshPhongMaterial({
            color: 0x00ff00,
          })
        }
        onClick={(event) => {
          const instance = event.target as Instance;
          console.log('触发单击事件！');
          console.log(event);
          const { x, y, z } = instance.scale;
          instance.scale.set(x + 1.0, y + 1.0, z + 1.0);
        }}
      ></mesh> */}
      </Scene>
    </>
  );
}

export default App;
