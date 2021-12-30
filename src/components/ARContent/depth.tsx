import { useEffect, useCallback, useState, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader';
import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader';

import { useStore, useThree, useFrame } from '../../packages/three-react/hooks';
import {
  XRCPUDepthInformation,
  useDepthSensing,
} from '../../packages/use-webar/hooks';
import { Euler } from '../../packages/three-react/tag-types';

export function depthInfoToTexture(
  depthInfo: XRCPUDepthInformation,
  glRenderer: THREE.WebGLRenderer
) {
  const gl = glRenderer.getContext();
  const depthTexture = gl.createTexture();

  // gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Supply the data buffer after converting it to Uint8Array - the
  // gl.texImage2D expects Uint8Array when using gl.UNSIGNED_BYTE type.
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE_ALPHA,
    depthInfo.width,
    depthInfo.height,
    0,
    gl.LUMINANCE_ALPHA,
    gl.UNSIGNED_BYTE,
    new Uint8Array(depthInfo.data)
  );

  console.log(depthTexture);

  return depthTexture;
}

const DepthScreenShader = {
  uniforms: {
    texture_depth_sensing: { value: null },
    matrix_depth_sensing_uv: { value: new THREE.Matrix4() },
    depth_raw_to_meters: { value: 0.0 },
    tDiffuse: { value: null },
  },

  vertexShader: /* glsl */ `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `

    // uniform vec4 uScreenSize;

    uniform sampler2D texture_depth_sensing;
    uniform mat4 matrix_depth_sensing_uv;
    uniform float depth_raw_to_meters;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

    void depthSensingOcclude() {
      vec2 screenSpace = gl_FragCoord.xy;

      vec2 texCoord = (matrix_depth_sensing_uv * vec4(screenSpace.x, 1.0 - screenSpace.y, 0.0, 1.0)).xy;
      
      vec2 packedDepth = texture2D(texture_depth_sensing, texCoord).ra;
      float depth = dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * depth_raw_to_meters; // m
      
      if ((gl_FragCoord.z / gl_FragCoord.w) > depth) {
          // then do not render
          discard;
      }
    }

		void main() {

      depthSensingOcclude();

			vec4 texel = texture2D( tDiffuse, vUv );

			gl_FragColor = texel;

		}`,
};

export const Depth = () => {
  const { depthInfoRef } = useDepthSensing();
  const { frameCallbacks } = useStore();
  const { camera, scene, glRenderer } = useThree();
  const [material, setMaterial] = useState(
    () =>
      new THREE.MeshBasicMaterial({
        color: 'red',
      })
  );

  const [rotation, setRotation] = useState<Euler>(() => ({
    x: 0,
    y: 10,
    z: 0,
  }));

  const forceTextureInitialization = useCallback(
    (texture: THREE.Texture) => {
      material.map = texture;
    },
    [material]
  );

  const texProps = useMemo(() => {
    const texture = new THREE.Texture();
    // material.map = texture;
    forceTextureInitialization(texture);
    return glRenderer.properties.get(texture);
  }, [forceTextureInitialization]);

  const [composer, setComposer] = useState(() => {
    const composer = new EffectComposer(glRenderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // const effect1 = new ShaderPass(DepthScreenShader);
    // // effect1.uniforms['scale'].value = 4;
    // composer.addPass(effect1);

    // const effect2 = new ShaderPass(RGBShiftShader);
    // effect2.uniforms['amount'].value = 0.0015;
    // composer.addPass(effect2);

    // const glitchPass = new GlitchPass();
    // composer.addPass(glitchPass);
    return composer;
  });

  useEffect(() => {
    const render = frameCallbacks.get('gl-render');
    frameCallbacks.delete('gl-render');
    return () => {
      render && frameCallbacks.set('gl-render', render);
    };
  }, []);

  useFrame(() => {
    if (depthInfoRef.current) {
      texProps.__webglTexture = depthInfoToTexture(
        depthInfoRef.current,
        glRenderer
      );
    } else {
      console.log('no depthInfoRef data');
    }
    setRotation((prev) => ({
      y: (prev.y ?? 0) + 0.02,
    }));
    composer.render();
  });

  return (
    <>
      <cameraHelper args={[camera]} />
      <mesh
        rotation={rotation}
        position={{
          x: 0,
          y: 0,
          z: -15,
        }}
        geometry={new THREE.BoxGeometry(3, 3, 3)}
        material={material}
      ></mesh>
    </>
  );
};
