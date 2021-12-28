import { Scene } from '../../packages/three-react/Scene';
import * as THREE from 'three';
import { useState, useRef, useEffect } from 'react';
import { Histogram } from '../../components/visualization/histogram';
import { Pie } from '../../components/visualization/pie';
import { Earth } from '../../components/visualization/earth';

function App() {
  const [camera] = useState(() => {
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      2000
    );
    camera.position.set(0, 100, 300);
    return camera;
  });
  const gridRef = useRef<THREE.GridHelper>(null!);

  return (
    <Scene ar={false} camera={camera} control={true}>
      <ambientLight args={[0x333333]} />
      <directionalLight
        args={[0xffffff, 0.25]}
        position={new THREE.Vector3(
          100 * Math.random() - 0.5,
          100 * Math.random() - 0.5,
          100 * Math.random() - 0.5
        ).normalize()}
      />
      <pointLight
        args={[0xffffff, 0.15]}
        position={new THREE.Vector3(-100, 100)}
      ></pointLight>
      {/* <Histogram /> */}
      {/* <Pie /> */}
      <Earth />
      <gridHelper
        ref={gridRef}
        args={[1000, 40, 0x303030, 0x303030]}
        // position={{ x: 0, y: -75, z: 0 }}
      />
    </Scene>
  );
}

export default App;