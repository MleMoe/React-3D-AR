import React, { useState, useEffect } from 'react';
import { ARScene } from '../../core/ARScene';
import '../../core/tag-types';

function App() {
  const [rotation, setRotation] = useState({
    // x: 3,
    y: 10,
  });

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
        // x: prev.x + 0.01,
        y: prev.y + 0.01,
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
      <mesh rotation={rotation}>
        <boxGeometry args={size} />
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
