import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

import { useStore, useThree, useFrame } from '../../packages/three-react/hooks';

var CopyShader = {
  uniforms: {
    tDiffuse: { value: null },
    opacity: { value: 1.0 },
    depthThreshold: { value: 0.5 },
  },

  vertexShader: /* glsl */ `
		varying vec2 vUv;
    varying float depth;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      depth = gl_Position.z;
		}`,

  fragmentShader: /* glsl */ `
		uniform float opacity;
		uniform float depthThreshold;
    varying float depth;

		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		void main() {

      // if (depth < 0.01) {
      //   discard;
      // }
      vec4 texel = texture2D( tDiffuse, vUv );
      gl_FragColor.rgb = 1.0 - vec3(0.2);
      gl_FragColor.a = 1.0;

		}`,
};

export const TestDepth = () => {
  const { frameCallbacks } = useStore();
  const { camera, scene, glRenderer, orbitControl } = useThree();

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
            //vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
            float depth = readDepth( tDepth, vUv );

            gl_FragColor.rgb = vec3(depth, 1.0, 1.0);
            if (depth < 0.5){
              gl_FragColor.rgb = vec3(1.0, 0.5 + depth, 1.0);
            }
            gl_FragColor.a = 1.0;
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
    const postPlane = new THREE.PlaneGeometry(2, 2);
    const postQuad = new THREE.Mesh(postPlane, postMaterial);
    pScene.add(postQuad);
    return pScene;
  }, []);

  const [material] = useState(() => {
    const material = new THREE.MeshNormalMaterial();

    return material;
  });

  const [depthScreenEffect] = useState(() => new ShaderPass(CopyShader));

  const [composer] = useState(() => {
    const composer = new EffectComposer(glRenderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    composer.addPass(depthScreenEffect);

    return composer;
  });

  useEffect(() => {
    const render = frameCallbacks.get('gl-render');
    frameCallbacks.delete('gl-render');

    if (orbitControl) {
      orbitControl.target = new THREE.Vector3(0, 0, -20);
    }

    return () => {
      render && frameCallbacks.set('gl-render', render);
    };
  }, []);

  useFrame(() => {
    glRenderer.setRenderTarget(target);
    glRenderer.render(scene, camera);

    // render post FX
    postMaterial.uniforms.tDiffuse.value = target.texture;
    postMaterial.uniforms.tDepth.value = target.depthTexture;

    glRenderer.setRenderTarget(null);
    glRenderer.render(postScene, postCamera);

    // composer.render();
  });

  return (
    <>
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
