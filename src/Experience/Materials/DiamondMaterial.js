import * as THREE from "three";

import {
  MeshBVHUniformStruct,
  shaderStructs,
  shaderIntersectFunction,
} from "three-mesh-bvh";

const diamondMaterial = (options) => {
  const uniforms = {
    uEnvMap: new THREE.Uniform(options.envMap),
    uBounces: new THREE.Uniform(options.bounces),
    uBvh: new THREE.Uniform(new MeshBVHUniformStruct()),
    uIor: new THREE.Uniform(2.4),
    uColor: new THREE.Uniform(new THREE.Color(options.color)),
    uCorrectMips: new THREE.Uniform(options.correctMips),
    uChromaticAberration: new THREE.Uniform(options.chromaticAberration),
    uProjectionMatrixInv: new THREE.Uniform(options.projectionMatrixInverse),
    uViewMatrixInv: new THREE.Uniform(options.matrixWorld),
    uResolution: new THREE.Uniform(options.resolution),
    uAberrationStrength: new THREE.Uniform(0.01),
    uFresnel: new THREE.Uniform(options.fresnel),
    uFresnelCoef: new THREE.Uniform(options.fresnelCoef),
    uReflection: new THREE.Uniform(options.reflection),
    uReflectionCoef: new THREE.Uniform(options.reflectionCoef),
  };

  return new THREE.ShaderMaterial({
    name: "diamondMaterial",
    uniforms,
    vertexShader: /*glsl*/ `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    uniform mat4 uViewMatrixInv;

    void main() {
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vNormal = (uViewMatrixInv * vec4(normalMatrix * normal, 0.0)).xyz;
    }
    `,
    fragmentShader: /*glsl*/ `
    precision highp isampler2D;
    precision highp usampler2D;

    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    uniform samplerCube uEnvMap;
    uniform float uBounces;
    ${shaderStructs}
    ${shaderIntersectFunction}
    uniform BVH uBvh;
    uniform float uIor;
    uniform vec3 uColor;
    uniform bool uCorrectMips;
    uniform bool uChromaticAberration;
    uniform mat4 uProjectionMatrixInv;
    uniform mat4 uViewMatrixInv;
    uniform mat4 modelMatrix;
    uniform vec2 uResolution;
    uniform float uAberrationStrength;
    uniform float uFresnel;
    uniform float uFresnelCoef;
    uniform float uReflection;
    uniform float uReflectionCoef;

    float fresnelFunc(vec3 viewDirection, vec3 worldNormal) {
      return pow( 1.0 + dot(viewDirection, worldNormal), uFresnelCoef);
    }
    
    float reflectionFunc(vec3 viewDirection, vec3 worldNormal) {
      return step((1.0 + dot(viewDirection, worldNormal)), uReflectionCoef);
    }

    vec3 totalInternalReflection(vec3 ro, vec3 rd, vec3 normal, float ior, mat4 modelMatrixInverse) {
      vec3 rayOrigin = ro;
      vec3 rayDirection = rd;
      rayDirection = refract(rayDirection, normal, 1.0 / ior);
      rayOrigin = vWorldPosition + rayDirection * 0.001;
      rayOrigin = (modelMatrixInverse * vec4(rayOrigin, 1.0)).xyz;
      rayDirection = normalize((modelMatrixInverse * vec4(rayDirection, 0.0)).xyz);
      for(float i = 0.0; i < uBounces; i++) {
        uvec4 faceIndices = uvec4( 0u );
        vec3 faceNormal = vec3( 0.0, 0.0, 1.0 );
        vec3 barycoord = vec3( 0.0 );
        float side = 1.0;
        float dist = 0.0;
        bvhIntersectFirstHit( uBvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist );
        vec3 hitPos = rayOrigin + rayDirection * max(dist - 0.001, 0.0);
        // faceNormal *= side;
        vec3 tempDir = refract(rayDirection, faceNormal, ior);
        if (length(tempDir) != 0.0) {
          rayDirection = tempDir;
          break;
        }
        rayDirection = reflect(rayDirection, faceNormal);
        rayOrigin = hitPos + rayDirection * 0.01;
      }
      rayDirection = normalize((modelMatrix * vec4(rayDirection, 0.0)).xyz);
      return rayDirection;
    }
    
    #include <common>
    #include <cube_uv_reflection_fragment>

    void main() {
      mat4 modelMatrixInverse = inverse(modelMatrix);
      vec2 uv = gl_FragCoord.xy / uResolution;
      vec3 directionCamPerfect = (uProjectionMatrixInv * vec4(uv * 2.0 - 1.0, 0.0, 1.0)).xyz;
      directionCamPerfect = (uViewMatrixInv * vec4(directionCamPerfect, 0.0)).xyz;
      directionCamPerfect = normalize(directionCamPerfect);
      vec3 normal = vNormal;
      vec3 rayOrigin = cameraPosition;
      vec3 rayDirection = normalize(vWorldPosition - cameraPosition);
      vec3 finalColor;

      if (uChromaticAberration) {
        vec3 rayDirectionR = totalInternalReflection(rayOrigin, rayDirection, normal, max(uIor * (1.0 - uAberrationStrength), 1.0), modelMatrixInverse);
        vec3 rayDirectionG = totalInternalReflection(rayOrigin, rayDirection, normal, max(uIor, 1.0), modelMatrixInverse);
        vec3 rayDirectionB = totalInternalReflection(rayOrigin, rayDirection, normal, max(uIor * (1.0 + uAberrationStrength), 1.0), modelMatrixInverse);
        float finalColorR = textureGrad(uEnvMap, rayDirectionR, dFdx(uCorrectMips ? directionCamPerfect: rayDirection), dFdy(uCorrectMips ? directionCamPerfect: rayDirection)).r;
        float finalColorG = textureGrad(uEnvMap, rayDirectionG, dFdx(uCorrectMips ? directionCamPerfect: rayDirection), dFdy(uCorrectMips ? directionCamPerfect: rayDirection)).g;
        float finalColorB = textureGrad(uEnvMap, rayDirectionB, dFdx(uCorrectMips ? directionCamPerfect: rayDirection), dFdy(uCorrectMips ? directionCamPerfect: rayDirection)).b;
        finalColor = vec3(finalColorR, finalColorG, finalColorB) * uColor;
      } else {
        rayDirection = totalInternalReflection(rayOrigin, rayDirection, normal, max(uIor, 1.0), modelMatrixInverse);
        finalColor = textureGrad(uEnvMap, rayDirection, dFdx(uCorrectMips ? directionCamPerfect: rayDirection), dFdy(uCorrectMips ? directionCamPerfect: rayDirection)).rgb;
        finalColor *= uColor;
      }
      vec3 viewDirection = normalize(vWorldPosition - cameraPosition);

      float nFresnel = fresnelFunc(viewDirection, normal) * uFresnel;
      float nReflection = reflectionFunc(viewDirection, normal) * uReflection;

      gl_FragColor = vec4(mix(mix(finalColor.rgb, vec3(1.0), nReflection), vec3(1.0), nFresnel), 1.0);

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
    `,
  });
};

export default diamondMaterial;
