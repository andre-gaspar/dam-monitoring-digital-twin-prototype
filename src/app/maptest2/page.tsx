"use client";

import dynamic from "next/dynamic";

const DamLeafletMap = dynamic(() => import("../../components/DamLeafletMap"), {
  ssr: false,
});

export default function MapTest2Page() {
  return (
    <main className="h-screen w-full">
      <DamLeafletMap />
    </main>
  );
}
