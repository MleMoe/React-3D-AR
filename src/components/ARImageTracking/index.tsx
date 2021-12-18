import { FC, useState, useCallback, useLayoutEffect } from 'react';
import { Matrix4 } from 'three';
import { useARImageTracking } from '../../packages/use-webar/hooks';

import { CylinderGeometry, MeshPhongMaterial, Vector3 } from 'three';
import { useThree } from '../../packages/three-react/hooks';

type PlacementProps = {
  position: Vector3;
};
const Placement: FC<PlacementProps> = ({
  children: childrenNode,
  position = { x: 0, y: 0, z: 0 },
}) => {
  const children = childrenNode ?? (
    <mesh
      geometry={new CylinderGeometry(0.1, 0.1, 0.2, 32).translate(0, 0.1, 0)}
      material={new MeshPhongMaterial({ color: 0xffffff * Math.random() })}
    ></mesh>
  );
  return <group position={position}>{children}</group>;
};

type ARImageTrackingProps = {
  imgBitmap: ImageBitmap;
};
export const ARImageTracking: FC<ARImageTrackingProps> = ({ imgBitmap }) => {
  const { imgPoseRef } = useARImageTracking();

  const { glRenderer, scene } = useThree();
  const [controller] = useState(() => {
    return glRenderer.xr.getController(0);
  });

  const [position, setPosition] = useState<Vector3>(() => new Vector3());

  const onSelect = useCallback((event) => {
    console.log('触发 select 事件!');
    if (imgPoseRef.current) {
      setPosition(
        new Vector3(0, 0, 0).applyMatrix4(
          new Matrix4().fromArray(imgPoseRef.current.transform.matrix)
        )
      );
    }
  }, []);

  useLayoutEffect(() => {
    controller.addEventListener('select', onSelect);
    scene.add(controller);
    return () => {
      controller.removeEventListener('select', onSelect);
      scene.remove(controller);
    };
  }, []);

  return (
    <group>
      <Placement position={position}></Placement>
    </group>
  );
};
