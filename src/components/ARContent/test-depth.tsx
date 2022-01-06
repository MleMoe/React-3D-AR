import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Mesh } from 'three';
import { Camera, XRFrame, WebGLProperties } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

import { useStore, useThree, useFrame } from '../../packages/three-react/hooks';

export const TestDepth = () => {
  const { frameCallbacks } = useStore();
  const { camera, scene, glRenderer, orbitControl } = useThree();
  const gl = useMemo(() => glRenderer.getContext(), []);

  const [target] = useState(() => {
    const target = new THREE.WebGLRenderTarget(
      glRenderer.domElement.width,
      glRenderer.domElement.height
    );
    target.texture.format = THREE.RGBFormat;
    target.texture.minFilter = THREE.NearestFilter;
    target.texture.magFilter = THREE.NearestFilter;
    target.texture.generateMipmaps = false;
    target.stencilBuffer = true;
    target.depthBuffer = true;
    target.depthTexture = new THREE.DepthTexture(
      glRenderer.domElement.width,
      glRenderer.domElement.height
    );
    return target;
  });

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

            float depth = readDepth( tDepth, vUv );

            if (depth < 1.1){
              gl_FragColor = texel;
              // gl_FragColor.rgb = vec3(0.01, 0.01, 0.01);
            }
            else {
              gl_FragColor.rgb = vec3(0.01, 0.01, 0.01);
            }
            gl_FragColor.a = 0.5;
            gl_FragColor.rgb = vec3(0.01, 0.01, 0.01);
            // gl_FragColor = texel;
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

  const [material] = useState(() => {
    const material = new THREE.MeshNormalMaterial();

    return material;
  });

  useEffect(() => {
    const render = frameCallbacks.get('gl-render');
    frameCallbacks.delete('gl-render');

    scene.onBeforeRender = (
      renderer: THREE.WebGLRenderer,
      scene: THREE.Scene,
      camera: THREE.Camera,
      renderTarget: any
    ) => {
      // 设置了 RenderTarget 就无法正常渲染
      // renderer.setRenderTarget(target);
      // const textureProperties = glRenderer.properties.get(target.texture);
      // gl.framebufferTexture2D(
      //   gl.FRAMEBUFFER,
      //   gl.COLOR_ATTACHMENT0,
      //   gl.TEXTURE_2D,
      //   textureProperties.__webglTexture,
      //   0
      // );
      // gl.framebufferTexture2D(
      //   gl.FRAMEBUFFER,
      //   gl.DEPTH_ATTACHMENT,
      //   gl.TEXTURE_2D,
      //   target.depthTexture,
      //   0
      // );
    };

    scene.onAfterRender = (
      renderer: THREE.WebGLRenderer,
      scene: THREE.Scene,
      camera: THREE.Camera
    ) => {
      // 设置了 RenderTarget 就无法正常渲染
    };

    if (orbitControl) {
      orbitControl.target = new THREE.Vector3(0, 0, -20);
    }

    return () => {
      render && frameCallbacks.set('gl-render', render);
    };
  }, []);

  useFrame((t?: number, frame?: XRFrame) => {
    // glRenderer.setRenderTarget(target);

    // new THREE.ArrayCamera().cameras;
    // const arrayCameras: THREE.ArrayCamera = glRenderer.xr.getCamera(
    //   new Camera()
    // ) as THREE.ArrayCamera;

    // glRenderer.render(scene, arrayCameras.cameras[0]);
    if (frame) {
      glRenderer.xr.enabled = false;
      // @ts-ignore
      // glRenderer.xr.updateCamera(camera);
      // // @ts-ignore
      // const vrCamera = glRenderer.xr.getCamera(); // use XR camera for rendering
      // glRenderer.setRenderTarget(target);
      // glRenderer.render(scene, vrCamera);

      // glRenderer.setRenderTarget(null);
      postMaterial.uniforms.tDiffuse.value = target.texture;
      postMaterial.uniforms.tDepth.value = target.depthTexture;
      glRenderer.render(postScene, postCamera);
      glRenderer.xr.enabled = true;
    }

    // frame &&
    //   frame.session.renderState.baseLayer &&
    //   gl.bindFramebuffer(
    //     gl.FRAMEBUFFER,
    //     frame.session.renderState.baseLayer?.framebuffer
    //   );

    // if (frame) {
    //   // glRenderer.setRenderTarget(target);
    //   // const arrayCameras: THREE.ArrayCamera = glRenderer.xr.getCamera(
    //   //   new Camera()
    //   // ) as THREE.ArrayCamera;
    //   // if (arrayCameras.cameras[0]) {
    //   // glRenderer.render(scene, camera);
    //   // console.log(glRenderer.getRenderTarget());
    //   glRenderer.xr.enabled = false;

    //   // frame.session.renderState.baseLayer?.framebuffer;

    //   postMaterial.uniforms.tDiffuse.value = target.texture;
    //   postMaterial.uniforms.tDepth.value = target.depthTexture;

    //   // glRenderer.setRenderTarget(null);
    //   glRenderer.render(postScene, postCamera);
    //   // // }
    //   glRenderer.xr.enabled = true;
    // }
  });

  return (
    <>
      <mesh
        position={{
          x: 0,
          y: 0,
          z: -15,
        }}
        geometry={new THREE.BoxGeometry(3, 3, 3)}
        material={material}
      ></mesh>
      {new Array(10).fill(0).map((_, index) => {
        return (
          <mesh
            key={index}
            position={{
              x: 2 * (index - 5),
              y: 0,
              z: 3 * (index - 15),
            }}
            geometry={new THREE.BoxGeometry()}
            material={material}
          ></mesh>
        );
      })}
    </>
  );
};
