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
} from 'three';
import {
  HitState,
  useARHitTest,
  useDepthOcclusionMaterial,
} from '../../packages/use-webar/hooks';
import { useFrame, useStore } from '../../packages/three-react/hooks';
import { Model } from '../ARContent/model';
import { getUuid } from '../../packages/three-react/utils';

export const ARHitTest: FC = ({ children }) => {
  const { uiObserver, scene, glRenderer } = useStore();
  const { hitRef, onAfterGetHitStateRef } = useARHitTest();

  const reticleRef = useRef<Mesh>();
  const placementNodeRef = useRef<Group>(null!);
  const placementNodes = useMemo<{ anchor: XRAnchor; anchoredNode: Group }[]>(
    () => [],
    []
  );

  const dMaterial = useDepthOcclusionMaterial();

  const onSelect = useCallback(() => {
    console.log('触发 select 事件!');
    if (
      hitRef.current.visible &&
      hitRef.current.position &&
      hitRef.current.hitTestResult
    ) {
      const node: Group = !placementNodeRef.current.visible
        ? placementNodeRef.current
        : placementNodeRef.current.clone();

      // @ts-ignore
      hitRef.current.hitTestResult.createAnchor?.().then((anchor) => {
        node.position.set(
          hitRef.current.position.x,
          hitRef.current.position.y,
          hitRef.current.position.z
        );

        placementNodes.push({
          anchor,
          anchoredNode: node,
        });
        if (node.visible) {
          scene.add(node);
        }
        node.visible = true;
      });
    }
  }, []);

  useLayoutEffect(() => {
    uiObserver.on('place', onSelect);
    scene.overrideMaterial = dMaterial;
    const key = getUuid();
    onAfterGetHitStateRef.current.set(key, (hit: HitState) => {
      if (reticleRef.current && hit.position) {
        reticleRef.current.visible = hit.visible;

        reticleRef.current.position.set(
          hit.position.x,
          hit.position.y,
          hit.position.z
        );
      }
    });
    return () => {
      uiObserver.off('place');
      onAfterGetHitStateRef.current.delete(key);
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
        geometry={new RingGeometry(0.05, 0.06, 32)
          .rotateX(-Math.PI / 2)
          .translate(0, -0.06, 0)}
        material={new MeshBasicMaterial()}
      ></mesh>
      <group visible={false} ref={placementNodeRef}>
        {/* <Model></Model> */}

        {children ?? (
          <mesh
            geometry={new CylinderGeometry(0.05, 0.05, 0.1, 32)}
            material={
              new MeshPhongMaterial({ color: 0xffffff * Math.random() })
            }
          ></mesh>
        )}
      </group>
    </group>
  );
};
