import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      threeWebGLRenderer: {
        width: number;
        height: number;
        antialias: boolean;
        children: React.ReactNode;
      };
      threeScene: { children: React.ReactNode };
      threeMesh: {
        rotation: {
          x: number;
          y: number;
        };
        children: React.ReactNode;
      };
      threeMeshBasicMaterial: {
        parameters: any;
        children?: React.ReactNode;
      };
      threeBoxGeometry: any;
      threePerspectiveCamera: any;
    }
  }
}
