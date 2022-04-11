import { FC, useEffect, useMemo, useRef } from 'react'
import {
  CubeTextureLoader,
  LightProbe,
  sRGBEncoding,
  MeshStandardMaterial,
  DirectionalLight,
  LineBasicMaterial,
  DoubleSide,
  MeshBasicMaterial,
  ShapeGeometry,
  Object3D,
  BufferGeometry,
  Line,
  Group,
  AmbientLight,
} from 'three'
import {
  useFrame,
  useLoader,
  useStore,
  useThree,
} from '../../packages/react-3d/hooks'

import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator'
import { Model } from '../../components/ARContent/model'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'

const genCubeUrls = function (prefix: string, postfix: string) {
  return [
    prefix + 'px' + postfix,
    prefix + 'nx' + postfix,
    prefix + 'py' + postfix,
    prefix + 'ny' + postfix,
    prefix + 'pz' + postfix,
    prefix + 'nz' + postfix,
  ]
}

export const Landing: FC<{
  data?: number[]
  onSessionStart?: () => void
}> = ({ onSessionStart }) => {
  const { uiObserver } = useStore()
  const { scene, orbitControl } = useThree()
  const textGroupRef = useRef<Group>()

  const { loadResults: fontResults } = useLoader<FontLoader>(
    FontLoader,
    '/fonts/Parisienne_Regular.json'
  )

  const [material, matLite, matDark] = useMemo(
    () => [
      new MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.0,
        envMapIntensity: 1,
      }),
      new MeshBasicMaterial({
        color: 0x006699,
        transparent: true,
        opacity: 0.6,
        side: DoubleSide,
      }),
      new LineBasicMaterial({
        color: 0x00b51a,
        side: DoubleSide,
      }),
    ],
    []
  )

  const { shapes, textGeometry, xMid } = useMemo(() => {
    if (!fontResults?.length) return { xMid: 0 }

    const font = fontResults[0]
    const message = 'AR\nTravel'
    const shapes = font.generateShapes(message, 0.12)

    const textGeometry = new ShapeGeometry(shapes)

    textGeometry.computeBoundingBox()
    let xMid = 0
    if (textGeometry.boundingBox) {
      xMid =
        -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x)
      textGeometry.translate(xMid, 0, 0)
    }

    return { font, shapes, textGeometry, xMid }
  }, [fontResults])

  useEffect(() => {
    console.log('绘制')
    if (orbitControl) {
      orbitControl.enableZoom = false
      orbitControl.target.set(0, 0, -0.9)
      // orbitControl.autoRotate = true;
    }

    const directionalLight = new DirectionalLight(0xffffff, 0.2)
    directionalLight.position.set(-5, 5, -5)
    directionalLight.lookAt(0, 0, -5)
    scene.add(directionalLight)

    const lightProbe = new LightProbe()
    scene.add(lightProbe)

    const urls = genCubeUrls('/textures/cube/pisa/', '.png')
    new CubeTextureLoader().load(urls, (cubeTexture) => {
      cubeTexture.encoding = sRGBEncoding
      // scene.background = cubeTexture;
      material.envMap = cubeTexture
      lightProbe.copy(LightProbeGenerator.fromCubeTexture(cubeTexture))
    })

    return () => {
      scene.remove(lightProbe)
      scene.remove(directionalLight)
    }
  }, [])

  useEffect(() => {
    const lineText = new Object3D()

    if (shapes?.length) {
      // make line shape ( N.B. edge view remains visible )

      const holeShapes = []

      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i]

        if (shape.holes && shape.holes.length > 0) {
          for (let j = 0; j < shape.holes.length; j++) {
            const hole = shape.holes[j]
            holeShapes.push(hole)
          }
        }
      }

      // @ts-ignore
      shapes.push.apply(shapes, holeShapes)

      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i]

        const points = shape.getPoints()
        const geometry = new BufferGeometry().setFromPoints(points)

        geometry.translate(xMid, 0, 0)

        const lineMesh = new Line(geometry, matDark)
        lineText.add(lineMesh)
      }

      lineText.position.set(0, 0.17, -0.85)
      // lineText.scale.set(0.95, 0.95, 0.95);

      textGroupRef.current?.add(lineText)
      // lineText.scale.set(1.2, 1.2, 1.2);
    }
    return () => {
      lineText.remove(lineText)
    }
  }, [shapes])

  useFrame(() => {
    orbitControl?.update()
  })

  return (
    <>
      {/* <mesh
        geometry={new SphereBufferGeometry(0.12, 64, 32)}
        material={material}
        position={{
          x: 0,
          y: 0,
          z: -1,
        }}
      ></mesh> */}
      <group
        ref={textGroupRef}
        onClick={() => {
          console.log('click')
          // uiObserver.emit('startSession');
          // onSessionStart?.();
        }}
      >
        {textGeometry && matLite && (
          <mesh
            geometry={textGeometry}
            material={matLite}
            position={{
              x: 0,
              y: 0.18,
              z: -0.99,
            }}
          ></mesh>
        )}
        <ambientLight paras={[0xffffff]} />

        <Model
          // rotation={{ x: 0, y: -Math.PI / 4, z: 0 }}
          // position={{ x: 0.15, y: -0.5, z: -1.5 }}
          position={{ x: 0, y: 0.15, z: -0.9 }}
          scale={{ x: 0.1, y: 0.1, z: 0.1 }}
        />
      </group>
    </>
  )
}
