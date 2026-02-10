import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cylinder, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Recursive Branch Component
interface BranchProps {
    position: [number, number, number];
    rotation: [number, number, number];
    length: number;
    radius: number;
    depth: number;
    maxDepth: number;
}

const Branch: React.FC<BranchProps> = ({ position, rotation, length, radius, depth, maxDepth }) => {
    if (depth > maxDepth) return null;

    // Reduce dimensions for next branch
    const nextLength = length * 0.75;
    const nextRadius = radius * 0.7;
    const nextDepth = depth + 1;

    // Angles for branches (2D style: mostly in XY plane)
    const angle = 0.5; // Radians

    return (
        <group position={position} rotation={rotation}>
            {/* Current Branch segment */}
            <Cylinder
                args={[nextRadius, radius, length, 8]}
                position={[0, length / 2, 0]}
            >
                <meshBasicMaterial color="#c4fca1" transparent opacity={0.8 - (depth * 0.1)} />
            </Cylinder>

            {/* Child Branches */}
            <group position={[0, length, 0]}>
                {/* Left Branch */}
                <Branch
                    position={[0, 0, 0]}
                    rotation={[0, 0, angle]}
                    length={nextLength}
                    radius={nextRadius}
                    depth={nextDepth}
                    maxDepth={maxDepth}
                />
                {/* Right Branch */}
                <Branch
                    position={[0, 0, 0]}
                    rotation={[0, 0, -angle]}
                    length={nextLength}
                    radius={nextRadius}
                    depth={nextDepth}
                    maxDepth={maxDepth}
                />
                {/* Middle Branch - smaller */}
                <Branch
                    position={[0, 0, 0]}
                    rotation={[0, 0, 0]}
                    length={nextLength * 0.8}
                    radius={nextRadius}
                    depth={nextDepth}
                    maxDepth={maxDepth}
                />
            </group>
        </group>
    );
};

export const ProceduralTree = () => {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas camera={{ position: [0, 5, 10], fov: 45 }}>
                <ambientLight intensity={1} />
                <group position={[0, -2, 0]}>
                    <Branch
                        position={[0, 0, 0]}
                        rotation={[0, 0, 0]}
                        length={2.5}
                        radius={0.15}
                        depth={0}
                        maxDepth={5}
                    />
                </group>
                <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2} />
            </Canvas>
        </div>
    );
};

export default ProceduralTree;
