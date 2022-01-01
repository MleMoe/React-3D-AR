import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Shader } from 'three';
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
import { ARHitTest } from '../ARHitTest';

export function depthInfoToTexture(
  depthInfoRef: React.MutableRefObject<XRCPUDepthInformation>,
  glRenderer: THREE.WebGLRenderer,
  textureRef: React.MutableRefObject<THREE.Texture>
) {
  const gl = glRenderer.getContext();

  let depthTexture: WebGLTexture = glRenderer.properties.get(
    textureRef.current
  ).__webglTexture;

  if (!depthTexture) {
    console.log('无 __webglTexture');
    depthTexture = gl.createTexture() as WebGLTexture;
  }

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
    depthInfoRef.current.width,
    depthInfoRef.current.height,
    0,
    gl.LUMINANCE_ALPHA,
    gl.UNSIGNED_BYTE,
    new Uint8Array(depthInfoRef.current.data)
  );

  return depthTexture;
}

var CopyShader = {
  uniforms: {
    tDiffuse: { value: null },
    opacity: { value: 1.0 },
  },

  vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

  fragmentShader: /* glsl */ `
		uniform float opacity;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;
		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;
		}`,
};

const depthScreenShader = {
  uniforms: {
    uDepthTexture: { value: null },
    uUvTransform: { value: null },
    uRawValueToMeters: { value: null },
    uAlpha: { value: 1 },
  },
  vertexShader: `
    precision mediump float;

    varying vec2 vTexCoord;

    void main(void) {
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      vTexCoord = uv;
    }
    `,
  fragmentShader: `
    precision mediump float;

    uniform sampler2D uDepthTexture;
    uniform mat4 uUvTransform;
    uniform float uRawValueToMeters;
    uniform float uAlpha;

    varying vec2 vTexCoord;

    float DepthGetMeters(in sampler2D depth_texture, in vec2 depth_uv) {
      // Depth is packed into the luminance and alpha components of its texture.
      // The texture is in a normalized format, storing raw values that need to be
      // converted to meters.
      vec2 packedDepthAndVisibility = texture2D(depth_texture, depth_uv).ra;
      return dot(packedDepthAndVisibility, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters;
    }

    const highp float kMaxDepthInMeters = 8.0;
    const float kInvalidDepthThreshold = 0.01;

    vec3 TurboColormap(in float x);

    // Returns a color corresponding to the depth passed in. Colors range from red
    // to green to blue, where red is closest and blue is farthest.
    //
    // Uses Turbo color mapping:
    // https://ai.googleblog.com/2019/08/turbo-improved-rainbow-colormap-for.html
    vec3 DepthGetColorVisualization(in float x) {
      return step(kInvalidDepthThreshold, x) * TurboColormap(x);
    }

    void main(void) {
      vec4 texCoord = uUvTransform * vec4(vTexCoord, 0, 1);

      highp float normalized_depth = clamp(
        DepthGetMeters(uDepthTexture, texCoord.xy) / kMaxDepthInMeters, 0.0, 1.0);
      gl_FragColor = vec4(DepthGetColorVisualization(normalized_depth), uAlpha);
    }

    vec3 TurboColormap(in float x) {
      const vec4 kRedVec4 = vec4(0.55305649, 3.00913185, -5.46192616, -11.11819092);
      const vec4 kGreenVec4 = vec4(0.16207513, 0.17712472, 15.24091500, -36.50657960);
      const vec4 kBlueVec4 = vec4(-0.05195877, 5.18000081, -30.94853351, 81.96403246);
      const vec2 kRedVec2 = vec2(27.81927491, -14.87899417);
      const vec2 kGreenVec2 = vec2(25.95549545, -5.02738237);
      const vec2 kBlueVec2 = vec2(-86.53476570, 30.23299484);

      // Adjusts color space via 6 degree poly interpolation to avoid pure red.
      x = clamp(x * 0.9 + 0.03, 0.0, 1.0);
      vec4 v4 = vec4( 1.0, x, x * x, x * x * x);
      vec2 v2 = v4.zw * v4.z;
      return vec3(
        dot(v4, kRedVec4)   + dot(v2, kRedVec2),
        dot(v4, kGreenVec4) + dot(v2, kGreenVec2),
        dot(v4, kBlueVec4)  + dot(v2, kBlueVec2)
      );
    }
`,
};

const DepthTestShader = {
  uniforms: {
    tDiffuse: { value: null },
    uDepthTexture: { value: null },
    uUvTransform: { value: null },
    uRawValueToMeters: { value: null },
  },

  vertexShader: /* glsl */ `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `

    // uniform vec4 uScreenSize;

    uniform sampler2D uDepthTexture;
    uniform mat4 uUvTransform;
    uniform float uRawValueToMeters;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

    // void depthSensingOcclude() {
    //   // fragment position in screen space
    //   vec2 screenSpace = gl_FragCoord.xy / uScreenSize.xy;
    //   // transform depth uv to be normalized to screen space
    //   vec2 texCoord = (uUvTransform * vec4(screenSpace.x, 1.0 - screenSpace.y, 0.0, 1.0)).xy;
    //   // get luminance alpha components from depth texture
    //   vec2 packedDepth = texture2D(uDepthTexture, texCoord).ra;
    //   // unpack into single value in millimeters
    //   float depth = dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters; // m
      
    //   // check if fragment is behind depth value
    //   if ((gl_FragCoord.z / gl_FragCoord.w) > depth) {
    //       // then do not render
    //       discard;
    //   }
    // }

		void main() {

      // depthSensingOcclude();

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = texel;

		}`,
};

export const Depth = () => {
  const { depthInfoRef } = useDepthSensing();
  const { frameCallbacks } = useStore();
  const { camera, scene, glRenderer } = useThree();

  const textureRef = useRef(new THREE.Texture());

  const [material] = useState(() => {
    const material = new THREE.MeshBasicMaterial({
      color: 'red',
    });
    material.map = textureRef.current;

    return material;
  });

  const texProps = useMemo(() => {
    return glRenderer.properties.get(textureRef.current);
  }, []);

  const [depthScreenEffect] = useState(() => new ShaderPass(DepthTestShader));
  const [depthFlag, setDepthFlag] = useState(false);

  const [composer] = useState(() => {
    const composer = new EffectComposer(glRenderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    return composer;
  });

  useEffect(() => {
    const render = frameCallbacks.get('gl-render');
    frameCallbacks.delete('gl-render');

    const timer = setInterval(() => {
      if (depthInfoRef.current) {
        texProps.__webglTexture = depthInfoToTexture(
          depthInfoRef as React.MutableRefObject<XRCPUDepthInformation>,
          glRenderer,
          textureRef
        );
        if (!composer.passes.find((p) => p == depthScreenEffect)) {
          setDepthFlag(true);
          depthScreenEffect.uniforms['uDepthTexture'].value =
            texProps.__webglTexture;

          depthScreenEffect.uniforms['uUvTransform'].value =
            depthInfoRef.current.normDepthBufferFromNormView.matrix;

          depthScreenEffect.uniforms['uRawValueToMeters'].value =
            depthInfoRef.current.rawValueToMeters;
          composer.addPass(depthScreenEffect);
        }
      }
    });
    return () => {
      render && frameCallbacks.set('gl-render', render);
      clearInterval(timer);
    };
  }, []);

  useFrame(() => {
    if (depthFlag) {
      depthScreenEffect.uniforms['uDepthTexture'].value =
        texProps.__webglTexture;
    }
    composer.render();
  });

  return (
    <>
      <cameraHelper args={[camera]} />
      {/* <mesh
        position={{
          x: 0,
          y: 0,
          z: -0.2,
        }}
        geometry={new THREE.BoxGeometry(0.5, 0.5, 0.5)}
        material={new THREE.MeshBasicMaterial({ color: 'yellow' })}
      ></mesh> */}
      <mesh
        position={{
          x: 0,
          y: 0,
          z: -15,
        }}
        geometry={new THREE.BoxGeometry(3, 3, 3)}
        material={material}
      ></mesh>
      <ARHitTest />
    </>
  );
};
