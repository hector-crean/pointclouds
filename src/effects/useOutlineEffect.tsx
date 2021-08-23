/* eslint-disable */

import { useEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import {
  OutlineEffect as OutlineEffectRaw,
  EffectComposer,
  RenderPass,
  EffectPass,
} from "postprocessing";
import { useFBO } from "@react-three/drei";
import { Object3D } from "three";


/**
 * A convenience hook for doing adding an outline postprocessing effect. This 
 * acts on the final rendered output, so is an efficient way of adding ui effects. 
 * 
 * Although initially used, I removed this in favour of just using the shaders within the points-material.
 */

export type UseOutlineEffectParams = ConstructorParameters<
  typeof OutlineEffectRaw
>[2];

export const defaultOutlineEffectParams: UseOutlineEffectParams = {
  edgeStrength: 2,
  pulseSpeed: 0.0,
  visibleEdgeColor: 0xfff,
  hiddenEdgeColor: 0x999,
  blur: false,
};

export const useOutlineEffect = (
  selection: Object3D | Object3D[],
  params: UseOutlineEffectParams
) => {
  const renderPriority: number = 1;

  const { gl, camera, size, scene } = useThree();

  const renderTarget = useFBO(size.width, size.height, { depthBuffer: true });

  const outlineEffect = useMemo(() => {
    return new OutlineEffectRaw(scene, camera, params);
  }, [scene, camera, params]);

  const effectComposer = useMemo(() => {
    const effectComposer = new EffectComposer(gl, renderTarget);
    const renderPass = new RenderPass(scene, camera);
    effectComposer.addPass(renderPass);
    effectComposer.addPass(new EffectPass(camera, outlineEffect));
    return effectComposer;
  }, [outlineEffect, camera, scene]);

  useEffect(() => {
    outlineEffect.clearSelection();
    if (selection) {
      outlineEffect.setSelection(
        Array.isArray(selection) ? selection : [selection]
      );
    }
  }, [outlineEffect, selection]);

  useEffect(() => {
    effectComposer.setSize(size.width, size.height);
  }, [size]);

  useFrame(() => {
    effectComposer.render(0.02);
  }, renderPriority);
};
