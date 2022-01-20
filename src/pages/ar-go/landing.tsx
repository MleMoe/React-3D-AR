import { useState, FC, useEffect, useMemo, useRef } from 'react';
import {
  Vector3,
  SphereBufferGeometry,
  MeshPhongMaterial,
  CubeTextureLoader,
  LightProbe,
  sRGBEncoding,
  MeshStandardMaterial,
  DirectionalLight,
  LineBasicMaterial,
  DoubleSide,
  MeshBasicMaterial,
  ShapeGeometry,
  Mesh,
  Object3D,
  BufferGeometry,
  Line,
  Group,
} from 'three';
import {
  useFrame,
  useLoader,
  useStore,
  useThree,
} from '../../packages/three-react/hooks';

import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Model } from '../../components/ARContent/model';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { useARManager } from '../../packages/webar/hooks';

const genCubeUrls = function (prefix: string, postfix: string) {
  return [
    prefix + 'px' + postfix,
    prefix + 'nx' + postfix,
    prefix + 'py' + postfix,
    prefix + 'ny' + postfix,
    prefix + 'pz' + postfix,
    prefix + 'nz' + postfix,
  ];
};

export const Landing: FC<{
  data?: number[];
  onSessionStart: () => void;
}> = ({ onSessionStart }) => {
  const { ar, uiObserver } = useStore();
  const { scene, orbitControl, camera } = useThree();
  const { overlay } = useARManager();
  const textGroupRef = useRef<Group>();

  const { loadResults } = useLoader<FBXLoader>(
    FBXLoader,
    '/models/BestRoom2/WhiteHart.fbx'
  );

  const { loadResults: fontResults } = useLoader<FontLoader>(
    FontLoader,
    '/fonts/helvetiker_regular.typeface.json'
  );

  const [material, matLite, matDark] = useMemo(
    () => [
      new MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.0,
        envMapIntensity: 1,
      }),
      new MeshBasicMaterial({
        color: 0x006699,
        transparent: true,
        opacity: 0.4,
        side: DoubleSide,
      }),
      new LineBasicMaterial({
        color: 0x006699,
        side: DoubleSide,
      }),
    ],
    []
  );

  const { shapes, textGeometry, xMid } = useMemo(() => {
    if (!fontResults?.length) return { xMid: 0 };

    const font = fontResults[0];
    const message = 'ARGO ->';
    const shapes = font.generateShapes(message, 0.06);

    const textGeometry = new ShapeGeometry(shapes);

    textGeometry.computeBoundingBox();
    let xMid = 0;
    if (textGeometry.boundingBox) {
      xMid =
        -0.5 *
        (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
      textGeometry.translate(xMid, 0, 0);
    }

    return { font, shapes, textGeometry, xMid };
  }, [fontResults]);

  useEffect(() => {
    if (orbitControl) {
      orbitControl.enableZoom = false;
      orbitControl.target.set(0, 0, -1);
      // orbitControl.autoRotate = true;
    }

    const directionalLight = new DirectionalLight(0xffffff, 0.2);
    directionalLight.position.set(-5, 5, -5);
    directionalLight.lookAt(0, 0, -5);
    scene.add(directionalLight);

    const lightProbe = new LightProbe();
    scene.add(lightProbe);
    console.log(scene.children);

    // camera.far = 30;
    // camera.updateMatrix();

    const urls = genCubeUrls('/textures/cube/pisa/', '.png');
    new CubeTextureLoader().load(urls, (cubeTexture) => {
      cubeTexture.encoding = sRGBEncoding;
      // scene.background = cubeTexture;
      material.envMap = cubeTexture;
      lightProbe.copy(LightProbeGenerator.fromCubeTexture(cubeTexture));
    });

    return () => {
      scene.remove(lightProbe);
      scene.remove(directionalLight);
    };
  }, []);

  useEffect(() => {
    if (loadResults) {
      //   mixerRef.current = new AnimationMixer(groupRef.current);
      //   // mixerRef.current
      //   //   .clipAction(loadResults[0].animations[Math.round(Math.random() * 11)])
      //   //   .play();
      loadResults.forEach((loadResult) => {
        loadResult.position.set(0, -0.5, -1);
        loadResult.scale.set(0.015, 0.015, 0.015);
        scene.add(loadResult);
      });
    }
  }, [loadResults]);

  useEffect(() => {
    const lineText = new Object3D();

    if (shapes?.length) {
      // make line shape ( N.B. edge view remains visible )

      const holeShapes = [];

      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];

        if (shape.holes && shape.holes.length > 0) {
          for (let j = 0; j < shape.holes.length; j++) {
            const hole = shape.holes[j];
            holeShapes.push(hole);
          }
        }
      }

      // @ts-ignore
      shapes.push.apply(shapes, holeShapes);

      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];

        const points = shape.getPoints();
        const geometry = new BufferGeometry().setFromPoints(points);

        geometry.translate(xMid, 0, 0);

        const lineMesh = new Line(geometry, matDark);
        lineText.add(lineMesh);
      }

      lineText.position.set(0, 0.3, -0.95);
      // lineText.scale.set(0.95, 0.95, 0.95);

      textGroupRef.current?.add(lineText);
    }
    return () => {
      lineText.remove(lineText);
    };
  }, [shapes]);

  useFrame(() => {
    orbitControl?.update();
  });

  return (
    <>
      <mesh
        geometry={new SphereBufferGeometry(0.12, 64, 32)}
        material={material}
        position={{
          x: 0,
          y: 0,
          z: -1,
        }}
      ></mesh>
      <group
        ref={textGroupRef}
        onClick={() => {
          ar.startAR({
            requiredFeatures: [
              'hit-test',
              'depth-sensing',
              'anchors',
              'light-estimation',
            ], //'camera-access',  'image-tracking'
            optionalFeatures: ['dom-overlay'],
            // @ts-ignore
            domOverlay: { root: overlay },
            depthSensing: {
              usagePreference: ['cpu-optimized'], // cpu-optimized
              dataFormatPreference: ['luminance-alpha'], // luminance-alpha
            },
          });
          uiObserver.emit('startSession');
          onSessionStart();
        }}
      >
        {textGeometry && matLite && (
          <mesh
            geometry={textGeometry}
            material={matLite}
            position={{
              x: 0,
              y: 0.3,
              z: -1,
            }}
          ></mesh>
        )}
      </group>
      <Model
        rotation={{ x: 0, y: -Math.PI / 4, z: 0 }}
        position={{ x: 0.15, y: -0.5, z: -1.5 }}
        scale={{ x: 0.2, y: 0.2, z: 0.2 }}
      />
    </>
  );
};
