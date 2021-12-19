import {
  FC,
  Suspense,
  useLayoutEffect,
  useState,
  useRef,
  useCallback,
} from 'react';

import { useFrame } from '../../packages/three-react/hooks';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Group, Clock, AnimationMixer } from 'three';
import { GroupProps } from '../../packages/three-react/tag-types';

type ModelProps = Partial<GroupProps>;
export const Model: FC<ModelProps> = (props) => {
  const groupRef = useRef<Group>(null!);
  const [model, setModel] = useState<GLTF>();
  const [clock] = useState(() => new Clock());
  const mixerRef = useRef<AnimationMixer>();

  useLayoutEffect(() => {
    const loader = new GLTFLoader();
    console.log('开始加载');
    loader.load(
      '/models/RobotExpressive.glb',
      function (gltf: GLTF) {
        setModel(gltf);
        groupRef.current.add(gltf.scene);
        mixerRef.current = new AnimationMixer(groupRef.current);
        mixerRef.current.clipAction(gltf.animations[0]).play();
      },
      function onProgress(xhr) {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          console.log(Math.round(percentComplete) + '% downloaded');
        }
      },
      function (e) {
        console.error(e);
      }
    );
    return () => {};
  }, []);

  const animation = useCallback(() => {
    mixerRef.current?.update(clock.getDelta());
  }, [clock]);

  useFrame(animation);

  return (
    <Suspense fallback={null}>
      <group
        ref={groupRef}
        position={{
          x: 0,
          y: 0,
          z: -10,
        }}
        {...props}
      />
    </Suspense>
  );
};
