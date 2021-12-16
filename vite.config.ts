import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // optimizeDeps: {
  //   exclude: [
  //     '@mediapipe/drawing_utils',
  //     '@mediapipe/face_mesh',
  //     '@mediapipe/camera_utils',
  //   ],
  // },
});
