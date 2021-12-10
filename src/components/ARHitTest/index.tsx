import { FC, useState, useRef, useCallback, useLayoutEffect } from 'react';
import {
  RingGeometry,
  MeshBasicMaterial,
  CylinderGeometry,
  MeshPhongMaterial,
  Matrix4,
  Vector3,
  XRFrame,
  XRHitTestSource,
  XRReferenceSpace,
} from 'three';
import { useARHitTest, useFrame, useStore, useThree } from '../../core/hooks';

type ReticleData = {
  visible: boolean;
  position: Vector3;
};
type ReticleProps = {
  dataRef: React.MutableRefObject<ReticleData>;
} & Partial<ReticleData>;
const Reticle: FC<ReticleProps> = ({
  children: childrenNode,
  visible: visibleProp = false,
  position: positionProp = { x: 0, y: 0, z: 0 },
  dataRef,
}) => {
  const [visible, setVisible] = useState(
    visibleProp ?? dataRef.current.visible
  );
  const [position, setPosition] = useState(
    positionProp ?? dataRef.current.position
  );
  const children = childrenNode ?? (
    <mesh
      matrixAutoUpdate={false}
      geometry={new RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2)}
      material={new MeshBasicMaterial()}
    ></mesh>
  );

  useLayoutEffect(() => {
    const timer = setInterval(() => {
      setPosition(dataRef.current.position);
      setVisible(dataRef.current.visible);
    });
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <group visible={visible} position={position}>
      {children}
    </group>
  );
};

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

export const ARHitTest = () => {
  const reticleRef = useARHitTest();

  const { glRenderer, scene } = useThree();
  const [controller] = useState(() => glRenderer.xr.getController(0));

  const [placementData, setPlacementData] = useState<PlacementProps[]>([]);

  const onSelect = useCallback(() => {
    console.log('触发 select 事件!', reticleRef);
    if (reticleRef.current.visible) {
      const position = reticleRef.current.position;
      if (position) {
        setPlacementData((prev) => {
          return [...prev, { position: position }];
        });
      }
    }
  }, []);

  useLayoutEffect(() => {
    controller.addEventListener('select', onSelect);
    scene.add(controller);
    return () => {};
  }, []);

  return (
    <group>
      <Reticle
        dataRef={reticleRef}
        visible={reticleRef.current.visible}
        position={reticleRef.current.position}
      />
      {placementData.map((item, index) => (
        <Placement key={index} position={item.position}></Placement>
      ))}
    </group>
  );
};
