/* eslint-disable */

// import { MaterialEditor, useEditorComposer } from '@three-material-editor/react';
import React, { useRef, useEffect, FC, useMemo } from "react";
import { useControls, folder } from "leva";
import { useThree, useFrame, extend } from "@react-three/fiber";
import {
  SSAOEffect,
  ToneMappingEffect,
  HueSaturationEffect,
  BrightnessContrastEffect,
  EffectPass,
  RenderPass,
  EffectComposer,
} from "postprocessing";
import { useFBO } from "@react-three/drei";

const blend = {
  SKIP: 0, //- No blending. The effect will not be included in the final shader.
  ADD: 1, //  Additive blending. Fast, but may produce washed out results.
  ALPHA: 2, // - Alpha blending. Blends based on the alpha value of the new color.
  AVERAGE: 3, //  - Average blending.
  COLOR_BURN: 4, // - Color burn.
  COLOR_DODGE: 5, // - Color dodge.
  DARKEN: 6, // - Prioritize darker colors.
  DIFFERENCE: 7, // - Color difference.
  EXCLUSION: 8, //  - Color exclusion.
  LIGHTEN: 9, //  Prioritize lighter colors.
  MULTIPLY: 10, //  - Color multiplication.
  DIVIDE: 11, // - Color division.
  NEGATION: 12, // - Color negation.
  NORMAL: 13, // - Normal blending. The new color overwrites the old one.
  OVERLAY: 14, //  - Color overlay.
  REFLECT: 15, // - Color reflection.
  SCREEN: 16, // - Screen blending. The two colors are effectively projected on a white screen simultaneously.
  SOFT_LIGHT: 17, // - Soft light blending.
  SUBTRACT: 18, // - Color subtraction.
} as const;

const blendKeys = [
  "SKIP",
  "ADD",
  "ALPHA",
  "AVERAGE",
  "COLOR_BURN",
  "COLOR-DODGE",
  "DARKEN",
  "DIFFERENCE",
  "EXCLUSION",
  "LIGHTEN",
  "MULTIPLY",
  "DIVIDE",
  "NEGATION",
  "NORMAL",
  "OVERLAY",
  "REFLECT",
  "SCREEN",
  "SOFT_LIGHT",
  "SUBTRACT",
];

type BlendFunctionKey = keyof typeof blend;

export const LightingPostprocessing: FC<{}> = () => {
  const renderPriority: number = 1;

  const { blendFunctionKey } = useControls({
    postprocessing: folder({
      blendFunctionKey: {
        options: blendKeys,
      },
    }),
  });

  const { gl, camera, size, scene } = useThree();

  // create frame buffer objects
  const renderTarget = useFBO(size.width, size.height, { depthBuffer: true });

  const effectComposer = useMemo(() => {
    const _effectComposer = new EffectComposer(gl, renderTarget);
    // passes :
    //use a RenderPass as the first pass to automatically clear the buffers and render a scene for further processing

    const renderPass = new RenderPass(scene, camera);
    _effectComposer.addPass(renderPass);

    const hueSaturationEffect = new HueSaturationEffect({
      blendFunction: blend[blendFunctionKey as BlendFunctionKey], //blend mode
      hue: 0, //hue in radians
      saturation: 0, //saturation in radians (radians?!)
    });
    _effectComposer.addPass(new EffectPass(camera, hueSaturationEffect));

    const brightnessContrastEffect = new BrightnessContrastEffect({
      brightness: 0, // brightness. min: -1, max: 1
      contrast: 0, // contrast: min -1, max: 1
    });
    _effectComposer.addPass(new EffectPass(camera, brightnessContrastEffect));

    const toneMappingEffect = new ToneMappingEffect({
      adaptive: true, // toggle adaptive luminance map usage
      resolution: 256, // texture resolution of the luminance map
      middleGrey: 0.6, // middle grey factor
      maxLuminance: 16, // maximum luminance
      averageLuminance: 1, // average luminance
      adaptationRate: 1, // luminance adaptation rate
    });
    _effectComposer.addPass(new EffectPass(camera, toneMappingEffect));

    const ssaoEffect = new SSAOEffect(camera, renderTarget.depthTexture, {
      blendFunction: blend[blendFunctionKey as BlendFunctionKey], // blend mode
      samples: 30, // amount of samples per pixel (shouldn't be a multiple of the ring count)
      rings: 4, // amount of rings in the occlusion sampling pattern
      distanceThreshold: 1.0, // global distance threshold at which the occlusion effect starts to fade out. min: 0, max: 1
      distanceFalloff: 0.0, // distance falloff. min: 0, max: 1
      rangeThreshold: 0.5, // local occlusion range threshold at which the occlusion starts to fade out. min: 0, max: 1
      rangeFalloff: 0.1, // occlusion range falloff. min: 0, max: 1
      luminanceInfluence: 0.9, // how much the luminance of the scene influences the ambient occlusion
      radius: 20, // occlusion sampling radius
      scale: 0.5, // scale of the ambient occlusion
      bias: 0.5, // occlusion bias
    });
    _effectComposer.addPass(new EffectPass(camera, ssaoEffect));

    // gl.autoClear = false
    // gl.clear()

    return _effectComposer;
  }, [blendFunctionKey]);

  useEffect(() => {
    effectComposer.setSize(size.width, size.height);
  }, [size]);

  // render loop
  useFrame(() => {
    effectComposer.render(0.02);
  }, renderPriority);
  // https://stackoverflow.com/questions/63219093/three-js-trouble-combining-stencil-clipping-with-effectcomposer
  return null;
};

/**
 * using @react-three/postprocessing : 
 * 
 * 


export const LightingPostprocessing = () => {

  const { blendFunctionKey } = useControls({
    postprocessing: folder({
      blendFunctionKey: {
        options: blendKeys,
      },
    }),
  });

  return (
    <EffectComposer>
      <HueSaturation
        blendFunction={blend[blendFunctionKey as BlendFunctionKey]} // blend mode
        hue={0} // hue in radians
        saturation={0} // saturation in radians
      />
      <BrightnessContrast
        brightness={0} // brightness. min: -1, max: 1
        contrast={0} // contrast: min -1, max: 1
      />
      <ToneMapping
        blendFunction={blend[blendFunctionKey as BlendFunctionKey]} // blend mode
        adaptive={true} // toggle adaptive luminance map usage
        resolution={256} // texture resolution of the luminance map
        middleGrey={0.6} // middle grey factor
        maxLuminance={16.0} // maximum luminance
        averageLuminance={1.0} // average luminance
        adaptationRate={1.0} // luminance adaptation rate
      />
      <SSAO
        blendFunction={blend[blendFunctionKey as BlendFunctionKey]} // blend mode
        samples={30} // amount of samples per pixel (shouldn't be a multiple of the ring count)
        rings={4} // amount of rings in the occlusion sampling pattern
        distanceThreshold={1.0} // global distance threshold at which the occlusion effect starts to fade out. min: 0, max: 1
        distanceFalloff={0.0} // distance falloff. min: 0, max: 1
        rangeThreshold={0.5} // local occlusion range threshold at which the occlusion starts to fade out. min: 0, max: 1
        rangeFalloff={0.1} // occlusion range falloff. min: 0, max: 1
        luminanceInfluence={0.9} // how much the luminance of the scene influences the ambient occlusion
        radius={20} // occlusion sampling radius
        scale={0.5} // scale of the ambient occlusion
        bias={0.5} // occlusion bias
      />
    </EffectComposer>
  );
};

 * 
 * 
 */
