"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * 연못 배경 그림을 물결처럼 일렁이게 그린다 (화면 전체, 셰이더 한 장).
 * 그림은 object-fit: cover처럼 화면을 꽉 채우고, 겹친 사인파로 UV를 아주 조금씩 흔든다.
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform vec2 uScale;
  varying vec2 vUv;

  void main() {
    // cover: 화면 비율에 맞춰 가운데를 잘라 쓴다
    vec2 uv = (vUv - 0.5) * uScale + 0.5;
    float t = uTime;
    // 여러 방향의 잔물결을 겹쳐 자연스럽게 (진폭은 그림 크기의 0.2~0.4%)
    vec2 wave = vec2(
      sin(uv.y * 22.0 + t * 1.1) * 0.0032 + sin((uv.x + uv.y) * 37.0 - t * 1.6) * 0.0016,
      cos(uv.x * 19.0 - t * 0.9) * 0.0030 + sin((uv.x - uv.y) * 31.0 + t * 1.3) * 0.0014
    );
    vec3 color = texture2D(uMap, clamp(uv + wave, 0.002, 0.998)).rgb;
    // 물결 마루에 아주 옅은 반짝임
    float glint = smoothstep(0.55, 1.0, sin(uv.y * 22.0 + t * 1.1) * sin(uv.x * 19.0 - t * 0.9));
    color += glint * 0.035;
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

function Water({ src, onReady }: { src: string; onReady: () => void }) {
  const texture = useLoader(THREE.TextureLoader, src);
  const size = useThree((state) => state.size);
  const ref = useRef<THREE.Mesh>(null);
  const ready = useRef(false);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: texture },
          uTime: { value: 0 },
          uScale: { value: new THREE.Vector2(1, 1) },
        },
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
      }),
    [texture],
  );

  useEffect(() => () => material.dispose(), [material]);

  /** 메시에 붙은 셰이더 재질 (그리는 중에 값을 바꿀 때는 이것으로) */
  const shader = () => ref.current?.material as THREE.ShaderMaterial | undefined;

  // 그림은 sRGB 색. cover 비율: 화면이 그림보다 가로로 길면 세로를, 아니면 가로를 잘라낸다
  useEffect(() => {
    const current = shader();
    if (!current) return;
    const map = current.uniforms.uMap.value as THREE.Texture;
    if (map.colorSpace !== THREE.SRGBColorSpace) {
      map.colorSpace = THREE.SRGBColorSpace;
      map.needsUpdate = true;
    }
    const image = map.image as { width: number; height: number };
    const screen = size.width / size.height;
    const picture = image.width / image.height;
    (current.uniforms.uScale.value as THREE.Vector2).set(
      screen < picture ? screen / picture : 1,
      screen < picture ? 1 : picture / screen,
    );
  }, [material, size.width, size.height]);

  useFrame(({ clock }) => {
    const current = shader();
    if (!current) return;
    current.uniforms.uTime.value = clock.elapsedTime;
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  });

  return (
    <mesh ref={ref} material={material} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

/** next/dynamic(ssr: false)로만 불러온다 — 서버에는 WebGL이 없다 */
export default function PondWaterScene({ src, onReady }: { src: string; onReady: () => void }) {
  return (
    <Canvas
      dpr={1}
      gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
      flat
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Water src={src} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
