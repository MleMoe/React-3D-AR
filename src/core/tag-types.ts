import React from 'react';
import { InstanceProps } from './renderer';
import * as THREE from 'three';

// 欧拉角 x, y, z
type Euler = THREE.Euler | Parameters<THREE.Euler['set']>;
// 四维矩阵 [ number * 16 ]
export type Matrix4 = THREE.Matrix4 | Parameters<THREE.Matrix4['set']>;
// x, y
export type Vector2 = THREE.Vector2 | Parameters<THREE.Vector2['set']>;
export type Vector3 = THREE.Vector3 | Parameters<THREE.Vector3['set']>;
export type Vector4 = THREE.Vector4 | Parameters<THREE.Vector4['set']>;

// 0x00ff00 或 #00ff00
export type Color = number | string;

type Args<T> = T extends new (...args: any) => any
  ? ConstructorParameters<T>
  : T;
export interface NodeProps<T, P> {
  /** 构造函数参数 */
  args?: Args<P>;
  children?: React.ReactNode;
  ref?: React.Ref<React.ReactNode>;
  key?: React.Key;
  onUpdate?: (self: T) => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // threeWebGLRenderer: {
      //   width: number;
      //   height: number;
      //   antialias: boolean;
      //   children: React.ReactNode;
      // };
      // threeScene: { children: React.ReactNode };
      mesh: InstanceProps;
      meshBasicMaterial: InstanceProps;
      boxGeometry: InstanceProps;
      threePerspectiveCamera: any;
    }
  }
}
