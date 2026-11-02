"use client";

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createDewMaterial, createPetalMaterial } from "./lotusMaterials";

/** 기록 완료 히어로(PetalFallScene)와 같은 연잎·꽃잎 모델 */
const LEAF_URL = "/models/lotus-leaf.glb";
const PETAL_URL = "/models/lotus-petal.glb";

/** 위에서 비스듬히 내려다보는 각도 (2D 연잎 LilyPad의 가로:세로 비율과 같게) */
const ELEVATION = THREE.MathUtils.degToRad(31);
const SIN_E = Math.sin(ELEVATION);
/** 카메라 거리(px 단위) */
const CAMERA_DISTANCE = 10000;
/** 연잎 지름(모델 단위) */
const LEAF_SIZE = 0.2;
/** 연잎 윗면 높이(모델 단위) */
const LEAF_TOP_Y = 0.0052;
/** 꽃잎 길이: 연잎 지름의 약 절반 (모델 단위로 맞춘 배율) */
const PETAL_SCALE = 1.1;
/** 꽃잎을 연잎 쪽으로 뒤로 눕히는 각도 (0이면 보는 사람을 향해 서 있음) */
const PETAL_LEAN = THREE.MathUtils.degToRad(38);
/** 이번 달 연잎 둘레 물결: 고리 수, 한 고리가 퍼졌다 사라지는 시간(초), 퍼지는 크기(연잎 반지름 배) */
const RIPPLE_COUNT = 3;
const RIPPLE_SECONDS = 3.6;
const RIPPLE_FROM = 0.95;
const RIPPLE_TO = 1.75;
/** 활짝 핀 연꽃과 같은 햇빛 세기 */
const FULL_SUN = { value: 1 };

/** 연잎 색 (PetalFallScene과 같은 올리브 그린 + 파스텔) */
const LEAF_COLOR = new THREE.Color("#8a9a5b");
const LEAF_BASE_LUMA: Record<string, number> = { LeafTop: 0.4, LeafUnderside: 0.71 };
const LEAF_PASTEL = { saturation: 1.25, whiten: 0.24 };

function recolorLeaf(material: THREE.MeshStandardMaterial, baseLuma: number) {
  const copy = material.clone();
  const [r, g, b] = LEAF_COLOR.clone().convertLinearToSRGB().toArray();
  const vec = (n: number) => n.toFixed(4);
  const { saturation, whiten } = LEAF_PASTEL;
  copy.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
      vec3 leafSrgb = pow(max(diffuseColor.rgb, 0.0), vec3(1.0 / 2.2));
      float leafLum = dot(leafSrgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 leafColor = vec3(${vec(r)}, ${vec(g)}, ${vec(b)}) * (leafLum / ${vec(baseLuma)});
      vec3 pastelSrgb = clamp(leafColor, 0.0, 1.0);
      float pastelLum = dot(pastelSrgb, vec3(0.2126, 0.7152, 0.0722));
      pastelSrgb = mix(vec3(pastelLum), pastelSrgb, ${saturation.toFixed(2)});
      pastelSrgb = mix(pastelSrgb, vec3(1.0), ${whiten.toFixed(2)});
      diffuseColor.rgb = pow(clamp(pastelSrgb, 0.0, 1.0), vec3(2.2));`,
    );
  };
  copy.customProgramCacheKey = () => `ipetal-garden-leaf-${baseLuma}`;
  return copy;
}

/** 한 달 칸: 연잎 중심(격자 기준 px), 연잎 지름(px), 꽃잎 기울기(도, 연꽃이 핀 달이면 null), 이번 달인지 */
export type GardenSpot = {
  x: number;
  y: number;
  size: number;
  petalTilt: number | null;
  current: boolean;
};

/** 이번 달 둘레의 은은한 금빛 (#ffd677): 가운데가 밝고 가장자리로 사라지는 원 */
function createGlowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  // 가장자리로 갈수록 길게 사라져 경계가 보이지 않게
  gradient.addColorStop(0, "rgba(255, 214, 119, 1)");
  gradient.addColorStop(0.4, "rgba(255, 214, 119, 0.6)");
  gradient.addColorStop(0.75, "rgba(255, 214, 119, 0.12)");
  gradient.addColorStop(1, "rgba(255, 214, 119, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** 이번 달 연잎·연꽃 둘레가 은은하게 금빛으로 빛난다 (수면 위, 연잎 아래에서 천천히 숨 쉬듯) */
function Glow() {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: createGlowTexture(),
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  useEffect(
    () => () => {
      material.map?.dispose();
      material.dispose();
    },
    [material],
  );

  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    (mesh.material as THREE.MeshBasicMaterial).opacity =
      0.82 + 0.16 * Math.sin(clock.elapsedTime * 1.4);
  });

  return (
    <mesh
      ref={ref}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.003, 0]}
      renderOrder={-2}
    >
      {/* 연잎 지름의 약 2.2배 */}
      <planeGeometry args={[LEAF_SIZE * 2.2, LEAF_SIZE * 2.2]} />
    </mesh>
  );
}

/** 이번 달 연잎 둘레로 잔잔히 퍼져 나가는 물결 고리 (수면 위, 연잎 아래) */
function Ripples() {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const geometry = useMemo(() => new THREE.RingGeometry(0.96, 1, 72), []);
  const materials = useMemo(
    () =>
      Array.from(
        { length: RIPPLE_COUNT },
        () =>
          new THREE.MeshBasicMaterial({
            color: "#ffffff",
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
      ),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      materials.forEach((material) => material.dispose());
    },
    [geometry, materials],
  );

  useFrame(({ clock }) => {
    rings.current.forEach((ring, i) => {
      if (!ring) return;
      const p = (((clock.elapsedTime / RIPPLE_SECONDS + i / RIPPLE_COUNT) % 1) + 1) % 1;
      const radius = (LEAF_SIZE / 2) * THREE.MathUtils.lerp(RIPPLE_FROM, RIPPLE_TO, p);
      ring.scale.setScalar(radius);
      // 나타나자마자 옅어지며 퍼진다
      materials[i].opacity = 0.55 * Math.sin(Math.PI * Math.min(1, p * 1.4)) * (1 - p);
    });
  });

  return (
    <>
      {materials.map((material, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            rings.current[i] = mesh;
          }}
          geometry={geometry}
          material={material}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.002, 0]}
          renderOrder={-1}
        />
      ))}
    </>
  );
}

type GardenPadsSceneProps = {
  spots: GardenSpot[];
  /** false면 렌더링을 멈춘다 (화면 밖) */
  active: boolean;
  onReady: () => void;
};

/** 직교 카메라: 1 단위 = 1px, 격자 가운데를 비스듬히 내려다본다 */
function CameraRig() {
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    // 격자가 길어도(맨 아래 칸까지) 카메라 앞에 오도록 충분히 멀리서 본다.
    // 가까우면 아래쪽 칸이 카메라 뒤로 넘어가 잘린다 (직교 카메라라 거리는 크기에 영향 없음)
    camera.position.set(
      0,
      Math.sin(ELEVATION) * CAMERA_DISTANCE,
      Math.cos(ELEVATION) * CAMERA_DISTANCE,
    );
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

/** 모델을 한 번만 손질해 두고, 칸마다 복제해 쓴다 (재질은 함께) */
function usePreparedModels() {
  const { scene: leafSource } = useGLTF(LEAF_URL);
  const { scene: petalSource } = useGLTF(PETAL_URL);

  const leaf = useMemo(() => {
    const copy = leafSource.clone(true);
    copy.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      const baseLuma = LEAF_BASE_LUMA[material.name];
      mesh.material = baseLuma ? recolorLeaf(material, baseLuma) : material.clone();
    });
    return copy;
  }, [leafSource]);

  const petal = useMemo(() => {
    const copy = petalSource.clone(true);
    copy.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      mesh.material =
        mesh.name === "DewDrops" ? createDewMaterial() : createPetalMaterial(material, FULL_SUN);
    });
    // 꽃잎 가운데를 원점에 둔다 (아래 끝을 축으로 기울이기 위해)
    const box = new THREE.Box3().setFromObject(copy);
    const center = box.getCenter(new THREE.Vector3());
    const wrapper = new THREE.Group();
    copy.position.sub(center);
    wrapper.add(copy);
    return { model: wrapper, length: box.max.z - box.min.z };
  }, [petalSource]);

  return { leaf, petal };
}

function Spot({
  spot,
  index,
  models,
}: {
  spot: GardenSpot;
  index: number;
  models: ReturnType<typeof usePreparedModels>;
}) {
  const { width, height } = useThree((state) => state.size);
  const leaf = useMemo(() => models.leaf.clone(true), [models.leaf]);
  const petal = useMemo(() => models.petal.model.clone(true), [models.petal.model]);
  const leafRef = useRef<THREE.Group>(null);
  const petalRef = useRef<THREE.Group>(null);

  // 칸 위치(px) → 바닥면(y=0) 위의 점: 화면에서 아래로 갈수록 보는 사람 쪽(+z)
  const x = spot.x - width / 2;
  const z = (spot.y - height / 2) / SIN_E;
  const scale = spot.size / LEAF_SIZE;
  const petalLength = models.petal.length * PETAL_SCALE;
  // 칸마다 흔들림이 겹치지 않게
  const phase = index * 1.7;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    const g = leafRef.current;
    if (g) {
      // 물 위에 뜬 듯 아주 살짝
      g.rotation.x = Math.sin(t * 0.8) * 0.02;
      g.rotation.z = Math.cos(t * 0.7) * 0.015;
    }
    const p = petalRef.current;
    if (p) {
      // 꽃잎은 아래 끝을 축으로 살랑
      p.rotation.z = Math.sin(t * 1.1) * 0.05;
      p.position.y = Math.sin(t * 1.3) * 0.0015;
    }
  });

  return (
    <group position={[x, 0, z]} scale={scale}>
      {spot.current ? (
        <>
          <Glow />
          <Ripples />
        </>
      ) : null}
      <group ref={leafRef}>
        <primitive object={leaf} />
      </group>
      {spot.petalTilt !== null ? (
        <group position={[0, LEAF_TOP_Y + 0.002, 0]}>
          {/* 화면 기준 축(x 오른쪽, y 위, z 보는 사람 쪽)에서 PETAL_LEAN만큼 연잎 쪽으로 뒤로 눕힌다 */}
          <group rotation={[-ELEVATION - PETAL_LEAN, 0, THREE.MathUtils.degToRad(-spot.petalTilt)]}>
            <group ref={petalRef}>
              {/* 아래 끝이 연잎 가운데에 오도록 꽃잎 절반만큼 올린다 */}
              <group position={[0, petalLength / 2, 0.004]}>
                <group rotation={[Math.PI / 2, 0, 0]} scale={PETAL_SCALE}>
                  <primitive object={petal} />
                </group>
              </group>
            </group>
          </group>
        </group>
      ) : null}
    </group>
  );
}

function Spots({ spots, onReady }: { spots: GardenSpot[]; onReady: () => void }) {
  const models = usePreparedModels();
  const ready = useRef(false);
  useFrame(() => {
    if (ready.current) return;
    ready.current = true;
    onReady();
  });
  return (
    <>
      {spots.map((spot, index) => (
        <Spot key={index} spot={spot} index={index} models={models} />
      ))}
    </>
  );
}

/**
 * 나의 정원(모바일): 열두 달 칸의 3D 연잎과 꽃잎을 캔버스 하나에 그린다.
 * (칸마다 캔버스를 두면 모바일 WebGL 개수 제한에 걸린다)
 * next/dynamic(ssr: false)로만 불러온다 — 서버에는 WebGL이 없다.
 */
export default function GardenPadsScene({ spots, active, onReady }: GardenPadsSceneProps) {
  return (
    <Canvas
      orthographic
      resize={{ offsetSize: true }}
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ zoom: 1, near: 1, far: CAMERA_DISTANCE * 2, position: [0, 0, CAMERA_DISTANCE] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      aria-hidden="true"
    >
      <CameraRig />
      <hemisphereLight args={["#fffafa", "#dfeae2", 1.2]} />
      <directionalLight position={[0.4, 1, 0.6]} intensity={1.8} color="#fffaf3" />
      <directionalLight position={[-0.6, 0.5, 0.3]} intensity={0.6} color="#ffeceb" />
      <Suspense fallback={null}>
        <Spots spots={spots} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(LEAF_URL);
useGLTF.preload(PETAL_URL);
