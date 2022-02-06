import { FC, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { useLoader, useThree } from '../../packages/three-react/hooks';
import no_clouds from './assets/no_clouds.jpg';

export const Earth: FC = () => {
  const { orbitControl } = useThree();
  const [radius, setRadius] = useState(50);

  const { loadResults } = useLoader<TextureLoader>(
    TextureLoader,
    [no_clouds],
    (xhr) => {
      if (xhr.lengthComputable) {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        console.log(Math.round(percentComplete) + '% downloaded');
      }
    }
  );

  const material = useMemo(() => {
    if (loadResults) {
      return new THREE.MeshPhongMaterial({
        map: loadResults[0],
      });
    }
  }, [loadResults]);

  useEffect(() => {
    if (orbitControl) {
      orbitControl.target = new THREE.Vector3(0, 0, -50);
    }
  }, []);

  return material ? (
    <mesh
      position={{
        x: 0,
        y: 0,
        z: -50,
      }}
      geometry={new THREE.SphereGeometry(radius, 64, 64)}
      material={material}
      onClick={(event) => {
        console.log(event);
        setRadius((prev) => prev + 1);
      }}
    ></mesh>
  ) : null;
};
