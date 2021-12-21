import { FC, useState, useLayoutEffect } from 'react';
import { useCameraAccess } from '../../packages/use-webar/hooks';
import { MeshBasicMaterial, BoxGeometry, XRSession } from 'three';
import { RootState } from '../../packages/three-react/store';

export const CameraImage: FC<{ store?: RootState }> = ({ store }) => {
  const { cameraTexture } = useCameraAccess(store);
  const [material, setMaterial] = useState(
    () => new MeshBasicMaterial({ color: 'yellow' })
  );
  useLayoutEffect(() => {
    console.log('cameraTexture: ', cameraTexture);
    setMaterial((prev) => {
      if (cameraTexture) {
        // @ts-ignore
        // prev.map = cameraTexture;
      }
      return prev;
    });
    return () => {};
  }, [cameraTexture]);

  return (
    <mesh
      geometry={new BoxGeometry(1, 1, 1)}
      material={material}
      position={{ x: 0, y: 0, z: -5 }}
    ></mesh>
  );
};
