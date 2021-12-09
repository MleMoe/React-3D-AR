import { useEffect } from 'react';
import { RootState } from './store';
import { UseBoundStore } from 'zustand';

/**
 * 渲染场景
 * @param container root 信息
 */
export function glRender(container: UseBoundStore<RootState>) {
  const state = container.getState();

  const { glRenderer, camera, scene } = state;
  // 渲染
  camera && glRenderer.render(scene, camera);
}

export function animateLoop(container: UseBoundStore<RootState>) {
  const { glRenderer, camera, scene } = container.getState();

  function animate() {
    // 渲染
    glRenderer.render(scene, camera);
  }
  glRenderer.setAnimationLoop(animate);
  animate();
}
