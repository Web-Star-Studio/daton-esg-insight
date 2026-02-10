import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Leaf({ position, rotation }: { position: THREE.Vector3; rotation: [number, number, number] }) {
    return (
        <mesh position={position} rotation={rotation}>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshStandardMaterial
                color="#10b981"
                roughness={0.6}
                metalness={0.2}
            />
        </mesh>
    );
}

function Tree() {
    const groupRef = useRef<THREE.Group>(null);

    // Generate leaves in a crown pattern like the logo
    const leaves = useMemo(() => {
        const leafPositions: Array<{ pos: THREE.Vector3; rot: [number, number, number] }> = [];

        // Create circular layers of leaves forming a crown
        const layers = 4;
        const leavesPerLayer = [12, 10, 8, 6];

        for (let layer = 0; layer < layers; layer++) {
            const radius = 0.8 - layer * 0.15;
            const height = 0.5 + layer * 0.3;
            const numLeaves = leavesPerLayer[layer];

            for (let i = 0; i < numLeaves; i++) {
                const angle = (i / numLeaves) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const y = height + (Math.random() - 0.5) * 0.2;

                leafPositions.push({
                    pos: new THREE.Vector3(x, y, z),
                    rot: [
                        Math.random() * 0.5,
                        Math.random() * Math.PI * 2,
                        Math.random() * 0.5
                    ]
                });
            }
        }

        // Add top leaves
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 0.4;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            leafPositions.push({
                pos: new THREE.Vector3(x, 1.5, z),
                rot: [Math.random() * 0.3, angle, Math.random() * 0.3]
            });
        }

        // Center top leaves
        leafPositions.push({
            pos: new THREE.Vector3(0, 1.7, 0),
            rot: [0, 0, 0]
        });

        return leafPositions;
    }, []);

    // Slow rotation
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.0015;
        }
    });

    return (
        <group ref={groupRef} position={[0, -1, 0]}>
            {/* Trunk - green like the logo */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.2, 1.5, 8]} />
                <meshStandardMaterial
                    color="#10b981"
                    roughness={0.7}
                    metalness={0.1}
                />
            </mesh>

            {/* Base of trunk */}
            <mesh position={[0, -0.75, 0]}>
                <cylinderGeometry args={[0.2, 0.25, 0.2, 8]} />
                <meshStandardMaterial
                    color="#059669"
                    roughness={0.8}
                    metalness={0.1}
                />
            </mesh>

            {/* Leaves forming crown */}
            {leaves.map((leaf, i) => (
                <Leaf key={i} position={leaf.pos} rotation={leaf.rot} />
            ))}
        </group>
    );
}

export function DataTree3D() {
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Canvas
                camera={{ position: [3, 1, 3], fov: 50 }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.7} />
                <directionalLight position={[-3, 3, -3]} intensity={0.3} />
                <pointLight position={[0, 3, 0]} intensity={0.4} color="#10b981" />
                <Tree />
            </Canvas>
        </div>
    );
}
