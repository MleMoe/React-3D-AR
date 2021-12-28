import {} from 'react';
import * as THREE from 'three';
import { useThree } from '../../packages/three-react/hooks';
import { useDepthSensing } from '../../packages/use-webar/hooks';

export const Depth = () => {
  const { depthInfoRef } = useDepthSensing();
  const { camera } = useThree();

  return (
    <>
      <cameraHelper args={[camera]} />
    </>
  );
};
