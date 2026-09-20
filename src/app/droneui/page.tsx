import type { Metadata } from "next";

import { DroneCaptureViewer } from "@/components/DroneCaptureViewer";

export const metadata: Metadata = {
  title: "Capturas de drone | Montesinho",
  description: "Visualizador tridimensional das capturas efetuadas por drone.",
};

export default function DroneCapturesPage() {
  return <DroneCaptureViewer />;
}
