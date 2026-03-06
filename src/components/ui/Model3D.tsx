import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import * as THREE from 'three';

// Carrega OBJ com MTL (textura)
function OBJWithMTL({
  objPath,
  mtlPath,
  scale = 1,
  color,
}: {
  objPath: string;
  mtlPath?: string;
  scale?: number;
  color?: string;
}) {
  const group = useRef<THREE.Group>(null!);

  const materials = mtlPath ? useLoader(MTLLoader, mtlPath) : null;
  const obj = useLoader(OBJLoader, objPath, (loader) => {
    if (materials) {
      materials.preload();
      (loader as OBJLoader).setMaterials(materials);
    }
  });

  const scene = useMemo(() => {
    const clone = obj.clone();

    // Se não tiver MTL, aplica cor sólida
    if (!mtlPath && color) {
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.5,
            metalness: 0.3,
          });
        }
      });
    }

    // Centraliza e escala
    const box = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clone.position.sub(center);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) clone.scale.setScalar((scale * 1.6) / maxDim);

    return clone;
  }, [obj, color, scale, mtlPath]);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.5;
  });

  return <group ref={group}><primitive object={scene} /></group>;
}

// Planeta simples (esfera) para quando não tem OBJ
function SimplePlanet({ color = '#6c63ff' }: { color?: string }) {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.6;
  });
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.9, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
    </mesh>
  );
}

// Loader fallback
function LoadingMesh({ color = '#6c63ff' }: { color?: string }) {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.8;
  });
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.7, 12, 12]} />
      <meshStandardMaterial color={color} wireframe opacity={0.5} transparent />
    </mesh>
  );
}

export type Model3DProps = {
  objPath?: string;
  mtlPath?: string;
  scale?: number;
  color?: string;
  width?: number;
  height?: number;
};

export default function Model3D({
  objPath,
  mtlPath,
  scale = 1,
  color = '#6c63ff',
  width = 60,
  height = 60,
}: Model3DProps) {
  return (
    <div style={{ width, height, flexShrink: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 4, 4]} intensity={1.4} />
        <pointLight position={[-3, 2, 3]} intensity={0.6} color="#00d9ff" />
        <Suspense fallback={<LoadingMesh color={color} />}>
          {objPath ? (
            <OBJWithMTL objPath={objPath} mtlPath={mtlPath} scale={scale} color={color} />
          ) : (
            <SimplePlanet color={color} />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
