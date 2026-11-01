"use client";

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createDewMaterial, createPetalMaterial } from "./lotusMaterials";

const LEAF_URL = "/models/lotus-leaf.glb";
const PETAL_URL = "/models/lotus-petal.glb";

/** 위에서 비스듬히 내려다보는 각도 */
const ELEVATION = THREE.MathUtils.degToRad(26);
/** 연잎 지름(모델 단위) — 화면 폭의 몇 %로 보일지 정하는 기준 */
const LEAF_SIZE = 0.2;
const LEAF_SCREEN_RATIO = 0.7;
/** 연잎 중심이 캔버스 아래 끝에서 떨어진 거리(px) */
const LEAF_BOTTOM_PX = 72;

/**
 * 꽃잎 움직임
 * 1) 앞면(이슬 맺힌 안쪽 면)을 보는 사람 쪽으로, 대각선으로 기운 채 천천히 내려오다
 * 2) 연잎에 닿지 않고 바로 위에서 깃털처럼 살살 떠 있는다
 */
const FALL_SECONDS = 4;
/**
 * 떨어지는 속도 곡선: 헤더에서 살며시 출발 → 중간에 가장 빠르게(떨어지는 느낌)
 * → 연잎에 가까워질수록 길게 잦아든다. 속도 ∝ p·(1-p)^2.6 을 누적해 0~1 진행도로 만든다.
 */
const FALL_CURVE = (() => {
  const steps = 240;
  const table = [0];
  let sum = 0;
  for (let i = 1; i <= steps; i++) {
    const p = (i - 0.5) / steps;
    sum += p * Math.pow(1 - p, 2.6);
    table.push(sum);
  }
  return table.map((v) => v / sum);
})();

function fallProgress(p: number) {
  const x = THREE.MathUtils.clamp(p, 0, 1) * (FALL_CURVE.length - 1);
  const i = Math.floor(x);
  const next = FALL_CURVE[Math.min(i + 1, FALL_CURVE.length - 1)];
  return FALL_CURVE[i] + (next - FALL_CURVE[i]) * (x - i);
}
/**
 * 이 진행도(0~1)를 넘으면 내려앉은 것으로 본다.
 * 속도 곡선상 뒤쪽은 아주 느리게 잦아들어, 0.6쯤이면 이미 연잎 바로 위다 (토스트·점수를 일찍 보여주려고)
 */
const LANDED_AT = 0.6;
/** 연잎이 페이드인되는 시간(초) */
const LEAF_FADE_SECONDS = 1.2;
/** 활짝 핀 Hero 연꽃과 같은 햇빛 세기 */
const FULL_SUN = { value: 1 };
/** 대각선 기울기 (화면 기준, 라디안) — 음수면 위쪽 끝이 오른쪽으로 */
const DIAGONAL = -0.62;
/** 살랑임: 한 번 왕복하는 시간(초), 좌우 폭, 양 끝에서 떠오르는 높이, 기울어지는 정도 */
const SWAY_PERIOD = 4.6;
const SWAY_WIDTH = 0.014;
const SWAY_LIFT = 0.004;
const SWAY_TILT = 0.1;
/** 떠 있는 동안 위아래로 둥둥 (폭, 주기 초) */
const BOB_HEIGHT = 0.0035;
const BOB_PERIOD = 5.2;
const PETAL_SCALE = 1.25;
/** 꽃잎 모델 세로 길이 (z 방향 0.0925) × 크기 */
const PETAL_LENGTH = 0.0925 * PETAL_SCALE;
/** 연잎 윗면 */
const LEAF_TOP_Y = 0.0052;
/**
 * 떠 있는 높이(꽃잎 중심): 세워진 꽃잎의 아래 끝이 연잎 윗면 바로 위에 오도록
 * (화면에서 꽃잎 절반 높이 ÷ 내려다보는 각도 보정) + 작은 틈
 */
const FLOAT_GAP = 0.022;
const FLOAT_Y =
  LEAF_TOP_Y + ((PETAL_LENGTH / 2) * Math.cos(DIAGONAL)) / Math.cos(ELEVATION) + FLOAT_GAP;

/**
 * 연잎 색: 올리브 그린(#8a9a5b, --color-olive)에 가깝게.
 * 텍스처의 밝고 어두운 결은 살리고 색만 바꾼다.
 * 값 = 재질별 원래 평균 밝기(sRGB) — 이 밝기일 때 정확히 #8a9a5b가 된다.
 */
const LEAF_COLOR = new THREE.Color("#8a9a5b");
const LEAF_BASE_LUMA: Record<string, number> = { LeafTop: 0.4, LeafUnderside: 0.71 };

/**
 * 파스텔 톤: 보이는 색(sRGB) 기준으로 채도를 낮추고 흰빛을 섞는다.
 * map_fragment 바로 뒤에 넣는 GLSL (diffuseColor는 선형 공간).
 */
type Pastel = { saturation: number; whiten: number };
const LEAF_PASTEL: Pastel = { saturation: 1.25, whiten: 0.24 };

function pastelGlsl({ saturation, whiten }: Pastel) {
  return `
      vec3 pastelSrgb = pow(max(diffuseColor.rgb, 0.0), vec3(1.0 / 2.2));
      float pastelLum = dot(pastelSrgb, vec3(0.2126, 0.7152, 0.0722));
      pastelSrgb = mix(vec3(pastelLum), pastelSrgb, ${saturation.toFixed(2)});
      pastelSrgb = mix(pastelSrgb, vec3(1.0), ${whiten.toFixed(2)});
      diffuseColor.rgb = pow(clamp(pastelSrgb, 0.0, 1.0), vec3(2.2));`;
}

function recolorLeaf(material: THREE.MeshStandardMaterial, baseLuma: number) {
  const copy = material.clone();
  // Color는 선형 공간 값 → 셰이더 안에서 sRGB로 비교한다
  const [r, g, b] = LEAF_COLOR.clone().convertLinearToSRGB().toArray();
  const vec = (n: number) => n.toFixed(4);
  copy.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
      // 보이는 색(sRGB) 기준: 원래 밝기 비율만 남기고 올리브 그린으로 칠한 뒤 다시 선형 공간으로
      vec3 leafSrgb = pow(max(diffuseColor.rgb, 0.0), vec3(1.0 / 2.2));
      float leafLum = dot(leafSrgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 leafColor = vec3(${vec(r)}, ${vec(g)}, ${vec(b)}) * (leafLum / ${vec(baseLuma)});
      diffuseColor.rgb = pow(clamp(leafColor, 0.0, 1.0), vec3(2.2));${pastelGlsl(LEAF_PASTEL)}`,
    );
  };
  copy.customProgramCacheKey = () => `ipetal-leaf-olive-${baseLuma}`;
  return copy;
}

/** 떠 있는 꽃잎이 연잎 위에 드리우는 흐린 그림자 (가운데 진하고 가장자리로 흐려지는 원) */
let shadowTexture: THREE.CanvasTexture | null = null;

/** 한 번만 만들어 함께 쓴다 (개발 모드에서 두 번 마운트돼도 버려지지 않게) */
function getShadowTexture() {
  shadowTexture ??= createShadowTexture();
  return shadowTexture;
}

function createShadowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(38, 52, 24, 1)");
  gradient.addColorStop(0.5, "rgba(38, 52, 24, 0.45)");
  gradient.addColorStop(1, "rgba(38, 52, 24, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

const smooth = (x: number) => {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

type PetalFallSceneProps = {
  /** false면 떨어지는 연출 없이 연잎 위에 떠 있는 상태로 시작 */
  animate: boolean;
  /** 꽃잎이 연잎 위에 내려앉았을 때 한 번 (animate=false면 처음부터 내려앉은 상태라 바로) */
  onLanded?: () => void;
  /** 꽃잎이 연잎까지 거리의 절반쯤 내려왔을 때 한 번 (animate=false면 바로) */
  onHalfway?: () => void;
};

/** 캔버스 크기에 맞춰 직교 카메라 배율·시점을 맞춘다 (연잎은 아래쪽, 위는 꽃잎이 떨어질 공간) */
function useFraming() {
  const { size } = useThree();
  return useMemo(() => {
    const zoom = (size.width * LEAF_SCREEN_RATIO) / LEAF_SIZE;
    const cos = Math.cos(ELEVATION);
    // 연잎 중심(y=0)이 캔버스 아래에서 LEAF_BOTTOM_PX 위에 오도록 바라보는 점을 올린다
    const targetY = (size.height / 2 - LEAF_BOTTOM_PX) / (zoom * cos);
    // 꽃잎 출발점: 캔버스 위쪽 바깥
    const startY = targetY + (size.height / 2 + 50) / (zoom * cos);
    return { zoom, targetY, startY };
  }, [size.width, size.height]);
}

function CameraRig() {
  const get = useThree((state) => state.get);
  const { zoom, targetY } = useFraming();
  useEffect(() => {
    const camera = get().camera as THREE.OrthographicCamera;
    const target = new THREE.Vector3(0, targetY, 0);
    camera.position.set(0, targetY + Math.sin(ELEVATION), Math.cos(ELEVATION));
    camera.lookAt(target);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }, [get, zoom, targetY]);
  return null;
}

/** 연잎 안의 재질들에 차례로 fn을 적용 */
function forEachMaterial(root: THREE.Object3D, fn: (material: THREE.Material) => void) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh) fn(mesh.material as THREE.Material);
  });
}

function Leaf({ fadeIn }: { fadeIn: boolean }) {
  const { scene } = useGLTF(LEAF_URL);
  const leaf = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      const baseLuma = LEAF_BASE_LUMA[material.name];
      const next = baseLuma ? recolorLeaf(material, baseLuma) : material.clone();
      // 페이드인: 처음엔 투명
      if (fadeIn) {
        next.transparent = true;
        next.opacity = 0;
      }
      mesh.material = next;
    });
    return copy;
  }, [scene, fadeIn]);
  const ref = useRef<THREE.Group>(null);
  const fadeStartedAt = useRef<number | null>(null);
  const fadeDone = useRef(!fadeIn);

  // 물 위에 뜬 듯 아주 살짝 흔들린다 (+ 처음 LEAF_FADE_SECONDS 동안 페이드인)
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    if (!fadeDone.current) {
      fadeStartedAt.current ??= t;
      const opacity = smooth((t - fadeStartedAt.current) / LEAF_FADE_SECONDS);
      forEachMaterial(g, (material) => {
        material.opacity = opacity;
      });
      // 다 나타나면 불투명으로 되돌린다 (투명 정렬 비용·겹침 문제 없게)
      if (opacity >= 1) {
        fadeDone.current = true;
        forEachMaterial(g, (material) => {
          material.transparent = false;
          material.needsUpdate = true;
        });
      }
    }
    g.position.y = Math.sin(t * 1.1) * 0.0012;
    g.rotation.x = Math.sin(t * 0.8) * 0.02;
    g.rotation.z = Math.cos(t * 0.7) * 0.015;
  });

  return (
    <group ref={ref}>
      <primitive object={leaf} />
    </group>
  );
}

function FallingPetal({ animate, onLanded, onHalfway }: PetalFallSceneProps) {
  const { scene } = useGLTF(PETAL_URL);
  const { startY } = useFraming();
  const ref = useRef<THREE.Group>(null);
  const rollRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const shadowMap = useMemo(() => getShadowTexture(), []);
  const startedAt = useRef<number | null>(null);
  const landed = useRef(false);
  const halfway = useRef(false);
  const animateAtStart = useRef(animate);

  // 모델은 캐시에서 함께 쓰므로 복제하고, 로그인 전 Hero 3D 연꽃과 같은 재질(색)을 입힌다
  const petal = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      mesh.material =
        mesh.name === "DewDrops" ? createDewMaterial() : createPetalMaterial(material, FULL_SUN);
    });
    return copy;
  }, [scene]);

  useFrame(({ clock }) => {
    const g = ref.current;
    const roll = rollRef.current;
    if (!g || !roll) return;
    const now = clock.elapsedTime;
    if (startedAt.current === null) {
      startedAt.current = now;
      // 시작할 때의 animate로 고정 (도중에 바뀌어도 꽃잎이 튀지 않게)
      animateAtStart.current = animate;
    }
    // 연출이 없으면 처음부터 떠 있는 상태
    const t = animateAtStart.current ? now - startedAt.current : FALL_SECONDS + now;
    const fallP = t / FALL_SECONDS;
    const floatT = Math.max(0, t - FALL_SECONDS);
    // 속도 곡선상 마지막 15%는 거의 멈춰 있으므로, 그쯤을 '내려앉음'으로 본다
    if (!halfway.current && fallProgress(fallP) >= 0.5) {
      halfway.current = true;
      onHalfway?.();
    }
    if (!landed.current && fallP >= LANDED_AT) {
      landed.current = true;
      onLanded?.();
    }

    // 중심 높이: 내려오며 점점 느려져 연잎 바로 위에 멈춘 뒤, 위아래로 살살
    const bob = Math.sin((floatT / BOB_PERIOD) * Math.PI * 2) * BOB_HEIGHT * smooth(floatT / 2);
    const base = THREE.MathUtils.lerp(startY, FLOAT_Y, fallProgress(fallP)) + bob;

    // 떨어지는 중간에 가장 크게 흔들리고, 연잎에 다다를수록 살살
    const amp = 1 + 0.9 * Math.sin(Math.PI * THREE.MathUtils.clamp(fallP, 0, 1));
    const phase = Math.sin((t / SWAY_PERIOD) * Math.PI * 2);
    const turn = Math.cos((t / SWAY_PERIOD) * Math.PI * 2);
    g.position.set(phase * SWAY_WIDTH * amp, base + phase * phase * SWAY_LIFT * amp, 0);

    // 그림자: 꽃잎을 따라 움직이고, 가까이 내려올수록 진해진다
    const shadow = shadowRef.current;
    if (shadow) {
      shadow.position.x = g.position.x;
      const material = shadow.material as THREE.MeshBasicMaterial;
      material.opacity = 0.4 * smooth((fallP - 0.55) / 0.45) * (1 - bob / (BOB_HEIGHT * 4));
    }

    // 앞면은 늘 보는 사람 쪽. 대각선 기울기를 중심으로 살짝 기울고, 아주 조금 앞뒤로 숨쉰다
    roll.rotation.set(turn * 0.08 * amp, phase * 0.12 * amp, DIAGONAL - phase * SWAY_TILT * amp);
  });

  return (
    <>
      <mesh
        ref={shadowRef}
        position={[0, LEAF_TOP_Y + 0.009, 0.012]}
        rotation={[-Math.PI / 2, 0, DIAGONAL * 0.6]}
        renderOrder={1}
      >
        <planeGeometry args={[0.07, 0.04]} />
        <meshBasicMaterial map={shadowMap} transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={ref}>
        {/* 화면 기준 축: x 오른쪽, y 위, z 보는 사람 쪽 */}
        <group rotation={[-ELEVATION, 0, 0]}>
          <group ref={rollRef}>
            {/* 모델의 앞면(+y)을 보는 사람 쪽으로, 세로 길이(z)를 화면 세로로 세운다 */}
            <group rotation={[Math.PI / 2, 0, 0]} scale={PETAL_SCALE}>
              <primitive object={petal} />
            </group>
          </group>
        </group>
      </group>
    </>
  );
}

/**
 * 기록 완료 히어로: 연잎(lotus-leaf.glb) 위로 오늘의 꽃잎(lotus-petal.glb)이 천천히 떨어져 내려와,
 * 앞면을 보이며 대각선으로 기운 채 연잎 바로 위에서 깃털처럼 살살 떠 있는다.
 * next/dynamic(ssr: false)로만 불러온다 — 서버에는 WebGL이 없다.
 */
export default function PetalFallScene({ animate, onLanded, onHalfway }: PetalFallSceneProps) {
  return (
    <Canvas
      orthographic
      resize={{ offsetSize: true }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ near: -10, far: 10, position: [0, 0, 1] }}
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
        <Leaf fadeIn={animate} />
        <FallingPetal animate={animate} onLanded={onLanded} onHalfway={onHalfway} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(LEAF_URL);
useGLTF.preload(PETAL_URL);
