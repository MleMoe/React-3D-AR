import { useCallback, useRef, useEffect } from 'react';
import {
  SphereBufferGeometry,
  MeshPhongMaterial,
  Group,
  Texture,
  Mesh,
} from 'three';
import { XREstimatedLight } from 'three/examples/jsm/webxr/XREstimatedLight.js';
import { useThree } from '../../packages/three-react/hooks';

export const ARLightEstimate = () => {
  const groupRef = useRef<Group>();
  const { glRenderer, scene } = useThree();

  const updateEnvironment = useCallback((envMap: Texture | null) => {
    scene.traverse((object) => {
      if (object.type === 'Mesh') {
        // @ts-ignore
        (object as Mesh).material.envMap = envMap;
      }
    });
  }, []);

  useEffect(() => {
    const xrLight = new XREstimatedLight(glRenderer);
    xrLight.addEventListener('estimationstart', () => {
      scene.add(xrLight.directionalLight);
      // if (xrLight.environment) {
      //   updateEnvironment(xrLight.environment);
      // }
    });

    xrLight.addEventListener('estimationend', () => {
      scene.remove(xrLight);
      updateEnvironment(null);
    });
  }, []);

  return (
    <group ref={groupRef}>
      {new Array(4).fill(0).map((_, index, items) => {
        return (
          <mesh
            key={index}
            geometry={new SphereBufferGeometry(0.2, 32, 32)}
            material={
              new MeshPhongMaterial({
                color: 0xdddddd,
                reflectivity: index / items.length,
              })
            }
            position={{
              x: 0,
              y: index * 0.6 - (items.length - 1) * 0.3,
              z: -5,
            }}
          ></mesh>
        );
      })}
    </group>
  );
};
