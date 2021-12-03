import React, { useState, useEffect } from 'react';
import { ARScene } from '../../core/ARScene';
import { Euler } from '../../core/tag-types';

function App() {
  const [rotation, setRotation] = useState<Euler>(() => ({
    x: 0,
    y: 10,
    z: 0,
  }));

  const [size, setSize] = useState(() => [5, 5, 5]);

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
      <mesh
        rotation={rotation}
        position={{
          x: -20,
          y: 0,
          z: 0,
        }}
        scale={{
          x: 2,
          y: 2,
          z: 2,
        }}
      >
        <boxGeometry args={[15, 15, 15]} />
        <meshBasicMaterial
          args={[
            {
              color: 0xff0000,
            },
          ]}
        />
      </mesh>
      <mesh
        rotation={rotation}
        position={{
          x: 50,
          y: 0,
          z: 0,
        }}
      >
        <boxGeometry args={[20, 20, 20]} />
        <meshBasicMaterial
          args={[
            {
              color: 0x00ff00,
            },
          ]}
        />
      </mesh>
    </ARScene>
  );
}

export default App;
