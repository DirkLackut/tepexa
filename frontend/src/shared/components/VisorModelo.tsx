import { Component, Suspense, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { AvatarArticulado, DronAnimado, ModeloDelEquipo, useModelosDelEquipo } from '../3d/index.js'

class LimiteDeError extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  render() { return this.state.error ? null : this.props.children }
}

/** Un modelo del equipo (por id de /models/manifest.json) girando con luz de estudio. Se carga solo cuando se usa. */
/** `articulado`: avatar con caminata o reposo (ver AvatarArticulado). `traje`: casco y mochila. El dron siempre aletea. */
export default function VisorModelo({ id, fondo = '#F8FAFC', girar = true, perfil, articulado = false, traje = false, ritmo = 'caminar' }: {
  id: string; fondo?: string; girar?: boolean; perfil?: 'pc' | 'movil'; articulado?: boolean; traje?: boolean; ritmo?: 'caminar' | 'reposo'
}) {
  const { modelos } = useModelosDelEquipo()
  const modelo = modelos?.find((m: any) => m.id === id)
  return (
    <Canvas shadows camera={{ position: [4, 3, 5], fov: 40 }} dpr={[1, 2]} style={{ position: 'absolute', inset: 0 }}>
      <color attach="background" args={[fondo]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 4]} intensity={2} castShadow />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, -6]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffd9b8" position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>
      <OrbitControls makeDefault autoRotate={girar} autoRotateSpeed={0.6} enableDamping />
      {modelo && (
        <LimiteDeError>
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.2}>
              {id === 'drone' ? <DronAnimado modelo={modelo} envergadura={4} />
                : articulado ? <AvatarArticulado key={id + (perfil ?? '') + traje} modelo={modelo} perfil={perfil ?? 'pc'} tamano={4} traje={traje} ritmo={ritmo} sombras />
                : <ModeloDelEquipo key={id + (perfil ?? '')} modelo={modelo} perfil={perfil} tamano={4} />}
            </Bounds>
          </Suspense>
        </LimiteDeError>
      )}
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={10} blur={2.2} far={4} />
    </Canvas>
  )
}
