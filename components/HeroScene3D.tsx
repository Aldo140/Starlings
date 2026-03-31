import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

const AbstractSculpture = () => {
    const mesh1 = useRef<THREE.Mesh>(null!);
    const mesh2 = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Very slow, museum-like rotation
        if (mesh1.current) {
            mesh1.current.rotation.x = Math.sin(t * 0.1) * 0.2;
            mesh1.current.rotation.y += 0.002;
        }
        if (mesh2.current) {
            mesh2.current.rotation.x = Math.sin(t * 0.15) * 0.2;
            mesh2.current.rotation.y -= 0.003;
        }
    });

    return (
        <group position={[0, -0.5, 0]}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                <mesh ref={mesh1} position={[-0.2, 0.5, 0.5]} castShadow receiveShadow>
                    {/* Smooth, pebble-like abstract shape or ceramic ring */}
                    <torusGeometry args={[1.2, 0.4, 64, 100]} />
                    <meshStandardMaterial
                        color="#e3e1d5"
                        roughness={0.7}
                        metalness={0.1}
                    />
                </mesh>

                <mesh ref={mesh2} position={[0.5, -0.2, -0.5]} castShadow receiveShadow>
                    {/* Grounding sphere mass */}
                    <sphereGeometry args={[0.9, 64, 64]} />
                    <meshStandardMaterial
                        color="#d1cac1"
                        roughness={0.9}
                        metalness={0.05}
                    />
                </mesh>
            </Float>
        </group>
    );
};

export const HeroScene3D: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-auto z-0" aria-hidden="true">
            <Canvas shadows camera={{ position: [0, 0, 7], fov: 35 }} gl={{ antialias: true }} dpr={[1, 2]}>
                {/* Crisp beige background mirroring the CSS */}
                <color attach="background" args={['#f3f2eb']} />

                {/* Soft, gallery-style lighting */}
                <ambientLight intensity={0.4} />
                {/* Main dramatic spotlight acting like museum track lighting */}
                <spotLight
                    position={[5, 10, 5]}
                    angle={0.2}
                    penumbra={1}
                    intensity={6}
                    castShadow
                    shadow-mapSize={2048}
                />
                {/* Subtle fill light */}
                <pointLight position={[-5, 0, -5]} intensity={1.5} color="#ffffff" />

                <Environment preset="studio" />

                {/* PresentationControls allowing the user to gently inspect the "sculpture" like viewing art */}
                <PresentationControls
                    global
                    rotation={[0, 0, 0]}
                    polar={[-0.2, 0.2]}
                    azimuth={[-0.5, 0.5]}
                    config={{ mass: 2, tension: 400 }}
                    snap={{ mass: 4, tension: 400 }}
                >
                    <AbstractSculpture />
                </PresentationControls>

                {/* Soft grounding shadow on the museum floor */}
                <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={15} blur={3} far={4} color="#1a1a1a" />
            </Canvas>

            {/* Subtle grain overlay for a physical paper texture feel */}
            <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
        </div>
    );
};

export default HeroScene3D;
