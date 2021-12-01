// import React from 'react';
// import { ARButton } from '../../components/ARButton';

// // import './three';

// export function ThreeApp() {
//   // return <>three</>;
//   return <ARButton />;
// }

/* eslint react/jsx-no-undef:0 */
import React, { useState, useEffect } from 'react';
import { ARScene } from '../../core/ARScene';
import '../../core/tag-types';

const width = 300;
const height = 300;

function App() {
  const [rotation, setRotation] = useState({
    x: 0,
    y: 0,
  });
  useEffect(() => {
    let id = -1;
    function animate() {
      // console.log('test: ');
      id = requestAnimationFrame(animate);
      // console.log(rotation);

      setRotation((prev) => ({
        x: prev.x + 0.01,
        y: prev.y + 0.01,
      }));
    }
    animate();
    return () => {
      cancelAnimationFrame(id);
    };
  }, []);
  // console.log(rotation);

  return (
    <ARScene>
      <mesh rotation={rotation}>
        <boxGeometry args={[5, 5, 5]} />
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
