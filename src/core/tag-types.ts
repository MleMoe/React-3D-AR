import React from 'react';
import { InstanceProps } from './renderer';

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
