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
  function animate() {
    requestAnimationFrame(animate);
    const { glRenderer, camera, scene } = container.getState();

    // 渲染
    camera && glRenderer.render(scene, camera);
  }
  // ？？用 renderer.setAnimationLoop(animate)，click 事件失效

  animate();
}
