import { Scene } from '../../packages/react-3d/Scene'
import * as THREE from 'three'
import { useState, useRef, useEffect } from 'react'
import { Histogram } from '../../components/visualization/histogram'
import { Pie } from '../../components/visualization/pie'
import { Earth } from '../../components/visualization/earth'
import { Model } from '../../components/ARContent/model'

function App() {
  const [camera] = useState(() => {
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 100, 300)
    return camera
  })
  const gridRef = useRef<THREE.GridHelper>(null!)

  return (
    <Scene camera={camera} control={true}>
      {/* <mesh
        geometry={new THREE.CylinderGeometry(5, 5, 5, 32, 32)}
        material={new THREE.MeshNormalMaterial()}
        position={{ x: 0, y: 0, z: -10 }}
      ></mesh> */}
      <ambientLight paras={[0xeeeeee]} />
      <directionalLight
        paras={[0xffffff, 0.25]}
        position={new THREE.Vector3(
          100 * Math.random() - 0.5,
          100 * Math.random() - 0.5,
          100 * Math.random() - 0.5
        ).normalize()}
      />
      <pointLight
        paras={[0xffffff, 0.15]}
        position={new THREE.Vector3(-100, 100)}
      ></pointLight>
      {/* <Histogram /> */}
      {/* <Pie /> */}
      {/* <Earth sphereRadius={50} /> */}
      {/* <Model
        filepath={'/models/RobotExpressive.glb'}
        scale={{ x: 20, y: 20, z: 20 }}
        position={{ x: -100, y: 0, z: 0 }}
      /> */}
      <Model
        // filepath={'/models/RobotExpressive.glb'}
        scale={{ x: 100, y: 100, z: 100 }}
        position={{ x: 0, y: 0, z: 0 }}
      />
      {/* <Model
        filepath={'/models/RobotExpressive.glb'}
        scale={{ x: 20, y: 20, z: 20 }}
        position={{ x: 100, y: 0, z: 0 }}
      /> */}
      {/* <Model
        filepath={'/models/bingdundun.glb'}
        scale={{ x: 135, y: 135, z: 135 }}
        position={{ x: 20, y: 0, z: 0 }}
      /> */}
      {/* <gridHelper
        ref={gridRef}
        paras={[300, 40, 0x303030, 0x303030]}
        position={{ x: 0, y: 0, z: 0 }}
      /> */}
    </Scene>
  )
}

export default App
