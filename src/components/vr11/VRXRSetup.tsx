"use client";

import * as THREE from "three";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { VRButton } from "three/addons/webxr/VRButton.js";

export type XRLaunchMode = "vr" | "ar";

function positionXRButton(button: HTMLElement) {
  button.style.left = "50%";
  button.style.right = "auto";
  button.style.transform = "translateX(-50%)";
  button.style.minWidth = "104px";
}

export function VR11XRSetup({ mode }: { mode: XRLaunchMode }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    gl.xr.enabled = true;
    gl.xr.setReferenceSpaceType("local-floor");
    gl.xr.setFramebufferScaleFactor(2.0);
    gl.setClearColor(0x000000, 0);
    gl.setClearAlpha(0);
    gl.toneMapping = THREE.NoToneMapping;
    scene.background = null;

    const button =
      mode === "ar"
        ? ARButton.createButton(gl, {
            requiredFeatures: ["local-floor"],
            optionalFeatures: ["bounded-floor", "hand-tracking", "hit-test"],
          })
        : VRButton.createButton(gl, {
            optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
          });

    positionXRButton(button);
    document.body.appendChild(button);

    return () => {
      button.remove();
      gl.xr.enabled = false;
    };
  }, [gl, mode, scene]);

  return null;
}
