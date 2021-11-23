import { useState, useRef } from 'react';
import logo from './logo.svg';
import './App.css';
// import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { DefaultXRControllers, ARCanvas, useHitTest } from '@react-three/xr';
import { Box } from '@react-three/drei';

function HitTestExample() {
  const ref = useRef(null!);

  useHitTest((hit) => {
    hit.decompose(
      ref.current.position,
      ref.current.rotation,
      ref.current.scale
    );
  });

  return <Box ref={ref} args={[0.1, 0.1, 0.1]} />;
}

function App() {
  return (
    <ARCanvas sessionInit={{ requiredFeatures: ['hit-test'] }}>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <HitTestExample />
      <DefaultXRControllers />
    </ARCanvas>
  );
}

export default App;
