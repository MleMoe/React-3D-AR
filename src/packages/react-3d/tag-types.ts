import React from 'react';
import * as THREE from 'three';
import { EventHandlers } from './events';

type Parameters<T extends (...paras: any) => any> = T extends (
  ...paras: infer P
) => any
  ? P
  : never;

// 欧拉角 x, y, z
export type Euler = Partial<THREE.Euler>;

// 四元数 x, y, z, w
export type Quaternion = THREE.Quaternion | Parameters<THREE.Quaternion['set']>;

// 四维矩阵 [ number * 16 ]
export type Matrix4 = THREE.Matrix4 | Parameters<THREE.Matrix4['set']>;
// x, y
export type Vector2 = THREE.Vector2 | Parameters<THREE.Vector2['set']>;
export type Vector3 = Partial<THREE.Vector3>;
export type Vector4 = THREE.Vector4 | Parameters<THREE.Vector4['set']>;

// 图层 number
export type Layers = THREE.Layers | Parameters<THREE.Layers['set']>[0];

// 0x00ff00 或 #00ff00
export type Color = number | string;

type Paras<T> = T extends new (...paras: any) => any
  ? ConstructorParameters<T>
  : T;
export interface NodeProps<T> {
  /** 构造函数参数 */
  paras?: Paras<T>;
  children?: React.ReactNode;
  ref?: React.Ref<React.ReactNode>;
  key?: React.Key;
}

// 获取不是函数类型的类型属性
export type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
// T 去除 O 的类型属性，然后与 O 合并，也即是说用 O 去覆盖 T
export type Overwrite<T, O> = Omit<T, keyof O> & O;

export type Node<T, P> = Overwrite<Partial<T>, NodeProps<P>>;

export type Object3DNode<T, P> = Overwrite<
  Node<T, P>,
  {
    position?: Vector3;
    up?: Vector3;
    scale?: Vector3;
    rotation?: Euler;
    matrix?: Matrix4;
    quaternion?: Quaternion;
    // layers?: Layers;
    // dispose?: (() => void) | null;
  }
> &
  EventHandlers;

export type LightNode<T extends THREE.Light, P> = Overwrite<
  Object3DNode<T, P>,
  { color?: Color }
>;

/**
 * Camera
 */
export type CameraProps = Object3DNode<THREE.Camera, typeof THREE.Camera>;
export type PerspectiveCameraProps = Object3DNode<
  THREE.PerspectiveCamera,
  typeof THREE.PerspectiveCamera
>;
export type OrthographicCameraProps = Object3DNode<
  THREE.OrthographicCamera,
  typeof THREE.OrthographicCamera
>;
export type CubeCameraProps = Object3DNode<
  THREE.CubeCamera,
  typeof THREE.CubeCamera
>;
export type ArrayCameraProps = Object3DNode<
  THREE.ArrayCamera,
  typeof THREE.ArrayCamera
>;

/**
 * 物体
 */
export type GroupProps = Object3DNode<THREE.Group, typeof THREE.Group>;

export type MeshProps = Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
export type InstancedMeshProps = Object3DNode<
  THREE.InstancedMesh,
  typeof THREE.InstancedMesh
>;

export type LineSegmentsProps = Object3DNode<
  THREE.LineSegments,
  typeof THREE.LineSegments
>;
export type LineLoopProps = Object3DNode<THREE.LineLoop, typeof THREE.LineLoop>;

export type PointsProps = Object3DNode<THREE.Points, typeof THREE.Points>;
export type SpriteProps = Object3DNode<THREE.Sprite, typeof THREE.Sprite>;

export type BoneProps = Object3DNode<THREE.Bone, typeof THREE.Bone>;
export type SkeletonProps = Object3DNode<THREE.Skeleton, typeof THREE.Skeleton>;
export type SkinnedMeshProps = Object3DNode<
  THREE.SkinnedMesh,
  typeof THREE.SkinnedMesh
>;

export type LODProps = Object3DNode<THREE.LOD, typeof THREE.LOD>;

/**
 * 辅助对象
 */

export type GridHelperProps = Object3DNode<
  THREE.GridHelper,
  typeof THREE.GridHelper
>;

export type AxesHelperProps = Object3DNode<
  THREE.AxesHelper,
  typeof THREE.AxesHelper
>;

export type CameraHelperProps = Object3DNode<
  THREE.CameraHelper,
  typeof THREE.CameraHelper
>;

/**
 * Light
 */
export type LightProps = LightNode<THREE.Light, typeof THREE.Light>;
export type DirectionalLightProps = LightNode<
  THREE.DirectionalLight,
  typeof THREE.DirectionalLight
>;
export type AmbientLightProps = LightNode<
  THREE.AmbientLight,
  typeof THREE.AmbientLight
>;
export type PointLightProps = LightNode<
  THREE.PointLight,
  typeof THREE.PointLight
>;
export type HemisphereLightProps = LightNode<
  THREE.HemisphereLight,
  typeof THREE.HemisphereLight
>;

export type SpotLightProps = LightNode<THREE.SpotLight, typeof THREE.SpotLight>;

export type RectAreaLightProps = LightNode<
  THREE.RectAreaLight,
  typeof THREE.RectAreaLight
>;

export type AmbientLightProbeProps = LightNode<
  THREE.AmbientLightProbe,
  typeof THREE.AmbientLightProbe
>;
export type HemisphereLightProbeProps = LightNode<
  THREE.HemisphereLightProbe,
  typeof THREE.HemisphereLightProbe
>;
export type LightProbeProps = LightNode<
  THREE.LightProbe,
  typeof THREE.LightProbe
>;

export type SpotLightHelperProps = Object3DNode<
  THREE.SpotLightHelper,
  typeof THREE.SpotLightHelper
>;
export type SkeletonHelperProps = Object3DNode<
  THREE.SkeletonHelper,
  typeof THREE.SkeletonHelper
>;
export type PointLightHelperProps = Object3DNode<
  THREE.PointLightHelper,
  typeof THREE.PointLightHelper
>;
export type HemisphereLightHelperProps = Object3DNode<
  THREE.HemisphereLightHelper,
  typeof THREE.HemisphereLightHelper
>;

export type PolarGridHelperProps = Object3DNode<
  THREE.PolarGridHelper,
  typeof THREE.PolarGridHelper
>;
export type DirectionalLightHelperProps = Object3DNode<
  THREE.DirectionalLightHelper,
  typeof THREE.DirectionalLightHelper
>;

export type BoxHelperProps = Object3DNode<
  THREE.BoxHelper,
  typeof THREE.BoxHelper
>;
export type Box3HelperProps = Object3DNode<
  THREE.Box3Helper,
  typeof THREE.Box3Helper
>;
export type PlaneHelperProps = Object3DNode<
  THREE.PlaneHelper,
  typeof THREE.PlaneHelper
>;
export type ArrowHelperProps = Object3DNode<
  THREE.ArrowHelper,
  typeof THREE.ArrowHelper
>;

export type ThreeTextProps = {};
declare global {
  namespace JSX {
    interface IntrinsicElements {
      perspectiveCamera: PerspectiveCameraProps;
      orthographicCamera: OrthographicCameraProps;

      group: GroupProps;

      mesh: MeshProps;
      instancedMesh: InstancedMeshProps;

      lineSegments: LineSegmentsProps;
      lineLoop: LineLoopProps;

      point: PointsProps;
      sprite: SpriteProps;

      skeleton: SkeletonProps;
      bone: BoneProps;
      skinnedMesh: SkinnedMeshProps;

      lod: LODProps;

      light: LightProps;
      ambientLight: AmbientLightProps;
      directionalLight: DirectionalLightProps;
      pointLight: PointLightProps;
      hemisphereLight: HemisphereLightProps;
      spotLight: SpotLightProps;
      rectAreaLight: RectAreaLightProps;

      lightProbe: LightProbeProps;
      ambientLightProbe: AmbientLightProbeProps;
      hemisphereLightProbe: HemisphereLightProbeProps;

      gridHelper: GridHelperProps;
      axesHelper: AxesHelperProps;
      cameraHelper: CameraHelperProps;
      spotLightHelper: SpotLightHelperProps;
      skeletonHelper: SkeletonHelperProps;
      pointLightHelper: PointLightHelperProps;
      hemisphereLightHelper: HemisphereLightHelperProps;
      polarGridHelper: PolarGridHelperProps;
      directionalLightHelper: DirectionalLightHelperProps;
      boxHelper: BoxHelperProps;
      box3Helper: Box3HelperProps;
      planeHelper: PlaneHelperProps;
      arrowHelper: ArrowHelperProps;
    }
  }
}
