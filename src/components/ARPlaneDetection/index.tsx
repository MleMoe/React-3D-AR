import { FC, useState, useCallback, useLayoutEffect } from 'react';
import {
  RingGeometry,
  MeshBasicMaterial,
  Vector3,
  CylinderGeometry,
  MeshPhongMaterial,
  PlaneGeometry,
  DoubleSide,
} from 'three';
import { PlaneState, useARPlaneDetection } from '../../packages/webar/hooks';
import { useThree } from '../../packages/three-react/hooks';

type PlaneProps = {
  dataRef: React.MutableRefObject<PlaneState[]>;
};

const Planes: FC<PlaneProps> = ({ dataRef }) => {
  const [planes, setPlanes] = useState(dataRef.current || []);

  useLayoutEffect(() => {
    const timer = setInterval(() => {
      setPlanes(dataRef.current);
    });
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      {planes?.map((plane, index) => {
        return (
          <group key={index} position={plane.position}>
            {plane.polygon?.map((vertex, vIndex) => {
              return (
                <mesh
                  key={vIndex}
                  quaternion={vertex}
                  geometry={new CylinderGeometry(0.01, 0.01, 0.005, 12)}
                  material={
                    new MeshPhongMaterial({
                      color: 0xffffff * ((index + 1) / (planes.length + 2)),
                    })
                  }
                ></mesh>
              );
            })}
          </group>
        );
      })}
    </>
  );
};

export const ARPlaneDetetion = () => {
  const { planePosesRef } = useARPlaneDetection();

  const { glRenderer, scene } = useThree();
  const [controller] = useState(() => {
    return glRenderer.xr.getController(0);
  });

  const [planes, setPlanes] = useState(planePosesRef.current || []);

  useLayoutEffect(() => {
    const timer = setInterval(() => {
      planePosesRef.current && setPlanes(planePosesRef.current);
    });
    return () => {
      clearInterval(timer);
    };
  }, []);

  const onSelect = useCallback((event) => {
    console.log('触发 select 事件!');
    // console.log(planesRef.current);
    console.log(planePosesRef.current);
    // planePosesRef.current.map((item) => {
    //   console.log(item.position, item.polygon);
    // });
  }, []);

  useLayoutEffect(() => {
    controller.addEventListener('select', onSelect);
    scene.add(controller);
    return () => {
      controller.removeEventListener('select', onSelect);
      scene.remove(controller);
    };
  }, []);
  // return <></>;
  return (
    <>
      {planes.map((plane, index) => (
        <mesh
          key={index}
          position={plane.position}
          rotation={{
            x: 0,
            y: Math.PI / 2,
            z: 0,
          }}
          geometry={new PlaneGeometry(1, 1)}
          material={
            new MeshBasicMaterial({
              color: 0xffff00,
              side: DoubleSide,
            })
          }
        ></mesh>
      ))}
    </>
  );
};
