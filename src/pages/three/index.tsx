import React, { useState, useEffect, useRef } from 'react';
import { Scene } from '../../core/Scene';
import { Euler } from '../../core/tag-types';
import * as THREE from 'three';
import { Instance } from '../../core/renderer';
import { ARButton } from '../../core/ARButton';

function App() {
  const meshRef = useRef<Instance>();
  const [rotation, setRotation] = useState<Euler>(() => ({
    x: 0,
    y: 10,
    z: 0,
  }));

  const [width, setWidth] = useState(5);

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
        ar={{
          active: true,
        }}
      >
        <perspectiveCamera args={[75, 1, 0.1, 1000]} />
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
            z: 0,
          }}
          scale={{
            x: 3,
            y: 3,
            z: 3,
          }}
          geometry={new THREE.BoxGeometry(width, width, width)}
          material={
            new THREE.MeshBasicMaterial({
              color: 0xff0000,
            })
          }
          onClick={(event) => {
            const instance = event.target as Instance;
            console.log('触发单击事件！');
            console.log(event);
            instance.material.color.set(0x0000ff);
            const { x, y, z } = instance.scale;
            instance.scale.set(x + 1.0, y + 1.0, z + 1.0);

            // console.log(meshRef.current);
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
