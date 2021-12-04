import React, { useState, useEffect } from 'react';
import { ARScene } from '../../core/ARScene';
import { Euler } from '../../core/tag-types';
import * as THREE from 'three';

function App() {
  const [rotation, setRotation] = useState<Euler>(() => ({
    x: 0,
    y: 10,
    z: 0,
  }));

  const [width, setWidth] = useState(5);

  const [size, setSize] = useState(() => [15, 15, 15]);

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

  return (
    <ARScene>
      {/* <perspectiveCamera args={[75, 1, 0.1, 1000]} /> */}
      <ambientLight args={[0xaaaaaa]} />
      <directionalLight
        args={[0xaaaaaa]}
        position={{ x: -100, y: -100, z: -100 }}
      />

      <mesh
        rotation={rotation}
        position={{
          x: 20,
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
      ></mesh>
      <mesh
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
      ></mesh>
    </ARScene>
  );
}

export default App;
