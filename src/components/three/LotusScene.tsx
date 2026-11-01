"use client";

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { Suspense, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import { createDewMaterial, createPetalMaterial } from "./lotusMaterials";

const MODEL_URL = "/models/lotus.glb";
const LOOK_AT = new THREE.Vector3(0, 0.035, 0);
/** 360도로 돌려볼 때의 회전 중심 (꽃 가운데 높이) */
const PIVOT_Y = 0.035;

/** 약 45도 위에서 정면 쪽을 내려다본다 (봉오리 밑단이 보이지 않게) */
const CAMERA_ELEVATION = THREE.MathUtils.degToRad(44);
const CAMERA_DISTANCE = 0.5;

/** 봉오리 겉에 맺히는 물방울 수 */
const BUD_DROP_COUNT = 3;

type LotusSceneProps = {
  /** 0 = 봉오리, 1 = 활짝 핀 연꽃 */
  bloom: MotionValue<number>;
  /** false면 렌더링 루프를 멈춘다 (화면 밖이거나 보이지 않을 때) */
  active: boolean;
  /** true면 클릭한 채로 끌어서 360도 돌려볼 수 있다 */
  interactive: boolean;
  /** 모바일 등 작은 화면: 해상도를 낮춰 가볍게 */
  compact?: boolean;
  onReady: () => void;
};

/** 클릭한 채로 끌어 360도 돌려보는 회전 상태 (관성 포함) */
class OrbitController {
  private dragging = false;
  private yaw = 0;
  private pitch = 0;
  private yawVelocity = 0;
  private lastX = 0;
  private lastY = 0;
  private lastT = 0;
  private moved = 0;

  get rotationY() {
    return this.yaw;
  }

  get rotationX() {
    return this.pitch;
  }

  start(x: number, y: number, t: number) {
    this.dragging = true;
    this.yawVelocity = 0;
    this.lastX = x;
    this.lastY = y;
    this.lastT = t;
    this.moved = 0;
  }

  move(x: number, y: number, t: number) {
    if (!this.dragging) return;
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    const dt = Math.max(1, t - this.lastT);
    this.lastX = x;
    this.lastY = y;
    this.lastT = t;
    this.moved += Math.abs(dx) + Math.abs(dy);
    this.yaw += dx * 0.012;
    this.pitch += dy * 0.012;
    this.yawVelocity = ((dx * 0.012) / dt) * 16;
  }

  end() {
    if (!this.dragging) return;
    this.dragging = false;
    // 거의 움직이지 않았으면 클릭: 살짝 한 바퀴 돈다
    if (this.moved < 4) this.yawVelocity = 0.22;
  }

  step(delta: number) {
    if (this.dragging) return;
    this.yaw += this.yawVelocity;
    this.yawVelocity *= Math.pow(0.04, delta);
    // 손을 떼면 위아래 기울기는 가장 가까운 기본 각도로 천천히 돌아온다
    const rest = Math.round(this.pitch / (Math.PI * 2)) * Math.PI * 2;
    this.pitch = THREE.MathUtils.damp(this.pitch, rest, 2.5, delta);
  }
}

/** 블룸 값(0~1)을 GLB 모프 타깃 Bloom_33 / Bloom_66 / Bloom_100 가중치로 변환 */
function bloomWeights(value: number): [number, number, number] {
  const s = THREE.MathUtils.clamp(value, 0, 1) * 3;
  if (s <= 1) return [s, 0, 0];
  if (s <= 2) return [2 - s, s - 1, 0];
  return [0, 3 - s, s - 2];
}

const centersCache = new WeakMap<THREE.Object3D, THREE.Vector3[]>();

/**
 * 개화 단계별(봉오리·33·66·100) 꽃 전체의 바운딩 박스 중심 (모델 그룹 좌표).
 * 피는 동안 이 중심을 항상 화면 가운데에 두기 위해 쓴다.
 */
function stageCentersOf(root: THREE.Object3D): THREE.Vector3[] {
  const cached = centersCache.get(root);
  if (cached) return cached;
  root.updateMatrixWorld(true);
  const toRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const boxes = [0, 1, 2, 3].map(() => new THREE.Box3());
  const point = new THREE.Vector3();
  const delta = new THREE.Vector3();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh) return;
    const relative = new THREE.Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld);
    const positions = mesh.geometry.getAttribute("position");
    const morphs = mesh.geometry.morphAttributes.position;
    for (let i = 0; i < positions.count; i++) {
      for (let stage = 0; stage < 4; stage++) {
        point.fromBufferAttribute(positions, i);
        const morph = stage > 0 ? morphs?.[stage - 1] : undefined;
        if (morph) point.add(delta.fromBufferAttribute(morph, i));
        boxes[stage].expandByPoint(point.applyMatrix4(relative));
      }
    }
  });
  const centers = boxes.map((box) => box.getCenter(new THREE.Vector3()));
  centersCache.set(root, centers);
  return centers;
}

const morphCache = new WeakMap<THREE.Object3D, THREE.Mesh[]>();

/** 모프 타깃(개화 단계)이 있는 메시 목록 */
function morphMeshesOf(root: THREE.Object3D): THREE.Mesh[] {
  let meshes = morphCache.get(root);
  if (!meshes) {
    meshes = [];
    root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh && mesh.morphTargetInfluences) meshes!.push(mesh);
    });
    morphCache.set(root, meshes);
  }
  return meshes;
}

/** 개화 정도에 따른 햇빛 세기 (모든 꽃잎 재질이 함께 쓴다) */
const sunUniform = { value: 0 };

const styled = new WeakSet<THREE.Object3D>();

/**
 * 재질을 화사하고 촉촉하게 바꾼다.
 * 첫 로딩 때 메인 스레드를 오래 막지 않도록 sheen·transmission·clearcoat·환경맵은 쓰지 않는다.
 */
function styleMaterials(root: THREE.Object3D) {
  if (styled.has(root)) return;
  styled.add(root);
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const source = mesh.material as THREE.MeshPhysicalMaterial;
    if (!source.isMeshPhysicalMaterial) return;
    mesh.material =
      source.transmission > 0 ? createDewMaterial() : createPetalMaterial(source, sunUniform);
    source.dispose();
  });
}

const budDropsCache = new WeakMap<THREE.Object3D, THREE.InstancedMesh>();

/**
 * 봉오리 겉면에 물방울을 맺히게 한다.
 * 봉오리(개화 0) 꽃잎 정점 중 높이마다 가장 바깥쪽에 있는 정점에만 맺히게 해서,
 * 꽃잎 사이 틈이나 안쪽에 숨는 물방울이 없게 한다.
 */
function budDropsOf(root: THREE.Object3D): THREE.InstancedMesh | null {
  const cached = budDropsCache.get(root);
  if (cached) return cached;

  // 봉오리일 때는 바깥·가운데·안쪽 꽃잎이 겹쳐 겉면을 이루므로 세 겹 모두에서 찾는다
  const petals = ["Petals_Outer", "Petals_Middle", "Petals_Inner"]
    .map((name) => root.getObjectByName(name) as THREE.Mesh | undefined)
    .filter((mesh): mesh is THREE.Mesh => Boolean(mesh?.isMesh));
  const space = petals[0]?.parent;
  if (petals.length === 0 || !space) return null;

  // 정점을 꽃 모델(부모 그룹) 좌표로 모은다 — 개화 0 = 모프 적용 전 기본 위치
  type Candidate = { position: THREE.Vector3; normal: THREE.Vector3; radial: number };
  const candidates: Candidate[] = [];
  const BANDS = 24;
  const MIN_Y = 0.028;
  const MAX_Y = 0.1;
  const bandMax = new Array<number>(BANDS).fill(0);
  const bandOf = (y: number) =>
    Math.min(BANDS - 1, Math.max(0, Math.floor(((y - MIN_Y) / (MAX_Y - MIN_Y)) * BANDS)));

  for (const mesh of petals) {
    mesh.updateMatrix();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrix);
    const positions = mesh.geometry.getAttribute("position");
    const normals = mesh.geometry.getAttribute("normal");
    for (let i = 0; i < positions.count; i++) {
      const position = new THREE.Vector3()
        .fromBufferAttribute(positions, i)
        .applyMatrix4(mesh.matrix);
      if (position.y < MIN_Y || position.y > MAX_Y) continue;
      const radial = Math.hypot(position.x, position.z);
      const normal = new THREE.Vector3()
        .fromBufferAttribute(normals, i)
        .applyMatrix3(normalMatrix)
        .normalize();
      candidates.push({ position, normal, radial });
      const band = bandOf(position.y);
      bandMax[band] = Math.max(bandMax[band], radial);
    }
  }
  // 높이마다 가장 바깥 껍질(최대 반지름의 94% 이상)만 남긴다
  // 높이마다 가장 바깥 껍질(최대 반지름의 94% 이상) 중, 처음에 카메라를 향한 앞면(+z 쪽)만 남긴다
  const hull = candidates.filter(
    (c) =>
      c.radial >= bandMax[bandOf(c.position.y)] * 0.94 &&
      c.position.z / Math.max(c.radial, 1e-6) > 0.55 &&
      c.position.y > 0.045,
  );
  if (hull.length === 0) return null;

  const material = createDewMaterial();
  const drops = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 20, 14),
    material,
    BUD_DROP_COUNT,
  );
  drops.renderOrder = 2;

  const matrix = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const used: THREE.Vector3[] = [];
  let placed = 0;
  for (let attempt = 0; attempt < BUD_DROP_COUNT * 12 && placed < BUD_DROP_COUNT; attempt++) {
    const pick = hull[Math.floor(random() * hull.length)];
    // 너무 가까이 붙지 않게
    if (used.some((p) => p.distanceTo(pick.position) < 0.014)) continue;
    used.push(pick.position);

    const outward = new THREE.Vector3(pick.position.x, 0, pick.position.z).normalize();
    const normal = pick.normal.clone();
    if (normal.dot(outward) < 0) normal.negate();

    const radius = 0.0022 + random() * 0.003;
    const position = pick.position.clone().addScaledVector(normal, radius * 0.4);
    const rotation = new THREE.Quaternion().setFromUnitVectors(up, normal);
    // 납작하게 맺힌 물방울
    matrix.compose(position, rotation, new THREE.Vector3(radius, radius * 0.62, radius));
    drops.setMatrixAt(placed, matrix);
    placed++;
  }
  drops.count = placed;
  drops.instanceMatrix.needsUpdate = true;

  space.add(drops);
  budDropsCache.set(root, drops);
  return drops;
}

function Lotus({
  bloom,
  orbit,
  onReady,
}: {
  bloom: MotionValue<number>;
  orbit: OrbitController;
  onReady: () => void;
}) {
  const { scene } = useGLTF(MODEL_URL, false, true);
  const pivot = useRef<THREE.Group>(null);
  const model = useRef<THREE.Group>(null);
  const ready = useRef(false);

  useFrame((state, delta) => {
    const g = pivot.current;
    const m = model.current;
    if (g && m) {
      styleMaterials(m);
      const drops = budDropsOf(m);

      const value = THREE.MathUtils.clamp(bloom.get(), 0, 1);
      const [w33, w66, w100] = bloomWeights(value);
      for (const mesh of morphMeshesOf(m)) {
        const influences = mesh.morphTargetInfluences!;
        influences[0] = w33;
        influences[1] = w66;
        influences[2] = w100;
      }
      // 봉오리 물방울은 꽃잎이 벌어지면서 사라지고, 활짝 피면 햇빛이 비친다
      if (drops) {
        const dropMaterial = drops.material as THREE.MeshStandardMaterial;
        dropMaterial.opacity = 1 - THREE.MathUtils.smoothstep(value, 0.12, 0.38);
        drops.visible = dropMaterial.opacity > 0.01;
      }
      sunUniform.value = THREE.MathUtils.smoothstep(value, 0.62, 1);

      // 피는 동안 꽃의 중심이 항상 화면 가운데(가로·세로)에 오도록 모델을 옮긴다
      const [c0, c1, c2, c3] = stageCentersOf(m);
      m.position.set(
        -(c0.x + w33 * (c1.x - c0.x) + w66 * (c2.x - c0.x) + w100 * (c3.x - c0.x)),
        -(c0.y + w33 * (c1.y - c0.y) + w66 * (c2.y - c0.y) + w100 * (c3.y - c0.y)),
        -(c0.z + w33 * (c1.z - c0.z) + w66 * (c2.z - c0.z) + w100 * (c3.z - c0.z)),
      );

      // 저절로 돌거나 흔들리지 않고 제자리에서 피기만 한다.
      // 클릭한 채로 끌면 360도, 놓으면 관성으로 멈춘다.
      orbit.step(delta);
      g.rotation.order = "YXZ";
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, orbit.rotationY, 8, delta);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, orbit.rotationX, 10, delta);
    }

    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  });

  return (
    <group ref={pivot} position={[0, PIVOT_Y, 0]}>
      <group ref={model}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

function CameraTarget() {
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    camera.lookAt(LOOK_AT);
  }, [camera]);
  return null;
}

/**
 * Hero 3D 연꽃 (lotus_real.glb).
 * next/dynamic(ssr: false)로만 불러온다 — 서버에는 WebGL이 없다.
 * 클릭한 채로 끌면 360도 돌려볼 수 있고, 클릭(탭)만 하면 한 바퀴 살짝 돈다.
 */
export default function LotusScene({
  bloom,
  active,
  interactive,
  compact,
  onReady,
}: LotusSceneProps) {
  const [orbit] = useState(() => new OrbitController());

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    orbit.start(event.clientX, event.clientY, event.timeStamp);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    orbit.move(event.clientX, event.clientY, event.timeStamp);
  };
  const onPointerUp = () => orbit.end();

  const cameraY = LOOK_AT.y + Math.sin(CAMERA_ELEVATION) * CAMERA_DISTANCE;
  const cameraZ = Math.cos(CAMERA_ELEVATION) * CAMERA_DISTANCE;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: interactive ? "auto" : "none",
        cursor: interactive ? "grab" : undefined,
        // 꽃 위에서는 손가락으로도 360도 돌려볼 수 있게 (꽃 밖에서는 평소처럼 스크롤)
        touchAction: interactive ? "none" : "auto",
      }}
      onPointerDown={interactive ? onPointerDown : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-hidden="true"
    >
      <Canvas
        // 바깥에서 CSS scale(1.07)로 키워도 캔버스 크기를 변형 전 기준으로 잰다
        // (변형 후 크기로 재면 캔버스가 오른쪽으로 넘쳐 꽃이 옆으로 밀려 보인다)
        resize={{ offsetSize: true }}
        frameloop={active ? "always" : "never"}
        dpr={compact ? [1, 1.5] : [1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 28, position: [0, cameraY, cameraZ], near: 0.01, far: 10 }}
        onCreated={({ gl }) => {
          // 파스텔 색이 탁해지지 않도록 색 보존형 톤매핑
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1.05;
          // 셰이더 디버그 검사 끔: 운영 권장 설정이며, 드라이버 경고가 콘솔에 찍히지 않는다
          gl.debug.checkShaderErrors = false;
        }}
      >
        <CameraTarget />
        <hemisphereLight args={["#fffafa", "#e2ebe6", 1.1]} />
        <directionalLight position={[0.3, 0.9, 0.5]} intensity={1.6} color="#fffaf7" />
        <directionalLight position={[-0.6, 0.5, 0.4]} intensity={0.7} color="#ffeceb" />
        {/* 물기에 반짝이는 작은 하이라이트 */}
        <pointLight position={[0.12, 0.25, 0.22]} intensity={0.6} distance={1} color="#ffffff" />
        <pointLight position={[-0.15, 0.2, 0.18]} intensity={0.35} distance={1} color="#fff2f2" />
        <Suspense fallback={null}>
          <Lotus bloom={bloom} orbit={orbit} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL, false, true);
