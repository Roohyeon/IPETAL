import * as THREE from "three";

/**
 * 연꽃 꽃잎·물방울 재질 (로그인 전 Hero 3D 연꽃과 기록 완료 화면의 떨어지는 꽃잎이 함께 쓴다)
 * 두 모델은 같은 꽃잎 텍스처를 쓰므로, 같은 재질이면 같은 색으로 보인다.
 */

/** 꽃잎 색: 겉(끝)은 지금 파스텔 핑크, 안쪽(밑동)으로 갈수록 흰빛에 가까운 아이보리 */
const PETAL_TIP = "#e1a29d";
const PETAL_MID = "#efcbc8";
const PETAL_IVORY = "#fff8ee";
const SUN_COLOR = "#fff1dc";

/**
 * 촉촉한 물막 표현 (셰이더 안에서만 계산 — 환경맵·clearcoat 없이 가볍게)
 * 카메라 기준으로 고정된 두 빛에서 생기는 날카로운 하이라이트 + 비스듬한 면 가장자리의 광택
 */
const WET_LIGHT = `
  vec3 wetV = normalize(vViewPosition);
  vec3 wetL1 = normalize(vec3(0.35, 0.75, 0.55));
  vec3 wetH1 = normalize(wetL1 + wetV);
  vec3 wetH2 = normalize(normalize(vec3(-0.5, 0.45, 0.6)) + wetV);
  float wetNdV = saturate(dot(normal, wetV));
  float wetRim = pow(1.0 - wetNdV, 3.0);`;

/** 꽃잎: 끝은 파스텔 핑크 → 밑동은 아이보리, 물막 광택, 활짝 피면 햇빛이 비쳐 화사하게 */
export function createPetalMaterial(
  source: THREE.MeshStandardMaterial,
  /** 햇빛 세기 0~1 (여러 재질이 같은 객체를 함께 쓰면 한 번에 바뀐다) */
  sunUniform: { value: number },
) {
  const material = new THREE.MeshStandardMaterial({
    map: source.map,
    normalMap: source.normalMap,
    normalScale: new THREE.Vector2(0.22, 0.22),
    roughness: 0.36,
    metalness: 0,
    side: source.side,
  });
  const uniforms = {
    uTip: { value: new THREE.Color(PETAL_TIP) },
    uMid: { value: new THREE.Color(PETAL_MID) },
    uIvory: { value: new THREE.Color(PETAL_IVORY) },
    uSunColor: { value: new THREE.Color(SUN_COLOR) },
    uSun: sunUniform,
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform vec3 uTip;
        uniform vec3 uMid;
        uniform vec3 uIvory;
        uniform vec3 uSunColor;
        uniform float uSun;`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        // 텍스처 밝기 = 꽃잎 끝(어두움)에서 밑동(밝음)까지의 위치
        float petalT = smoothstep(0.24, 0.8, dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)));
        vec3 petalColor = mix(uTip, uMid, smoothstep(0.0, 0.3, petalT));
        petalColor = mix(petalColor, uIvory, smoothstep(0.22, 0.78, petalT));
        diffuseColor.rgb = petalColor;`,
      )
      .replace(
        "#include <opaque_fragment>",
        `${WET_LIGHT}
        float wetSpec = pow(max(dot(normal, wetH1), 0.0), 90.0)
          + 0.5 * pow(max(dot(normal, wetH2), 0.0), 140.0);
        outgoingLight += vec3(1.0, 0.98, 0.98) * (wetSpec * 0.45 + wetRim * 0.2);
        // 햇빛: 얇은 꽃잎을 통과해 비치는 따뜻한 빛 + 전체적으로 화사하게
        float sunThrough = pow(saturate(dot(-normal, wetL1)), 1.5);
        outgoingLight += uSunColor * uSun * (0.12 + sunThrough * 0.32 + wetRim * 0.15);
        outgoingLight *= 1.0 + uSun * 0.1;
        #include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => "ipetal-petal";
  return material;
}

/**
 * 물방울: 가운데는 맑게 비치고, 가장자리는 뒤의 꽃잎 색이 굴절돼 진한 핑크 테가 생기며,
 * 위쪽엔 날카로운 반짝임, 아래쪽엔 빛이 모여 밝게 맺힌다.
 */
export function createDewMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: "#f3c4c1",
    roughness: 0.02,
    metalness: 0,
    transparent: true,
    opacity: 1,
    depthWrite: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `${WET_LIGHT}
      float dewSpec = pow(max(dot(normal, wetH1), 0.0), 220.0) * 3.0
        + pow(max(dot(normal, wetH2), 0.0), 300.0) * 1.4;
      float dewCaustic = smoothstep(0.05, -0.75, normal.y) * pow(wetNdV, 0.6);
      float dewEdge = pow(1.0 - wetNdV, 1.4);
      // 굴절 테: 가장자리로 갈수록 진한 꽃잎색, 가운데는 맑게
      vec3 dewColor = mix(vec3(1.0, 0.97, 0.97), vec3(0.83, 0.5, 0.49), dewEdge);
      outgoingLight = dewColor * (0.55 + 0.45 * wetNdV)
        + vec3(1.0) * dewSpec
        + vec3(1.0, 0.97, 0.95) * dewCaustic * 0.55;
      diffuseColor.a = opacity * clamp(mix(0.12, 0.9, dewEdge) + dewSpec + dewCaustic * 0.4, 0.0, 1.0);
      #include <opaque_fragment>`,
    );
  };
  material.customProgramCacheKey = () => "ipetal-dew";
  return material;
}
