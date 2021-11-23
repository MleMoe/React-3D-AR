import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // optimizeDeps: {
  //   include: [
  //     '@mediapipe/camera_utils',
  //     '@mediapipe/face_mesh',
  //     '@mediapipe/drawing_utils',
  //   ],
  // },
  // build: {
  //   rollupOptions: {
  //     external: [
  //       '@mediapipe/camera_utils',
  //       '@mediapipe/face_mesh',
  //       '@mediapipe/drawing_utils',
  //     ],
  //   },
  // },
});
