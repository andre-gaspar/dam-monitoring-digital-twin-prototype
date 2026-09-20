"use client";

import { useEffect, useState } from "react";

import Montesinho11Page from "../montesinho11/page";

const MONTESINHO_DATA_API_PATHS = new Set([
  "/api/reservoir_level_hourly",
  "/api/manual_cota_events",
  "/api/piezometer_metadata_latest",
  "/api/piezometer_history_long",
  "/api/seepage_flows_long",
  "/api/temporary_bica_flows_long",
  "/api/weather_hourly",
  "/api/timeline_events",
  "/api/inclinometer_metadata",
  "/api/inclinometer_observation_summary",
  "/api/inclinometer_history_long",
]);

function MobileLoadingScreen() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-slate-950 text-sm font-medium text-white">
      A carregar a versão móvel...
    </div>
  );
}

function getMobileDataRequestUrl(input: RequestInfo | URL) {
  const currentPath = window.location.pathname;
  const isMobileRoute =
    currentPath === "/montesinho11mobile" ||
    currentPath.startsWith("/montesinho11mobile/");

  if (!isMobileRoute) return null;

  const requestUrl =
    input instanceof Request ? input.url : input.toString();
  const url = new URL(requestUrl, window.location.href);

  if (
    url.origin !== window.location.origin ||
    !MONTESINHO_DATA_API_PATHS.has(url.pathname)
  ) {
    return null;
  }

  return url;
}

function createEmptyDatasetResponse(url: URL) {
  const requestedLimit = Number(url.searchParams.get("limit") ?? "0");
  const requestedOffset = Number(url.searchParams.get("offset") ?? "0");

  return new Response(
    JSON.stringify({
      ok: true,
      table: url.pathname.slice(url.pathname.lastIndexOf("/") + 1),
      offset: Number.isFinite(requestedOffset) ? requestedOffset : 0,
      limit: Number.isFinite(requestedLimit) ? requestedLimit : 0,
      count: 0,
      returned: 0,
      truncated: false,
      nextOffset: null,
      data: [],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export default function Montesinho11MobilePage() {
  const [isNoDataModeReady, setIsNoDataModeReady] = useState(false);

  useEffect(() => {
    const previousFetch = window.fetch;

    const mobileNoDataFetch: typeof window.fetch = (input, init) => {
      try {
        const dataRequestUrl = getMobileDataRequestUrl(input);

        if (dataRequestUrl) {
          return Promise.resolve(createEmptyDatasetResponse(dataRequestUrl));
        }
      } catch {
        // Preserve the browser's normal fetch behavior for an unusual input.
      }

      return previousFetch.call(window, input, init);
    };

    window.fetch = mobileNoDataFetch;
    setIsNoDataModeReady(true);

    return () => {
      if (window.fetch === mobileNoDataFetch) {
        window.fetch = previousFetch;
      }
    };
  }, []);

  if (!isNoDataModeReady) return <MobileLoadingScreen />;

  return <Montesinho11Page />;
}
