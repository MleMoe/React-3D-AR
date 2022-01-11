import { FC, useMemo } from 'react';
import { useCameraAccess } from '../../packages/webar/hooks';
import { RootState } from '../../packages/three-react/store';
import { useFrame, useThree } from '../../packages/three-react/hooks';
import * as THREE from 'three';

export const CameraScreen: FC<{ store?: RootState }> = ({ store }) => {
  const { glRenderer, camera, scene } = useThree();
  const { cameraTextureRef } = useCameraAccess();

  const postCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    []
  );

  const postMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
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
      }),
    []
  );

  const postScene = useMemo(() => {
    const pScene = new THREE.Scene();
    const postPlane = new THREE.PlaneGeometry(1, 1);
    const postQuad = new THREE.Mesh(postPlane, postMaterial);
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
    return pScene;
  }, []);

  useFrame((t?: number, frame?: THREE.XRFrame) => {
    if (frame) {
      glRenderer.xr.enabled = false;

      postMaterial.uniforms.tDiffuse.value = cameraTextureRef.current;
      glRenderer.render(postScene, postCamera);
      glRenderer.xr.enabled = true;
    }
  });

  return <></>;
};
