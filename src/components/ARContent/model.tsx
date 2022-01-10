import { FC, Suspense, useEffect, useState, useRef, useCallback } from 'react';

import { useFrame, useLoader } from '../../packages/three-react/hooks';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Group, Clock, AnimationMixer } from 'three';
import { GroupProps } from '../../packages/three-react/tag-types';

type ModelProps = Partial<GroupProps>;
export const Model: FC<ModelProps> = (props) => {
  const groupRef = useRef<Group>(null!);
  const [clock] = useState(() => new Clock());
  const mixerRef = useRef<AnimationMixer>();
  const { loadResults } = useLoader(
    GLTFLoader,
    '/models/sunflower/sunflower.gltf',
    (xhr) => {
      if (xhr.lengthComputable) {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        console.log(Math.round(percentComplete) + '% downloaded');
      }
    }
  );

  useEffect(() => {
    if (loadResults) {
      groupRef.current.add(loadResults[0].scene);
      mixerRef.current = new AnimationMixer(groupRef.current);
      // mixerRef.current
      //   .clipAction(loadResults[0].animations[Math.round(Math.random() * 11)])
      //   .play();
    }
  }, [loadResults]);

  const animation = useCallback(() => {
    // mixerRef.current?.update(clock.getDelta());
  }, [clock]);

  useFrame(animation);

  return (
    <Suspense fallback={null}>
      <group
        ref={groupRef}
        // position={{
        //   x: 0,
        //   y: 0,
        //   z: -10,
        // }}
        {...props}
      />
    </Suspense>
  );
};
