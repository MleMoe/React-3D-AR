import React, { useEffect, useRef } from 'react';
import './App.css';
import './index.scss';

// import { Camera } from '@mediapipe/camera_utils';
// import {
//   FaceMesh,
//   FACEMESH_TESSELATION,
//   FACEMESH_RIGHT_EYE,
//   FACEMESH_LEFT_EYE,
//   FACEMESH_RIGHT_EYEBROW,
//   FACEMESH_LEFT_EYEBROW,
//   FACEMESH_FACE_OVAL,
//   FACEMESH_LIPS,
// } from '@mediapipe/face_mesh';
import 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
import 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
import 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';

// import { drawConnectors } from '/@mediapipe/drawing_utils';
import { useWindowSize } from './utils/hooks/useWindowSize';

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const windowSize = useWindowSize();
  const { width, height } = windowSize;

  let canvasCtx;
  let camera;

  useEffect(() => {
    console.log(windowSize);
    if (!windowSize) {
      return;
    }

    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });
    faceMesh.setOptions({
      selfieMode: true,
      maxNumFaces: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMesh.onResults(onResults);

    canvasCtx = canvasRef.current.getContext('2d');

    if (typeof videoRef.current !== 'undefined' && videoRef.current !== null) {
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceMesh.send({ image: videoRef.current });
        },
        facingMode: 'environment',
        width: width,
        height: height,
      });
      camera.start();
    }

    // return () => {
    //   camera.stop();
    //   faceMesh.close();
    // };
  }, [windowSize]);

  function onResults(results) {
    // console.log('results:', results);
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.drawImage(results.image, 0, 0, width, height);

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
          color: '#C0C0C070',
          lineWidth: 1,
        });
        // drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {
        //   color: '#FF3030',
        // });
        // drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {
        //   color: '#FF3030',
        // });
        // drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {
        //   color: '#30FF30',
        // });
        // drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {
        //   color: '#30FF30',
        // });
        drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {
          color: '#E0E0E0',
        });
        // drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {
        //   color: '#E0E0E0',
        // });
      }
    }
    canvasCtx.restore();
  }

  return (
    <div className='container'>
      <video ref={videoRef} className='input_video'></video>
      <canvas
        ref={canvasRef}
        id=''
        className='output_canvas'
        width={width}
        height={height}
      ></canvas>
    </div>
  );
}

export default App;
