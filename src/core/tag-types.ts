import React from 'react';
import * as THREE from 'three';

type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
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

type Args<T> = T extends new (...args: any) => any
  ? ConstructorParameters<T>
  : T;
export interface NodeProps<T> {
  /** 构造函数参数 */
  args?: Args<T>;
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
>;

export type BufferGeometryNode<T extends THREE.BufferGeometry, P> = Overwrite<
  Node<T, P>,
  {}
>;
export type MaterialNode<T extends THREE.Material, P> = Overwrite<
  Node<T, P>,
  { color?: Color }
>;
export type LightNode<T extends THREE.Light, P> = Overwrite<
  Object3DNode<T, P>,
  { color?: Color }
>;

export type MeshProps = Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
export type BoxGeometryProps = BufferGeometryNode<
  THREE.BoxGeometry,
  typeof THREE.BoxGeometry
>;
export type MeshBasicMaterialProps = MaterialNode<
  THREE.MeshBasicMaterial,
  typeof THREE.MeshBasicMaterial
>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: MeshProps;
      meshBasicMaterial: MeshBasicMaterialProps;
      boxGeometry: BoxGeometryProps;
    }
  }
}
