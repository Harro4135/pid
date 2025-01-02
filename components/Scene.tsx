import { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useHelper } from '@react-three/drei'
import * as THREE from 'three'

function Pillar({ position, rotation }) {
  const meshRef = useRef()
  useHelper(meshRef, THREE.BoxHelper, 'cyan')

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <cylinderGeometry args={[0.5, 0.5, 4, 32]} />
      <meshStandardMaterial color="lightblue" />
    </mesh>
  )
}

interface PIDControllerProps {
  kp: number;
  ki: number;
  kd: number;
  disturbance: number;
  setpoint: number;
  onUpdate: (data: { error: number; output: number }) => void;
}

function PIDController({ kp, ki, kd, disturbance, setpoint, onUpdate }: PIDControllerProps) {
  const pillarRef = useRef<THREE.Mesh>(null)
  const pidState = useRef({ integral: 0, prevError: 0 })

  useFrame((state, delta) => {
    if (pillarRef.current) {
      const targetRotation = setpoint
      const currentRotation = pillarRef.current.rotation.x

      const error = targetRotation - currentRotation + disturbance

      pidState.current.integral += error * delta
      const derivative = (error - pidState.current.prevError) / delta

      const output = kp * error + ki * pidState.current.integral + kd * derivative

      pillarRef.current.rotation.x += output * delta

      pidState.current.prevError = error

      onUpdate({ error, output: pillarRef.current.rotation.x })
    }
  })

  return <Pillar ref={pillarRef} position={[0, 0, 0]} rotation={[0, 0, 0]} />
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="green" />
    </mesh>
  )
}

function Scene({ kp, ki, kd, disturbance, setpoint, onUpdate }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 5, 10)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <PIDController kp={kp} ki={ki} kd={kd} disturbance={disturbance} setpoint={setpoint} onUpdate={onUpdate} />
      <Ground />
      <OrbitControls />
    </>
  )
}

export default function SceneWrapper(props) {
  return (
    <Canvas>
      <Scene {...props} />
    </Canvas>
  )
}

