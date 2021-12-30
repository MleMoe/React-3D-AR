import { FC, useState, useCallback, useLayoutEffect } from 'react';
import {
  RingGeometry,
  MeshBasicMaterial,
  CylinderGeometry,
  MeshPhongMaterial,
  Vector3,
} from 'three';
import { HitState, useARHitTest } from '../../packages/use-webar/hooks';
import { useStore } from '../../packages/three-react/hooks';
import { Model } from '../ARContent/model';

type ReticleProps = {
  dataRef: React.MutableRefObject<HitState>;
} & Partial<HitState>;
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
      geometry={new RingGeometry(0.15, 0.2, 32)
        .rotateX(-Math.PI / 2)
        .translate(0, -0.1, 0)}
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
      geometry={new CylinderGeometry(0.1, 0.1, 0.2, 32)}
      material={new MeshPhongMaterial({ color: 0xffffff * Math.random() })}
    ></mesh>
  );
  return <group position={position}>{children}</group>;
};

export const ARHitTest = () => {
  const { hitRef } = useARHitTest();

  const { uiObserver } = useStore();

  const [placementData, setPlacementData] = useState<PlacementProps[]>([]);

  const onSelect = useCallback(() => {
    console.log('触发 select 事件!');
    if (hitRef.current.visible) {
      const position = hitRef.current.position;
      if (position) {
        console.log(position);
        setPlacementData((prev) => {
          return [...prev, { position: position }];
        });
      }
    }
  }, []);

  useLayoutEffect(() => {
    uiObserver.on('place', onSelect);
    return () => {
      uiObserver.off('place');
    };
  }, []);

  return (
    <group>
      <Reticle
        dataRef={hitRef}
        visible={hitRef.current.visible}
        position={hitRef.current.position}
      />
      {placementData.map((item, index) => (
        // <Model
        //   key={index}
        //   position={item.position}
        //   scale={{ x: 0.2, y: 0.2, z: 0.2 }}
        // ></Model>
        <Placement key={index} position={item.position}></Placement>
      ))}
    </group>
  );
};
