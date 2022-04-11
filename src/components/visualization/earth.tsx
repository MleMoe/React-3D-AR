import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { TextureLoader } from 'three'
import { useFrame, useLoader, useThree } from '../../packages/react-3d/hooks'
import { FrameCallback } from '../../packages/react-3d/loop'
import { Euler, Vector3 } from '../../packages/react-3d/tag-types'
import no_clouds from './assets/no_clouds.jpg'

export const Earth: FC<{ sphereRadius?: number; position?: Vector3 }> = ({
  sphereRadius,
  position,
}) => {
  // const { orbitControl } = useThree();
  const [radius, setRadius] = useState(sphereRadius || 50)
  const [rotation, setRotation] = useState<Euler>({ x: 0, y: 0, z: 0 })

  const { loadResults } = useLoader<TextureLoader>(
    TextureLoader,
    [no_clouds],
    (xhr) => {
      if (xhr.lengthComputable) {
        const percentComplete = (xhr.loaded / xhr.total) * 100
        console.log(Math.round(percentComplete) + '% downloaded')
      }
    }
  )

  const material = useMemo(() => {
    if (loadResults) {
      return new THREE.MeshBasicMaterial({
        map: loadResults[0],
      })
    }
  }, [loadResults])

  const animate: FrameCallback = useCallback(() => {
    setRotation((prev) => ({
      y: (prev.y ?? 0) + 0.01,
    }))
  }, [])

  useFrame(animate)

  return material ? (
    <mesh
      geometry={new THREE.SphereGeometry(radius, 64, 64)}
      material={material}
      position={position || { x: 0, y: 0, z: 0 }}
      rotation={rotation}
      onClick={(event) => {
        console.log(event)
        setRadius((prev) => prev + 1)
      }}
    ></mesh>
  ) : null
}
