import {
  Material,
  Scene,
  Matrix4,
  ShadowMaterial,
  Mesh,
  XRRigidTransform,
  ShaderMaterial,
  Texture,
} from 'three';
import { DepthDataTexture } from './texture';
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
  depthMap: DepthDataTexture
) {
  material.userData = {
    isARMaterial: true,
    uniforms: {
      uDepthTexture: { value: depthMap },
      uWidth: { value: 1.0 },
      uHeight: { value: 1.0 },
      uUvTransform: { value: new Matrix4() },
      uOcclusionEnabled: { value: true },
    },
  };

  material.onBeforeCompile = (shader) => {
    for (let i in material.userData.uniforms) {
      shader.uniforms[i] = material.userData.uniforms[i];
    }

    shader.fragmentShader =
      `
			uniform sampler2D uDepthTexture;
			uniform float uWidth;
			uniform float uHeight;
			uniform mat4 uUvTransform;

			uniform bool uOcclusionEnabled;

			varying float vDepth;
			` + shader.fragmentShader;

    var fragmentEntryPoint = '#include <clipping_planes_fragment>';
    if (material instanceof ShadowMaterial) {
      fragmentEntryPoint = '#include <fog_fragment>';
    }

    // Fragment depth logic
    shader.fragmentShader = shader.fragmentShader.replace(
      'void main',
      `float getDepthInMillimeters(in sampler2D depthText, in vec2 uv)
			{
				vec2 packedDepth = texture2D(depthText, uv).ra;
				return dot(packedDepth, vec2(255.0, 65280.0));
			}

			void main`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      fragmentEntryPoint,
      `
			${fragmentEntryPoint}

			if(uOcclusionEnabled)
			{
				// Normalize x, y to range [0, 1]
				float x = gl_FragCoord.x / uWidth;
				float y = gl_FragCoord.y / uHeight;
				vec2 depthUV = (uUvTransform * vec4(vec2(x, y), 0, 1)).xy;

				float depth = getDepthInMillimeters(uDepthTexture, depthUV) / 1000.0;
				if (depth < vDepth)
				{
					discard;
				}
			}
			`
    );

    // Vertex variables
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
  };

  return material;
}

export function updateNormalUniforms(
  scene: Scene,
  normTextureFromNormViewMatrix: XRRigidTransform
) {
  scene.traverse(function (child) {
    if (child instanceof Mesh) {
      if (child.material && child.material.userData.isARMaterial) {
        child.material.userData.uniforms.uWidth.value = Math.floor(
          window.devicePixelRatio * window.innerWidth
        );
        child.material.userData.uniforms.uHeight.value = Math.floor(
          window.devicePixelRatio * window.innerHeight
        );
        child.material.userData.uniforms.uUvTransform.value.fromArray(
          normTextureFromNormViewMatrix
        );
        child.material.uniformsNeedUpdate = true;
      }
    }
  });
}
