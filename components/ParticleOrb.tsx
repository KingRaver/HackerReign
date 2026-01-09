'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VoiceState } from '../app/lib/voice/voiceStateManager';

interface ParticleOrbProps {
  state: VoiceState;
  audioLevel: number; // 0-1
  beat: number; // 0-1
  disabled?: boolean;
  onClick?: () => void;
}

const ParticleOrb: React.FC<ParticleOrbProps> = ({
  state,
  audioLevel,
  beat,
  disabled = false,
  onClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // Color scheme based on state
  const getStateColor = (state: VoiceState): THREE.Color => {
    switch (state) {
      case 'listening':
        return new THREE.Color(0xff4444); // Red
      case 'processing':
        return new THREE.Color(0xffaa00); // Orange
      case 'thinking':
        return new THREE.Color(0x00ccff); // Cyan
      case 'generating':
        return new THREE.Color(0xffff00); // Yellow
      case 'speaking':
        return new THREE.Color(0x00ffcc); // Cyan
      case 'error':
        return new THREE.Color(0xff0000); // Bright red
      case 'idle':
      default:
        return new THREE.Color(0x20d9a3); // Teal
    }
  };

  const getStateLabel = (state: VoiceState): string => {
    switch (state) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'thinking':
        return 'Thinking...';
      case 'generating':
        return 'Generating voice...';
      case 'speaking':
        return 'Speaking...';
      case 'error':
        return 'Error';
      case 'idle':
      default:
        return 'Ready';
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    camera.position.z = 3;

    // Create particle geometry
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Initialize particles in sphere pattern
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 1.5 + Math.random() * 0.5;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Material
    const material = new THREE.PointsMaterial({
      size: 0.04,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8
    });

    // Create particles
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    particlesRef.current = particles;

    let time = 0;
    let targetColor = getStateColor(state);
    let currentColor = new THREE.Color(targetColor);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Update color based on state
      targetColor = getStateColor(state);
      currentColor.lerp(targetColor, 0.05);
      material.color.copy(currentColor);

      time += 0.016; // ~60fps

      // Particle physics
      const positionArray = geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = positionArray.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;

        // Update position
        positions[idx] += velocities[idx];
        positions[idx + 1] += velocities[idx + 1];
        positions[idx + 2] += velocities[idx + 2];

        // Calculate distance from center
        const x = positions[idx];
        const y = positions[idx + 1];
        const z = positions[idx + 2];
        const distFromCenter = Math.sqrt(x * x + y * y + z * z);

        // Boundary: keep particles in sphere
        const maxRadius = 2.5;
        if (distFromCenter > maxRadius) {
          const scale = maxRadius / distFromCenter;
          positions[idx] *= scale;
          positions[idx + 1] *= scale;
          positions[idx + 2] *= scale;

          // Reverse velocity
          velocities[idx] *= -0.5;
          velocities[idx + 1] *= -0.5;
          velocities[idx + 2] *= -0.5;
        }

        // Apply forces based on state
        if (state === 'listening' || state === 'processing') {
          // Inward force - collapse toward center
          velocities[idx] -= x * 0.001;
          velocities[idx + 1] -= y * 0.001;
          velocities[idx + 2] -= z * 0.001;
        } else if (state === 'speaking') {
          // Outward pulse
          const pulse = 0.5 + 0.5 * Math.sin(time * 3 + i * 0.1);
          velocities[idx] += (x / distFromCenter) * pulse * 0.002;
          velocities[idx + 1] += (y / distFromCenter) * pulse * 0.002;
          velocities[idx + 2] += (z / distFromCenter) * pulse * 0.002;
        }

        // Damping
        velocities[idx] *= 0.98;
        velocities[idx + 1] *= 0.98;
        velocities[idx + 2] *= 0.98;

        // Audio reactivity
        if (audioLevel > 0) {
          const randomForce = (Math.random() - 0.5) * audioLevel * 0.05;
          velocities[idx] += randomForce;
          velocities[idx + 1] += randomForce;
          velocities[idx + 2] += randomForce;
        }

        // Beat pulse
        const beatPulse = beat * 0.2;
        const scale = 1 + beatPulse;
        positions[idx] *= scale;
        positions[idx + 1] *= scale;
        positions[idx + 2] *= scale;
      }

      positionArray.needsUpdate = true;

      // Rotation
      particles.rotation.x += 0.0002;
      particles.rotation.y += 0.0004;

      // Scale based on audio level and beat
      const scale = 1 + audioLevel * 0.3 + beat * 0.2;
      particles.scale.set(scale, scale, scale);

      // Render
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [state, audioLevel, beat]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        onClick={onClick}
        className={`w-48 h-48 rounded-full border-2 border-cyan-light/30 shadow-2xl overflow-hidden ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-cyan-light/60'
        } transition-all duration-200`}
      />
      <div className="text-center">
        <p className="text-white/80 text-sm font-medium">
          {getStateLabel(state)}
        </p>
      </div>
    </div>
  );
};

export default ParticleOrb;