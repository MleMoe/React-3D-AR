import { FC, Suspense, useEffect, useState, useRef, useCallback } from 'react';

import { useFrame, useLoader } from '../../packages/three-react/hooks';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Group, Clock, AnimationMixer, Mesh } from 'three';
import { GroupProps } from '../../packages/three-react/tag-types';
import { useARManager } from '../../packages/webar/hooks';
import { ARManager } from '../../packages/webar/manager';

type ModelProps = Partial<GroupProps>;
export const Model: FC<ModelProps> = (props) => {
  const { depthRawTexture } = useARManager();
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
      console.log(loadResults[0]);
      groupRef.current.add(loadResults[0].scene);

      //   mixerRef.current = new AnimationMixer(groupRef.current);
      //   // mixerRef.current
      //   //   .clipAction(loadResults[0].animations[Math.round(Math.random() * 11)])
      //   //   .play();

      loadResults.forEach((loadResult) => {
        const object = loadResult.scene;
        object.traverse((child) => {
          if (child instanceof Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = ARManager.transformARMaterial(
              child.material,
              depthRawTexture
            );
          }
        });
      });
    }
  }, [loadResults]);

  const animation = useCallback(() => {
    // mixerRef.current?.update(clock.getDelta());
  }, [clock]);

  useFrame(animation);

  return (
    <Suspense fallback={null}>
      <group ref={groupRef} {...props}></group>
    </Suspense>
  );
};
