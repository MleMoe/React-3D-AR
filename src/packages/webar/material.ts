import {
  Material,
  Scene,
  Matrix4,
  ShadowMaterial,
  Mesh,
  XRRigidTransform,
  ShaderMaterial,
  Texture,
  Vector2,
} from 'three';
import { DepthDataTexture, DepthRawTexture } from './texture';
import ARMaterialVertex from './glsl/ARMaterialVertex.glsl?raw';
import ARMaterialFragment from './glsl/ARMaterialFragment.glsl?raw';

export class AugmentedMaterial extends ShaderMaterial {
  constructor(colorMap: Texture, depthMap: DepthDataTexture) {
    super({
      uniforms: {
        uColorTexture: { value: colorMap },
        uDepthTexture: { value: depthMap },
        uWidth: { value: 1.0 },
        uHeight: { value: 1.0 },
        uUvTransform: { value: new Matrix4() },
      },
      vertexShader: ARMaterialVertex,
      fragmentShader: ARMaterialFragment,
    });

    this.depthWrite = true;
  }
}

export function transformARMaterial(
  material: Material,
  depthMap: DepthRawTexture | DepthDataTexture
) {
  material.userData = {
    isARMaterial: true,
    uniforms: {
      uScreenDepthTexture: { value: depthMap },
      uScreenSize: {
        value: new Vector2(window.innerWidth, window.innerHeight),
      },
      uUvTransform: { value: new Matrix4() },
      uOcclusionEnabled: { value: false },
      uRawValueToMeters: { value: 0.001 },
    },
  };

  material.onBeforeCompile = (shader) => {
    material.needsUpdate = true;

    for (let i in material.userData.uniforms) {
      shader.uniforms[i] = material.userData.uniforms[i];
    }

    shader.fragmentShader =
      `
      uniform vec2 uScreenSize;
      uniform sampler2D uScreenDepthTexture;
      uniform mat4 uUvTransform;
      uniform float uRawValueToMeters;

			uniform bool uOcclusionEnabled;

			` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      'void main() {',
      'void main() {\n' +
        `
        if(uOcclusionEnabled){
          vec2 screenSpace = gl_FragCoord.xy / uScreenSize;
          vec2 texCoord = (uUvTransform * vec4(screenSpace.x, 1.0 - screenSpace.y, 0.0, 1.0)).xy;
          vec2 packedDepth = texture2D(uScreenDepthTexture, texCoord).ra;
          float depth = dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters; // m

          if ((gl_FragCoord.z / gl_FragCoord.w) > depth) {
              discard;
          }
        }
        
      `
    );
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
        if (!child.material.userData.uniforms.uOcclusionEnabled.value) {
          child.material.userData.uniforms.uOcclusionEnabled.value = true;
        }
        child.material.userData.uniforms.uRawValueToMeters.value =
          rawValueToMeters;
        child.material.userData.uniforms.uUvTransform.value =
          normTextureFromNormViewMatrix.matrix;
        child.material.uniformsNeedUpdate = true;
      }
    }
  });
}
