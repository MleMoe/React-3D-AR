import { useState, useRef, useMemo } from 'react'

import { Scene } from '../../packages/react-3d/Scene'
import { useFrame, useThree } from '../../packages/react-3d/hooks'

import {
  OrthographicCamera,
  Vector3,
  BoxGeometry,
  MathUtils,
  MeshLambertMaterial,
} from 'three'

import Stats from 'three/examples/jsm/libs/stats.module'

function App() {
  const [camera] = useState(() => {
    const frustumSize = 1000
    const aspect = window.innerWidth / window.innerHeight
    const camera = new OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      1,
      1000
    )
    return camera
  })

  return (
    <Scene camera={camera}>
      {/* <ambientLight paras={[0xeeeeee]} /> */}
      <directionalLight
        paras={[0xffffff, 1]}
        position={new Vector3(1, 1, 1).normalize()}
      />
      <RandomMesh num={2000} />
    </Scene>
  )
}

function RandomMesh({ num = 1 }: { num: number }) {
  const { camera, scene } = useThree()
  const geometry = useMemo(() => {
    return new BoxGeometry(20, 20, 20)
  }, [])

  const stats = useMemo(() => {
    //@ts-ignore
    const statsElement: Stats = new Stats()
    document.body.appendChild(statsElement.dom)
    return statsElement
  }, [])

  const theta = useRef(0)
  const radius = useRef(500)

  useFrame(() => {
    theta.current += 0.1

    camera.position.x =
      radius.current * Math.sin(MathUtils.degToRad(theta.current))
    camera.position.y =
      radius.current * Math.sin(MathUtils.degToRad(theta.current))
    camera.position.z =
      radius.current * Math.cos(MathUtils.degToRad(theta.current))
    camera.lookAt(scene.position)

    camera.updateMatrixWorld()
    stats.update()
  })

  return (
    <>
      {new Array(num).fill(0).map((_, index) => {
        return (
          <mesh
            key={index}
            geometry={geometry}
            material={
              new MeshLambertMaterial({ color: Math.random() * 0xffffff })
            }
            position={{
              x: Math.random() * 800 - 400,
              y: Math.random() * 800 - 400,
              z: Math.random() * 800 - 400,
            }}
            rotation={{
              x: Math.random() * 2 * Math.PI,
              y: Math.random() * 2 * Math.PI,
              z: Math.random() * 2 * Math.PI,
            }}
            scale={{
              x: Math.random() + 0.5,
              y: Math.random() + 0.5,
              z: Math.random() + 0.5,
            }}
          ></mesh>
        )
      })}
    </>
  )
}

export default App
