import { FC, useState, useCallback, useMemo } from 'react';
import { useCameraAccess } from '../../packages/use-webar/hooks';
import { MeshBasicMaterial, BoxGeometry } from 'three';
import { RootState } from '../../packages/three-react/store';
import { useFrame, useThree } from '../../packages/three-react/hooks';
import * as THREE from 'three';

export const CameraImage: FC<{ store?: RootState }> = ({ store }) => {
  const { glRenderer } = useThree();
  const { cameraTextureRef } = useCameraAccess();
  const [material, setMaterial] = useState(() => new MeshBasicMaterial());
  const [rotation, setRotation] = useState(() => ({ x: 0, y: 0, z: 0 }));
  const [position, setPosition] = useState(() => ({ x: 0, y: 0, z: -5 }));

  const forceTextureInitialization = useCallback(
    (texture: THREE.Texture) => {
      material.map = texture;
    },
    [material]
  );

  const texProps = useMemo(() => {
    const texture = new THREE.Texture();
    forceTextureInitialization(texture);
    return glRenderer.properties.get(texture);
  }, [forceTextureInitialization]);

  useFrame(() => {
    texProps.__webglTexture = cameraTextureRef.current;
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
