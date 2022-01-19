import { FC, useCallback, useLayoutEffect, useRef, useMemo } from 'react';
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
import { useARManager } from '../../packages/webar/hooks';
import { useFrame, useStore } from '../../packages/three-react/hooks';
import { Model } from '../ARContent/model';
import { getUuid } from '../../packages/three-react/utils';
import { HitState } from '../../packages/webar/manager';

export const ARHitTest: FC = ({ children }) => {
  const { uiObserver, scene, glRenderer } = useStore();
  const { hitState, onAfterHitTest, depthRawTexture, transformARMaterial } =
    useARManager();

  const reticleRef = useRef<Mesh>();
  const placementNodeRef = useRef<Group>(null!);
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

  const onSelect = useCallback(() => {
    console.log('select!');

    if (hitState && hitState.position) {
      const position = hitState.position;
      const node: Group = !placementNodeRef.current.visible
        ? placementNodeRef.current
        : placementNodeRef.current.clone();
      //@ts-ignore
      hitState.hitTestResult?.createAnchor?.().then((anchor) => {
        node.position.set(position.x, position.y, position.z);

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
  }, []);

  useLayoutEffect(() => {
    uiObserver.on('place', onSelect);
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
      uiObserver.off('place');
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

  return (
    <group>
      <mesh
        ref={reticleRef}
        visible={false}
        geometry={new RingGeometry(0.03, 0.035, 32).rotateX(-Math.PI / 2)}
        material={dMaterial}
      ></mesh>
      <group>
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
      <group
        visible={false}
        ref={placementNodeRef}
        scale={{ x: 0.5, y: 0.5, z: 0.5 }}
      >
        <Model></Model>

        {/* {children ?? (
          <mesh
            geometry={new CylinderGeometry(0.05, 0.05, 0.1, 32)}
            material={
              new MeshPhongMaterial({ color: 0xffffff * Math.random() })
            }
          ></mesh>
        )} */}
      </group>
    </group>
  );
};
