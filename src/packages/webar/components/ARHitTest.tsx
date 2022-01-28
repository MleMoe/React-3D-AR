import {
  FC,
  useCallback,
  useLayoutEffect,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import {
  RingGeometry,
  MeshBasicMaterial,
  CylinderGeometry,
  MeshPhongMaterial,
  Vector3,
  Mesh,
  XRAnchor,
  Group,
  XRFrame,
  Matrix4,
  SphereBufferGeometry,
} from 'three';
import { useARManager } from '../hooks';
import { useFrame, useLoader, useStore } from '../../three-react/hooks';
import { Model } from '../../../components/ARContent/model';
import { getUuid } from '../../three-react/utils';
import { HitState } from '../manager';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const ARHitTest: FC = ({ children }) => {
  const { uiObserver, scene, glRenderer } = useStore();
  const { hitState, onAfterHitTest, depthRawTexture, transformARMaterial } =
    useARManager();

  const reticleRef = useRef<Mesh>();
  const placementNodeRef = useRef<Group>(null!);
  const placementBunnyRef = useRef<Group>(null!);
  const placementRobotRef = useRef<Group>(null!);
  const placementCylinderRef = useRef<Group>(null!);
  const placementSphereRef = useRef<Group>(null!);

  const selectTypeMap = useMemo(
    () => ({
      sunflower: placementNodeRef,
      cylinder: placementCylinderRef,
      bunny: placementBunnyRef,
      robot: placementRobotRef,
      sphere: placementSphereRef,
    }),
    []
  );

  const placementNodes = useMemo<{ anchor: XRAnchor; anchoredNode: Group }[]>(
    () => [],
    []
  );

  const dMaterial = useMemo(
    () =>
      transformARMaterial(
        new MeshPhongMaterial({ color: 0x0000ff }),
        depthRawTexture
      ),
    []
  );

  const onSelect = useCallback(
    (type: 'sphere' | 'cylinder' | 'sunflower' | 'bunny' | 'robot') => {
      console.log('select!');

      if (hitState && hitState.position) {
        const position = hitState.position;
        const node: Group = !selectTypeMap[type].current.visible
          ? selectTypeMap[type].current
          : selectTypeMap[type].current.clone();
        //@ts-ignore
        hitState.hitTestResult?.createAnchor?.().then((anchor) => {
          node.position.set(position.x, position.y, position.z);
          node.rotation.setFromQuaternion(hitState.rotation);

          placementNodes.push({
            anchor,
            anchoredNode: node,
          });
          node.visible = true;

          if (node.visible) {
            scene.add(node);
          }
        });
      }
    },
    []
  );

  useLayoutEffect(() => {
    uiObserver.on('sunflower', () => onSelect('sunflower'));
    uiObserver.on('cylinder', () => onSelect('cylinder'));
    uiObserver.on('bunny', () => onSelect('bunny'));
    uiObserver.on('robot', () => onSelect('robot'));
    uiObserver.on('sphere', () => onSelect('sphere'));

    // scene.overrideMaterial = dMaterial;

    const key = getUuid();
    onAfterHitTest.set(0, (hit: HitState) => {
      if (reticleRef.current && hit.position) {
        reticleRef.current.visible = hit.visible;

        reticleRef.current.position.set(
          hit.position.x,
          hit.position.y,
          hit.position.z
        );
        reticleRef.current.rotation.setFromQuaternion(hit.rotation);
      }
    });

    return () => {
      uiObserver.off('sunflower');
      uiObserver.off('cylinder');
      uiObserver.off('bunny');
      uiObserver.off('robot');
      uiObserver.off('sphere');

      onAfterHitTest.delete(0);
      placementNodes.forEach((anchorObj) =>
        anchorObj.anchoredNode.removeFromParent()
      );
    };
  }, []);

  useFrame((t?: number, frame?: XRFrame) => {
    if (!frame) {
      return;
    }
    for (const { anchor, anchoredNode } of placementNodes) {
      if (!frame.trackedAnchors?.has(anchor)) {
        console.log('没有该追踪目标');
        console.log(frame.trackedAnchors, '\n', anchor);
        continue;
      }
      const refSpace = glRenderer.xr.getReferenceSpace();
      if (refSpace) {
        const anchorPose = frame.getPose(anchor.anchorSpace, refSpace);
        if (anchorPose) {
          const position = new Vector3(0, 0, 0).applyMatrix4(
            new Matrix4().fromArray(anchorPose.transform.matrix)
          );
          anchoredNode.position.set(position.x, position.y, position.z);
        }
      }
    }
  });

  const { loadResults } = useLoader<GLTFLoader>(
    GLTFLoader,
    '/models/RobotExpressive.glb'
  );

  useEffect(() => {
    if (loadResults) {
      //   mixerRef.current = new AnimationMixer(groupRef.current);
      //   // mixerRef.current
      //   //   .clipAction(loadResults[0].animations[Math.round(Math.random() * 11)])
      //   //   .play();
      loadResults.forEach((loadResult) => {
        placementBunnyRef.current.add(loadResult.scene);
        placementRobotRef.current.add(loadResult.scene.clone());

        loadResults.forEach((loadResult) => {
          const object = loadResult.scene;
          object.traverse((child) => {
            if (child instanceof Mesh) {
              // child.castShadow = true;
              // child.receiveShadow = true;
              child.material = transformARMaterial(
                child.material,
                depthRawTexture
              );
            }
          });
        });
      });
    }
  }, [loadResults]);

  return (
    <group>
      <mesh
        ref={reticleRef}
        visible={false}
        geometry={new RingGeometry(0.03, 0.035, 32)
          .rotateX(-Math.PI / 2)
          .translate(0, 0.03, 0)}
        material={dMaterial}
      ></mesh>
      <group>
        {new Array(1).fill(0).map((_, index, items) => {
          return (
            <mesh
              key={index}
              geometry={new SphereBufferGeometry(0.5, 32, 32)}
              material={
                new MeshPhongMaterial({
                  color: 0xdddddd,
                  reflectivity: 3 / 4,
                })
              }
              position={{
                x: 0,
                y: 3 * 0.6 - (4 - 1) * 0.3,
                z: -5,
              }}
            ></mesh>
          );
        })}
      </group>
      <group
        visible={false}
        ref={placementNodeRef}
        scale={{ x: 0.5, y: 0.5, z: 0.5 }}
      >
        <Model></Model>
      </group>
      <group visible={false} ref={placementCylinderRef}>
        <mesh
          geometry={new CylinderGeometry(0.05, 0.05, 0.1, 32)}
          material={dMaterial}
        ></mesh>
      </group>
      <group visible={false} ref={placementSphereRef}>
        <mesh
          geometry={new SphereBufferGeometry(0.05, 32, 32)}
          material={dMaterial}
        ></mesh>
      </group>
      <group
        visible={false}
        ref={placementBunnyRef}
        scale={{ x: 0.05, y: 0.05, z: 0.05 }}
      ></group>
      <group
        visible={false}
        ref={placementRobotRef}
        scale={{ x: 0.05, y: 0.05, z: 0.05 }}
      ></group>
    </group>
  );
};
