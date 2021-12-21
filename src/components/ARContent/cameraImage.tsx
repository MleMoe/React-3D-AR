import { FC, useState, useLayoutEffect, useCallback } from 'react';
import { useCameraAccess } from '../../packages/use-webar/hooks';
import { MeshBasicMaterial, BoxGeometry } from 'three';
import { RootState } from '../../packages/three-react/store';
import { useFrame, useThree } from '../../packages/three-react/hooks';
import * as THREE from 'three';

export const CameraImage: FC<{ store?: RootState }> = ({ store }) => {
  const { glRenderer } = useThree();
  const { cameraTexture } = useCameraAccess();
  const [material, setMaterial] = useState(
    () => new MeshBasicMaterial({ color: 'white', opacity: 0.75 })
  );
  const [rotation, setRotation] = useState(() => ({ x: 0, y: 0, z: 0 }));
  const [position, setPosition] = useState(() => ({ x: 0, y: 0, z: -5 }));

  const forceTextureInitialization = useCallback(
    (texture: THREE.Texture) => {
      material.map = texture;
    },
    [material]
  );

  useLayoutEffect(() => {
    const texture = new THREE.Texture();
    forceTextureInitialization(texture);
    const texProps = glRenderer.properties.get(texture);
    texProps.__webglTexture = cameraTexture;

    return () => {
      texture.dispose();
    };
  }, [cameraTexture]);

  useFrame(() => {
    setRotation((prev) => ({
      ...prev,
      y: prev.y + 0.03,
    }));
  });

  return (
    <mesh
      geometry={new BoxGeometry(1, 1, 1)}
      material={material}
      position={position}
      rotation={rotation}
    ></mesh>
  );
};
