import {
  FC,
  useState,
  useMemo,
  useLayoutEffect,
  useRef,
  useEffect,
} from 'react';
import { useCameraAccess } from '../../packages/webar/hooks';
import { RootState } from '../../packages/three-react/store';
import { useFrame, useThree } from '../../packages/three-react/hooks';
import * as THREE from 'three';

import {
  FaceMesh,
  Results,
  FACEMESH_TESSELATION,
  FACEMESH_RIGHT_EYE,
  FACEMESH_LEFT_EYE,
  FACEMESH_RIGHT_EYEBROW,
  FACEMESH_LEFT_EYEBROW,
  FACEMESH_FACE_OVAL,
  FACEMESH_LIPS,
} from '@mediapipe/face_mesh';
import { drawConnectors } from '@mediapipe/drawing_utils';

export const MPFace: FC<{ store?: RootState }> = ({ store }) => {
  const { glRenderer, camera } = useThree();
  const { cameraTextureRef } = useCameraAccess();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const numRef = useRef(false);

  const [postCamera, postMaterial, postScene] = useMemo(() => {
    const pCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const pMaterial = new THREE.ShaderMaterial({
      vertexShader: `
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
      fragmentShader: `
          #include <packing>

          varying vec2 vUv;
          uniform sampler2D tDiffuse;
          uniform sampler2D tDepth;
          uniform float cameraNear;
          uniform float cameraFar;


          float readDepth( sampler2D depthSampler, vec2 coord ) {
            float fragCoordZ = texture2D( depthSampler, coord ).x;
            float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
            return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
          }

          void main() {
            vec4 texel = texture2D( tDiffuse, vUv );

            // float depth = readDepth( tDepth, vUv );

            // if (depth < 1.1){
            //   gl_FragColor = texel;
            //   // gl_FragColor.rgb = vec3(0.01, 0.01, 0.01);
            // }
            // else {
            //   gl_FragColor.rgb = vec3(0.01, 0.01, 0.01);
            // }
            // gl_FragColor.a = 0.5;
            // gl_FragColor.rgb = vec3(0.01, 0.01, 0.01);
            gl_FragColor = texel;
          }
        `,
      uniforms: {
        cameraNear: { value: camera.near },
        cameraFar: { value: camera.far },
        tDiffuse: { value: null },
        tDepth: { value: null },
      },
    });

    const pScene = new THREE.Scene();
    const postPlane = new THREE.PlaneGeometry(2, 2);
    const postQuad = new THREE.Mesh(postPlane, pMaterial);
    pScene.add(postQuad);
    pScene.onBeforeRender = (
      renderer: THREE.WebGLRenderer,
      scene: THREE.Scene,
      camera: THREE.Camera,
      renderTarget: any
    ) => {
      // console.log(scene);
      // console.log(camera);
      // console.log(renderTarget);
    };
    pScene.onAfterRender = (
      renderer: THREE.WebGLRenderer,
      scene: THREE.Scene,
      camera: THREE.Camera
    ) => {
      // console.log('正交相机渲染完成');
    };

    return [pCamera, pMaterial, pScene];
  }, []);

  const faceMeshRef = useRef<FaceMesh>();

  useEffect(() => {
    const canvasDom = document.getElementsByClassName('overlay-canvas')?.[0];
    if (!canvasDom) {
      // console.log('没有 overlay-canvas');
      throw new Error('没有 overlay-canvas');
    }
    canvasRef.current = canvasDom as HTMLCanvasElement;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) {
      throw new Error('canvasCtx is possibly null');
    }

    const onResults = (results: Results) => {
      console.log('绘制', results.multiFaceLandmarks.length);
      canvasCtx.save();
      canvasCtx.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      // canvasCtx.drawImage(results.image, 0, 0, WIDTH, HEIGHT);

      if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
          drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
            color: '#C0C0C070',
            lineWidth: 1,
          });
          // drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {
          //   color: '#FF3030',
          // });
          // drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {
          //   color: '#FF3030',
          // });
          // drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {
          //   color: '#30FF30',
          // });
          // drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {
          //   color: '#30FF30',
          // });
          drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {
            color: '#E0E0E0',
          });
          // drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {
          //   color: '#E0E0E0',
          // });
        }
      }
      canvasCtx.restore();
    };

    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        console.log(file);
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });
    // const faceMesh = new FaceMesh({
    //   locateFile: (file) => {
    //     return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    //   },
    // });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMesh.onResults(onResults);

    faceMeshRef.current = faceMesh;
    faceMeshRef.current
      ?.send({ image: glRenderer.domElement })
      .then((value) => {
        console.log('完成', value);
      });

    return () => {};
  }, []);

  useFrame(async (t?: number, frame?: THREE.XRFrame) => {
    if (frame) {
      glRenderer.xr.enabled = false;
      postMaterial.uniforms.tDiffuse.value = cameraTextureRef.current;
      glRenderer.render(postScene, postCamera);
      if (numRef.current && faceMeshRef.current) {
        await faceMeshRef.current.send({ image: glRenderer.domElement });
      }
      numRef.current = !numRef.current;

      glRenderer.xr.enabled = true;
    }
  });

  return <></>;
};
