import {
  FC,
  useCallback,
  useLayoutEffect,
  useRef,
  useMemo,
  useEffect,
} from 'react'
import {
  RingGeometry,
  MeshBasicMaterial,
  CylinderGeometry,
  MeshPhongMaterial,
  Vector3,
  Mesh,
  XRAnchor,
  Group,
  XRFrame,
  Matrix4,
  SphereBufferGeometry,
  MeshStandardMaterial,
} from 'three'
import { useARManager } from '../hooks'
import { useFrame, useLoader, useStore } from '../../react-3d/hooks'
import { Model } from '../../../components/ARContent/model'
import { getUuid } from '../../react-3d/utils'
import { HitState } from '../manager'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Earth } from '../../../components/visualization/earth'

export const ARHitTest: FC = ({ children }) => {
  const { uiObserver, scene, glRenderer } = useStore()
  const { hitState, onAfterHitTest, depthRawTexture, transformARMaterial } =
    useARManager()

  const reticleRef = useRef<Mesh>()
  const placementNodeRef = useRef<Group>(null!)
  const placementEarthRef = useRef<Group>(null!)
  const placementBingdundunRef = useRef<Group>(null!)
  const placementCylinderRef = useRef<Group>(null!)
  const placementSphereRef = useRef<Group>(null!)

  const selectTypeMap = useMemo(
    () => ({
      sunflower: placementNodeRef,
      cylinder: placementCylinderRef,
      earth: placementEarthRef,
      bingdundun: placementBingdundunRef,
      sphere: placementSphereRef,
    }),
    []
  )

  const placementNodes = useMemo<{ anchor: XRAnchor; anchoredNode: Group }[]>(
    () => [],
    []
  )

  const dMaterial = useMemo(
    () =>
      transformARMaterial(
        new MeshPhongMaterial({ color: 0xffffff }),
        depthRawTexture
      ),
    []
  )

  const onSelect = useCallback(
    (type: 'sphere' | 'cylinder' | 'sunflower' | 'earth' | 'bingdundun') => {
      console.log('select!')

      if (hitState && hitState.position) {
        const position = hitState.position
        const node: Group = !selectTypeMap[type].current.visible
          ? selectTypeMap[type].current
          : selectTypeMap[type].current.clone()
        //@ts-ignore
        hitState.hitTestResult?.createAnchor?.().then((anchor) => {
          node.position.set(position.x, position.y, position.z)
          node.rotation.setFromQuaternion(hitState.rotation)

          placementNodes.push({
            anchor,
            anchoredNode: node,
          })
          node.visible = true

          if (node.visible) {
            scene.add(node)
          }
        })
      }
    },
    []
  )

  const { loadResults } = useLoader<GLTFLoader>(
    GLTFLoader,
    '/models/bingdundun.glb' // BingdundunExpressive
  )

  const { loadResults: flowerLoadResults } = useLoader<GLTFLoader>(
    GLTFLoader,
    '/models/sunflower/sunflower.gltf'
  )

  useEffect(() => {
    if (loadResults) {
      loadResults.forEach((loadResult) => {
        placementBingdundunRef.current.add(loadResult.scene.clone())

        loadResults.forEach((loadResult) => {
          const object = loadResult.scene
          object.traverse((child) => {
            if (child instanceof Mesh) {
              child.castShadow = true
              child.receiveShadow = true
              child.material = transformARMaterial(
                child.material,
                depthRawTexture
              )
            }
          })
        })
      })
    }
  }, [loadResults])

  useEffect(() => {
    if (flowerLoadResults) {
      flowerLoadResults.forEach((flowerLoadResult) => {
        placementNodeRef.current.add(flowerLoadResult.scene.clone())
        flowerLoadResult.scene.traverse((child) => {
          if (child instanceof Mesh) {
            child.castShadow = true
            child.receiveShadow = true
            child.material = transformARMaterial(
              child.material,
              depthRawTexture
            )
          }
        })
      })
    }
  }, [flowerLoadResults])

  useLayoutEffect(() => {
    uiObserver.on('sunflower', () => onSelect('sunflower'))
    uiObserver.on('cylinder', () => onSelect('cylinder'))
    uiObserver.on('earth', () => onSelect('earth'))
    uiObserver.on('bingdundun', () => onSelect('bingdundun'))
    uiObserver.on('sphere', () => onSelect('sphere'))

    // scene.overrideMaterial = dMaterial;

    onAfterHitTest.set(0, (hit: HitState) => {
      if (reticleRef.current && hit.position) {
        reticleRef.current.visible = hit.visible

        reticleRef.current.position.set(
          hit.position.x,
          hit.position.y,
          hit.position.z
        )
        reticleRef.current.rotation.setFromQuaternion(hit.rotation)
      }
    })

    return () => {
      uiObserver.off('sunflower')
      uiObserver.off('cylinder')
      uiObserver.off('earth')
      uiObserver.off('bingdundun')
      uiObserver.off('sphere')

      onAfterHitTest.delete(0)
      placementNodes.forEach((anchorObj) =>
        anchorObj.anchoredNode.removeFromParent()
      )
    }
  }, [])

  useFrame((t?: number, frame?: XRFrame) => {
    if (!frame) {
      return
    }
    for (const { anchor, anchoredNode } of placementNodes) {
      if (!frame.trackedAnchors?.has(anchor)) {
        console.log('没有该追踪目标')
        console.log(frame.trackedAnchors, '\n', anchor)
        continue
      }
      const refSpace = glRenderer.xr.getReferenceSpace()
      if (refSpace) {
        const anchorPose = frame.getPose(anchor.anchorSpace, refSpace)
        if (anchorPose) {
          const position = new Vector3(0, 0, 0).applyMatrix4(
            new Matrix4().fromArray(anchorPose.transform.matrix)
          )
          anchoredNode.position.set(position.x, position.y, position.z)
        }
      }
    }
  })

  return (
    <group>
      <mesh
        ref={reticleRef}
        visible={false}
        geometry={new RingGeometry(0.03, 0.035, 32)
          .rotateX(-Math.PI / 2)
          .translate(0, 0.03, 0)}
        material={dMaterial}
      ></mesh>

      <group visible={false} ref={placementNodeRef}></group>
      <group visible={false} ref={placementCylinderRef}>
        {/* <mesh
          geometry={new CylinderGeometry(0.05, 0.05, 0.3, 32)}
          material={dMaterial}
        ></mesh> */}
        <mesh
          geometry={new SphereBufferGeometry(0.1, 32, 32)}
          castShadow={true}
          material={
            new MeshStandardMaterial({
              roughness: 0.2,
              metalness: 1,
            })
          }
        ></mesh>
      </group>
      <group visible={false} ref={placementSphereRef}>
        <mesh
          geometry={new SphereBufferGeometry(0.15, 32, 32)}
          material={dMaterial}
        ></mesh>
      </group>
      <group visible={false} ref={placementEarthRef}>
        <Earth sphereRadius={0.15} />
      </group>
      <group
        visible={false}
        ref={placementBingdundunRef}
        // scale={{ x: 1.2, y: 1.2, z: 1.2 }}
      ></group>
    </group>
  )
}
