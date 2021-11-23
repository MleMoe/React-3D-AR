import { useState, useRef } from 'react';
import './App.css';
import { ARButton } from './utils/ARButton';
import { DefaultXRControllers, ARCanvas, useHitTest } from '@react-three/xr';

function HitTestExample() {
  const ref = useRef();

  useHitTest((hit) => {
    hit.decompose(
      ref.current.position,
      ref.current.rotation,
      ref.current.scale
    );
  });

  return null;
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
