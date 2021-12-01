import * as THREE from 'three';
import type { UseBoundStore } from 'zustand';

export interface Intersection extends THREE.Intersection {
  eventObject: THREE.Object3D;
}

export type Camera = THREE.OrthographicCamera | THREE.PerspectiveCamera;

export interface IntesectionEvent<TSourceEvent> extends Intersection {
  intersections: Intersection[];
  stopped: boolean;
  unprojectedPoint: THREE.Vector3;
  ray: THREE.Ray;
  camera: Camera;
  stopPropagation: () => void;
  // /**
  //  * @deprecated in favour of nativeEvent. Please use that instead.
  //  */
  // sourceEvent: TSourceEvent;
  nativeEvent: TSourceEvent;
  delta: number;
  spaceX: number;
  spaceY: number;
}

export type ThreeEvent<TEvent> = TEvent & IntesectionEvent<TEvent>;

export type EventHandlers = {
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
  onDoubleClick?: (event: ThreeEvent<MouseEvent>) => void;
  onPointerUp?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerEnter?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerLeave?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerMissed?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerCancel?: (event: ThreeEvent<PointerEvent>) => void;
  onWheel?: (event: ThreeEvent<WheelEvent>) => void;
};
