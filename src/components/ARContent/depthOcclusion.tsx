import { useEffect, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { useThree, useFrame, useStore } from '../../packages/three-react/hooks';
import {
  XRCPUDepthInformation,
  useDepthSensing,
} from '../../packages/use-webar/hooks';
import { ARHitTest } from '../ARHitTest';

export const DepthOcclusion = () => {
  // const { depthInfoRef } = useDepthSensing();
  const { frameCallbacks } = useStore();
  const { camera, scene, glRenderer } = useThree();
  const gl = useMemo(() => glRenderer.getContext(), []);
  const depthInfoRef = useRef<XRCPUDepthInformation>();
  const textureRef = useRef<WebGLTexture>(
    glRenderer.getContext().createTexture()
  );

  const [material] = useState(() => {
    const material = new THREE.MeshBasicMaterial({ color: 0x0000f0 });
    material.onBeforeCompile = (shader: THREE.Shader) => {
      console.log(shader);
      console.log(shader.vertexShader);
      console.log(shader.uniforms);
      console.log(shader.fragmentShader);
    };
    return material;
  });

  const depthMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          // void main() {
          //   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          // }
          #include <common>
          #include <uv_pars_vertex>
          #include <uv2_pars_vertex>
          #include <envmap_pars_vertex>
          #include <color_pars_vertex>
          #include <fog_pars_vertex>
          #include <morphtarget_pars_vertex>
          #include <skinning_pars_vertex>
          #include <logdepthbuf_pars_vertex>
          #include <clipping_planes_pars_vertex>
          void main() {
            #include <uv_vertex>
            #include <uv2_vertex>
            #include <color_vertex>
            #if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
              #include <beginnormal_vertex>
              #include <morphnormal_vertex>
              #include <skinbase_vertex>
              #include <skinnormal_vertex>
              #include <defaultnormal_vertex>
            #endif
            #include <begin_vertex>
            #include <morphtarget_vertex>
            #include <skinning_vertex>
            #include <project_vertex>
            #include <logdepthbuf_vertex>
            #include <clipping_planes_vertex>
            #include <worldpos_vertex>
            #include <envmap_vertex>
            #include <fog_vertex>
          }
        `,
        fragmentShader: `
          #include <packing>

          uniform vec2 uScreenSize;
          uniform sampler2D uDepthTexture;
          uniform mat4 uUvTransform;
          uniform float uRawValueToMeters;

          // uniform sampler2D tDiffuse;

          void depthSensingOcclude() {
            // fragment position in screen space
            vec2 screenSpace = gl_FragCoord.xy / uScreenSize;
            // transform depth uv to be normalized to screen space
            vec2 texCoord = (uUvTransform * vec4(screenSpace.x, 1.0 - screenSpace.y, 0.0, 1.0)).xy;
            // get luminance alpha components from depth texture
            vec2 packedDepth = texture2D(uDepthTexture, texCoord).ra;
            // unpack into single value in millimeters
            float depth = dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters; // m
            
            // check if fragment is behind depth value
            if ((gl_FragCoord.z / gl_FragCoord.w) > depth) {
                // then do not render
                discard;
            }
          }

          void main() {
            depthSensingOcclude();
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
          }
        `,
        uniforms: {
          uScreenSize: {
            value: new THREE.Vector2(
              glRenderer.domElement.width,
              glRenderer.domElement.height
            ),
          },
          // cameraFar: { value: camera.far },
          // tDiffuse: { value: null },
          uDepthTexture: { value: null },
          uRawValueToMeters: { value: 1.0 },
          uUvTransform: { value: null },
        },
      }),
    []
  );

  // useEffect(() => {
  //   scene.overrideMaterial = depthMaterial;
  //   return () => {
  //     scene.overrideMaterial = null;
  //   };
  // }, []);

  useFrame(async (t?: number, frame?: THREE.XRFrame) => {
    if (frame) {
      glRenderer.xr.enabled = false;
      // @ts-ignore

      const referenceSpace = await frame.session.requestReferenceSpace(
        'viewer'
      );
      if (referenceSpace) {
        let viewerPose = frame.getViewerPose(referenceSpace);
        if (viewerPose) {
          for (const view of viewerPose.views) {
            // @ts-ignore
            depthInfoRef.current = frame.getDepthInformation(view);
            if (!depthInfoRef.current) {
              return;
            }

            gl.bindTexture(gl.TEXTURE_2D, textureRef.current);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(
              gl.TEXTURE_2D,
              gl.TEXTURE_WRAP_S,
              gl.CLAMP_TO_EDGE
            );
            gl.texParameteri(
              gl.TEXTURE_2D,
              gl.TEXTURE_WRAP_T,
              gl.CLAMP_TO_EDGE
            );

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
            gl.activeTexture(gl.TEXTURE0);

            depthMaterial.uniforms.uDepthTexture.value = textureRef.current;
            depthMaterial.uniforms.uRawValueToMeters.value =
              depthInfoRef.current.rawValueToMeters;
            depthMaterial.uniforms.uUvTransform.value =
              depthInfoRef.current.normDepthBufferFromNormView.matrix;
            // scene.overrideMaterial = depthMaterial;
          }
        }
      }
    }
  });

  return (
    <>
      {/* <mesh
        position={{ x: 0, y: 0, z: -10 }}
        geometry={new THREE.SphereBufferGeometry(5)}
        material={material}
      ></mesh> */}
      <ARHitTest />
    </>
  );
};
