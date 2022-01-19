import {
  Vector3,
  Matrix4,
  XRSessionInit,
  XRSession,
  XRSessionMode,
  XRHitTestSource,
  XRHitTestResult,
  XRReferenceSpace,
  XRFrame,
  XRPose,
  XRPlane,
  Quaternion,
  XRRigidTransform,
  Material,
  Vector2,
  Shader,
  MeshPhongMaterial,
} from 'three';

export interface XRSystem extends EventTarget {
  isSessionSupported: (sessionMode: XRSessionMode) => Promise<boolean>;
  requestSession: (
    sessionMode: XRSessionMode,
    sessionInit?: any
  ) => Promise<XRSession>;
}

export type XRDepthInformation = {
  width: number;
  height: number;

  normDepthBufferFromNormView: XRRigidTransform;
  rawValueToMeters: number;
};

export type XRCPUDepthInformation = {
  data: ArrayBuffer;

  getDepthInMeters: (column: number, row: number) => number;
} & XRDepthInformation;
