import { FC, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '../../packages/react-3d/hooks'
import { FrameCallback } from '../../packages/react-3d/loop'
import { Euler } from '../../packages/react-3d/tag-types'

export const ARContent: FC = () => {
  const [rotation, setRotation] = useState<Euler>(() => ({
    x: 0,
    y: 10,
    z: 0,
  }))

  const [width, setWidth] = useState(10)

  const animate: FrameCallback = useCallback(() => {
    setRotation((prev) => ({
      y: (prev.y ?? 0) + 0.01,
    }))
  }, [])

  useFrame(animate)

  return (
    <mesh
      rotation={rotation}
      position={{
        x: 0,
        y: 0,
        z: -50,
      }}
      geometry={new THREE.BoxGeometry(width, width, width)}
      material={new THREE.MeshNormalMaterial()}
      onClick={(event) => {
        console.log('触发单击事件！')
        setWidth((prev) => prev + 1)
      }}
    ></mesh>
  )
}
