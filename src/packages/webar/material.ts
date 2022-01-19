import {
  Material,
  Scene,
  Matrix4,
  ShadowMaterial,
  Mesh,
  XRRigidTransform,
  Vector2,
} from 'three';
import { DepthRawTexture } from './texture';

export function transformARMaterial(
  material: Material,
  depthMap: DepthRawTexture
) {
  material.userData = {
    isARMaterial: true,
    uniforms: {
      uScreenDepthTexture: { value: depthMap.texture }, // aaaaa
      uWidth: { value: 1.0 },
      uHeight: { value: 1.0 },
      uUvTransform: { value: new Matrix4() },
      uOcclusionEnabled: { value: true },
      uRawValueToMeters: { value: 0.001 },
    },
  };

  material.onBeforeCompile = (shader) => {
    material.needsUpdate = true;

    for (let i in material.userData.uniforms) {
      shader.uniforms[i] = material.userData.uniforms[i];
      console.log(i, shader.uniforms[i]);
    }

    shader.vertexShader =
      `
			varying float vDepth;
			` + shader.vertexShader;

    // Vertex depth logic
    shader.vertexShader = shader.vertexShader.replace(
      '#include <fog_vertex>',
      `
			#include <fog_vertex>

			vDepth = gl_Position.z;
			`
    );

    shader.fragmentShader =
      `
      uniform float uWidth;
			uniform float uHeight;
      uniform sampler2D uScreenDepthTexture;
      uniform mat4 uUvTransform;
      uniform float uRawValueToMeters;

			uniform bool uOcclusionEnabled;
      varying float vDepth;

			` + shader.fragmentShader;

    const fragmentEntryPoint = '#include <clipping_planes_fragment>';

    shader.fragmentShader = shader.fragmentShader.replace(
      fragmentEntryPoint,
      `
    ${fragmentEntryPoint}
      
    if(uOcclusionEnabled){
      float x = gl_FragCoord.x / uWidth;
			float y = gl_FragCoord.y / uHeight;
      vec2 texCoord = (uUvTransform * vec4(x, 1.0 - y, 0.0, 1.0)).xy;

      vec2 packedDepth = texture2D(uScreenDepthTexture, texCoord).ra;
      float depth = dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters; // m

      if (depth < (gl_FragCoord.z / gl_FragCoord.w)) {
          discard;
      }
    }
      `
    );

    console.log(shader.vertexShader, shader.fragmentShader);
  };

  return material;
}

export function updateNormalUniforms(
  scene: Scene,
  normTextureFromNormViewMatrix: XRRigidTransform,
  rawValueToMeters: number
) {
  scene.traverse(function (child) {
    if (child instanceof Mesh) {
      if (child.material && child.material.userData.isARMaterial) {
        // if (!child.material.userData.uniforms.uOcclusionEnabled.value) {
        //   child.material.userData.uniforms.uOcclusionEnabled.value = true;
        // }

        child.material.userData.uniforms.uWidth.value = Math.floor(
          window.devicePixelRatio * window.innerWidth
        );
        child.material.userData.uniforms.uHeight.value = Math.floor(
          window.devicePixelRatio * window.innerHeight
        );

        child.material.userData.uniforms.uRawValueToMeters.value =
          rawValueToMeters;
        child.material.userData.uniforms.uUvTransform.value.fromArray(
          normTextureFromNormViewMatrix.matrix
        );
        child.material.uniformsNeedUpdate = true;

        // console.log(child.material.userData.uniforms);
      }
    }
  });
}
