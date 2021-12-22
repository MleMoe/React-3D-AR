import { useState, FC } from 'react';
import { Vector3 } from 'three';
import * as THREE from 'three';

const computePositions = (items: number[]) => {
  const radius = 40;
  let angle = 0;

  return items.reduce((result, item) => {
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    angle += (Math.PI * 2) / items.length;
    result.push(new Vector3(x, item / 2, z));
    return result;
  }, new Array<Vector3>());
};

export const Histogram: FC<{ data?: number[] }> = ({
  data = [10, 20, 30, 40, 50, 60, 70],
}) => {
  const [positions] = useState(() => computePositions(data));

  return (
    <group>
      {data.map((item, index) => (
        <mesh
          key={index}
          geometry={new THREE.CylinderGeometry(5, 5, item, 32, 32)}
          material={new THREE.MeshNormalMaterial()}
          position={positions[index]}
        ></mesh>
      ))}
    </group>
  );
};
