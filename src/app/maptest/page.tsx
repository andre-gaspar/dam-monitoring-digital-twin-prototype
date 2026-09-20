"use client";

import dynamic from "next/dynamic";

const LeafletMapInner = dynamic(() => import("../../components/LeafletMap"), {
  ssr: false,
});

export default function LeafletMapClient() {
   return (
    <main className="h-screen w-full">
      <LeafletMapInner />
    </main>
  );
}

