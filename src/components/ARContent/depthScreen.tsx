import { FC, useMemo, useRef } from 'react';
import {
  useCameraAccess,
  XRCPUDepthInformation,
} from '../../packages/webar/hooks';
import { RootState } from '../../packages/three-react/store';
import { useFrame, useThree } from '../../packages/three-react/hooks';
import * as THREE from 'three';

export const DepthScreen: FC<{ store?: RootState }> = ({ store }) => {
  const { glRenderer, camera, scene } = useThree();
  const gl = useMemo(() => glRenderer.getContext(), []);
  // const { depthInfoRef } = useDepthSensing();
  const depthInfoRef = useRef<XRCPUDepthInformation>();
  const textureRef = useRef<WebGLTexture>(
    glRenderer.getContext().createTexture()
  );

  const [postCamera, postMaterial, postScene] = useMemo(() => {
    const pCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const pMaterial = new THREE.ShaderMaterial({
      vertexShader: `
          varying vec2 vTexCoord;

          void main() {
            vTexCoord = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
      uniforms: {
        cameraNear: { value: camera.near },
        cameraFar: { value: camera.far },
        tDiffuse: { value: null },
        uDepthTexture: { value: null },
        uAlpha: { value: 0.6 },
        uRawValueToMeters: { value: 1.0 },
        uUvTransform: { value: null },
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

            postMaterial.uniforms.uDepthTexture.value = textureRef.current;
            postMaterial.uniforms.uRawValueToMeters.value =
              depthInfoRef.current.rawValueToMeters;
            postMaterial.uniforms.uUvTransform.value =
              depthInfoRef.current.normDepthBufferFromNormView.matrix;
            glRenderer.render(postScene, postCamera);
          }
        }

        glRenderer.xr.enabled = true;
      }
    }
  });

  return <></>;
};
