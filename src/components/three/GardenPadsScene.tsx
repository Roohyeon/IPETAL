"use client";

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PAD_BOB_HEIGHT, padBob } from "@/components/garden/padBob";
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
/**
 * 수면 위 그림자·금빛·물결은 연잎보다 이만큼 아래(모델 단위)에 깐다.
 * 연잎이 둥둥 오르내려도(±PAD_BOB_HEIGHT) 늘 연잎 아래라 잎 위로 넘치지 않는다.
 * 낮춘 만큼 안쪽(z)으로 옮겨 화면에서 보이는 자리는 그대로 둔다.
 */
const WATER_Y = -0.012;
const waterAt = (x: number, z: number): [number, number, number] => [
  x,
  WATER_Y,
  z + WATER_Y / Math.tan(ELEVATION),
];

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
/** 홈 기록 완료 화면(PetalFallScene) 연잎과 같은 색 */
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

/**
 * 이번 달 연잎 둘레로 잔잔히 퍼져 나가는 물결 고리.
 * 수면(WATER_Y)에 깔려 연잎에 가려진다
 */
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
      ring.scale.setScalar((LEAF_SIZE / 2) * THREE.MathUtils.lerp(RIPPLE_FROM, RIPPLE_TO, p));
      // 나타나자마자 옅어지며 퍼진다
      (ring.material as THREE.MeshBasicMaterial).opacity =
        0.55 * Math.sin(Math.PI * Math.min(1, p * 1.4)) * (1 - p);
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
          position={waterAt(0, 0)}
          renderOrder={-1}
        />
      ))}
    </>
  );
}

/** 한 달 칸: 연잎 중심(격자 기준 px), 연잎 지름(px), 꽃잎 기울기(도, 연꽃이 핀 달이면 null), 이번 달인지 */
export type GardenSpot = {
  x: number;
  y: number;
  size: number;
  petalTilt: number | null;
  current: boolean;
};

/**
 * 물 위에 떠 있는 느낌
 * - 그림자: 연잎 아래 수면에 흐릿하게, 햇살 반대편(오른쪽 아래)으로 살짝 비켜서
 * - 둥둥: 연잎·꽃잎이 아주 미세하게 위아래로 (그림자는 수면에 그대로) — padBob.ts
 */
let waterTextures: { shadow: THREE.CanvasTexture } | null = null;

function radialTexture(stops: [number, string][]) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** 한 번만 만들어 모든 연잎이 함께 쓴다 */
function getWaterTextures() {
  waterTextures ??= {
    shadow: radialTexture([
      [0, "rgba(14, 58, 60, 0.95)"],
      [0.62, "rgba(14, 58, 60, 0.75)"],
      [0.82, "rgba(14, 58, 60, 0.3)"],
      [1, "rgba(14, 58, 60, 0)"],
    ]),
  };
  return waterTextures;
}

/**
 * 연잎 아래 수면 그림자.
 * 수면(WATER_Y)에 깔려 연잎에 가려진다 → 잎 위로 물이 넘쳐 보이지 않는다
 */
function WaterContact() {
  const { shadow } = useMemo(() => getWaterTextures(), []);
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={waterAt(LEAF_SIZE * 0.09, LEAF_SIZE * 0.16)}
        renderOrder={-3}
      >
        <planeGeometry args={[LEAF_SIZE * 1.4, LEAF_SIZE * 1.4]} />
        <meshBasicMaterial
          map={shadow}
          transparent
          opacity={0.4}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

/**
 * 이번 달 둘레의 은은한 금빛 (#ffd677).
 * 연잎 아래(가운데)는 비워 두어 잎의 갈라진 틈으로 금빛 얼룩이 비치지 않게,
 * 잎 가장자리(반지름 약 0.45) 바로 바깥에서 가장 밝고 바깥으로 길게 사라진다
 */
function createGlowTexture() {
  return radialTexture([
    [0, "rgba(255, 214, 119, 0)"],
    [0.36, "rgba(255, 214, 119, 0)"],
    [0.47, "rgba(255, 214, 119, 0.75)"],
    [0.7, "rgba(255, 214, 119, 0.2)"],
    [1, "rgba(255, 214, 119, 0)"],
  ]);
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
      position={waterAt(0, 0)}
      renderOrder={-2}
    >
      {/* 연잎 지름의 약 2.2배 */}
      <planeGeometry args={[LEAF_SIZE * 2.2, LEAF_SIZE * 2.2]} />
    </mesh>
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
  const bobRef = useRef<THREE.Group>(null);

  // 칸 위치(px) → 바닥면(y=0) 위의 점: 화면에서 아래로 갈수록 보는 사람 쪽(+z)
  const x = spot.x - width / 2;
  const z = (spot.y - height / 2) / SIN_E;
  const scale = spot.size / LEAF_SIZE;
  const petalLength = models.petal.length * PETAL_SCALE;

  // 둥둥: 연잎·꽃잎이 함께 아주 미세하게 위아래로만 (연꽃과 같은 박자, 기울거나 출렁이지 않는다)
  useFrame(() => {
    const bob = bobRef.current;
    if (bob) bob.position.y = padBob(index, performance.now() / 1000) * PAD_BOB_HEIGHT;
  });

  return (
    <group position={[x, 0, z]} scale={scale}>
      {spot.current ? (
        <>
          <Glow />
          <Ripples />
        </>
      ) : null}
      <WaterContact />
      {/* 둥둥: 그림자는 수면에 두고 연잎·꽃잎만 */}
      <group ref={bobRef}>
        <primitive object={leaf} />
        {spot.petalTilt !== null ? (
          <group position={[0, LEAF_TOP_Y + 0.002, 0]}>
            {/* 화면 기준 축(x 오른쪽, y 위, z 보는 사람 쪽)에서 PETAL_LEAN만큼 연잎 쪽으로 뒤로 눕힌다 */}
            <group
              rotation={[-ELEVATION - PETAL_LEAN, 0, THREE.MathUtils.degToRad(-spot.petalTilt)]}
            >
              {/* 아래 끝이 연잎 가운데에 오도록 꽃잎 절반만큼 올린다 */}
              <group position={[0, petalLength / 2, 0.004]}>
                <group rotation={[Math.PI / 2, 0, 0]} scale={PETAL_SCALE}>
                  <primitive object={petal} />
                </group>
              </group>
            </group>
          </group>
        ) : null}
      </group>
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
      {/* 홈 기록 완료 화면과 같은 조명 (연잎이 탁해 보이지 않게) */}
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
