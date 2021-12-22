import { useState, FC } from 'react';
import { ExtrudeGeometryOptions } from 'three';
import * as THREE from 'three';

const drawShape = (
  startAngle: number,
  endAngle: number,
  radius: number = 50
) => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, 0);
  shape.moveTo(0, 0);
  shape.arc(0, 0, radius, endAngle, startAngle, true);

  return shape;
};

const options: ExtrudeGeometryOptions = {
  depth: 10,
  bevelThickness: 1,
  bevelSize: 0.5,
  curveSegments: 12,
  steps: 1,
};

let startAngle = 0,
  endAngle = 0;

export const Pie: FC<{ data?: number[]; radius?: number }> = ({
  data = [10, 20, 30, 40, 50, 60, 70],
  radius = 50,
}) => {
  const [sum] = useState(() => data.reduce((s, value) => s + value, 0));
  const [geos] = useState(() =>
    data.map((value) => {
      endAngle += (value / sum) * Math.PI * 2;
      const circle = drawShape(startAngle, endAngle - 0.1, radius);
      startAngle = endAngle;

      return new THREE.ExtrudeGeometry(circle, options);
    })
  );

  return (
    <group
      position={{ x: 0, y: radius, z: 0 }}
      rotation={{ x: -Math.PI / 6, y: 0, z: 0 }}
    >
      {data.map((_, index) => (
        <mesh
          key={index}
          geometry={geos[index]}
          material={new THREE.MeshNormalMaterial()}
        ></mesh>
      ))}
    </group>
  );
};
