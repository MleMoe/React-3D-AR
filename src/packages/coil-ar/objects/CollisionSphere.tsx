import { FC, useEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  Camera,
  Group,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  WebGLRenderer,
} from 'three';
import { useARManager } from '../hooks';
import { DepthRawTexture } from '../texture';

export const CollisionSphere: FC = () => {
  const { depthRawTexture } = useARManager();
  const meshRef = useRef<Mesh>(null!);

  const { cMaterial } = useMemo(() => {
    const cMaterial = transformCollisionMaterial(
      new MeshBasicMaterial({
        color: 0x0000ff,
        wireframe: true,
      }),
      depthRawTexture
    );
    return { cMaterial };
  }, []);

  useEffect(() => {
    meshRef.current.onBeforeRender = (
      renderer: WebGLRenderer,
      scene: Scene,
      camera: Camera,
      geometry: BufferGeometry,
      material: Material,
      group: Group
    ) => {
      // @ts-ignore
      const arCamera = renderer.xr.getCamera();
      meshRef.current.position.copy(arCamera.position);
      meshRef.current.rotation.copy(arCamera.rotation);
      meshRef.current.updateMatrix();
      meshRef.current.translateZ(-9);
      // console.log(arCamera.position, arCamera.rotation);
    };
  }, []);
  return (
    <mesh
      ref={meshRef}
      geometry={new PlaneGeometry(50, 50, 200, 200)}
      material={cMaterial}
      position={{ x: 0, y: 0, z: -10 }}
    ></mesh>
  );
};

function transformCollisionMaterial(
  material: Material,
  depthMap: DepthRawTexture
) {
  material.userData = {
    isARMaterial: true,
    isCollisionMaterial: true,
    uniforms: {
      uScreenDepthTexture: { value: depthMap.texture },
      uUvTransform: { value: new Matrix4() },
      uCollisionEnabled: { value: true },
      uRawValueToMeters: { value: 0.001 },
    },
  };

  material.onBeforeCompile = (shader) => {
    material.needsUpdate = true;

    for (let i in material.userData.uniforms) {
      shader.uniforms[i] = material.userData.uniforms[i];
    }

    shader.vertexShader =
      `
    	uniform bool uCollisionEnabled;

      uniform sampler2D uScreenDepthTexture;
      uniform mat4 uUvTransform;
      uniform float uRawValueToMeters;

      varying float vDepth;
    	` + shader.vertexShader;

    // Vertex depth logic
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `
      if(uCollisionEnabled){
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition = modelViewMatrix * mvPosition;
        vec4 old_Position = projectionMatrix * mvPosition;

        vec3 ndc = old_Position.xyz / old_Position.w; //perspective divide/normalize
        vec2 viewportCoord = ndc.xy * 0.5 + 0.5; //ndc is -1 to 1 in GL. scale for 0 to 1

        vec2 texCoord = (uUvTransform * vec4(viewportCoord.x, 1.0 - viewportCoord.y, 0.0, 1.0)).xy;

        vec2 packedDepth = texture2D(uScreenDepthTexture, texCoord).ra;
        float depth = dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters; // m

        vDepth = depth;

        mvPosition.z = - depth;
        gl_Position = projectionMatrix * mvPosition;

      }
      else{
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
      }
    	`
    );

    console.log(shader.vertexShader, shader.fragmentShader);

    shader.fragmentShader =
      `
      varying float vDepth;

    	` + shader.fragmentShader;

    const fragmentEntryPoint = '#include <dithering_fragment>';

    shader.fragmentShader = shader.fragmentShader.replace(
      fragmentEntryPoint,
      `
    ${fragmentEntryPoint}

      gl_FragColor = vec4(vDepth / 2.0, vDepth / 2.0, vDepth / 2.0, 1.0);
      highp float normalized_depth = clamp(vDepth / 10.0, 0.0, 1.0);

      const vec4 kRedVec4 = vec4(0.55305649, 3.00913185, -5.46192616, -11.11819092);
      const vec4 kGreenVec4 = vec4(0.16207513, 0.17712472, 15.24091500, -36.50657960);
      const vec4 kBlueVec4 = vec4(-0.05195877, 5.18000081, -30.94853351, 81.96403246);
      const vec2 kRedVec2 = vec2(27.81927491, -14.87899417);
      const vec2 kGreenVec2 = vec2(25.95549545, -5.02738237);
      const vec2 kBlueVec2 = vec2(-86.53476570, 30.23299484);

      // Adjusts color space via 6 degree poly interpolation to avoid pure red.
      float x = clamp(normalized_depth * 0.9 + 0.03, 0.0, 1.0);
      vec4 v4 = vec4( 1.0, x, x * x, x * x * x);
      vec2 v2 = v4.zw * v4.z;
      vec3 s = vec3(
        dot(v4, kRedVec4)   + dot(v2, kRedVec2),
        dot(v4, kGreenVec4) + dot(v2, kGreenVec2),
        dot(v4, kBlueVec4)  + dot(v2, kBlueVec2)
      );

      gl_FragColor = vec4(step(0.01, normalized_depth) * s, 1.0);
      `
    );
  };

  return material;
}
