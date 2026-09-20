"use client";

import * as THREE from "three";
import React, { useEffect, useMemo, useState } from "react";
import { Text } from "@react-three/drei";

export const METEOROLOGIA_SERIES_OPTIONS = [
  { id: "Precipitacao_horaria_mm", label: "Hourly precipitation (mm)" },
  { id: "Direcao_do_vento_horaria", label: "Hourly wind direction" },
  {
    id: "Velocidade_do_vento_horaria_m_s",
    label: "Hourly wind speed (m/s)",
  },
  {
    id: "Velocidade_do_vento_maxima_horaria_m_s",
    label: "Maximum hourly wind speed (m/s)",
  },
  {
    id: "Velocidade_do_vento_media_diaria_m_s",
    label: "Daily average wind speed (m/s)",
  },
  { id: "Precipitacao_diaria_mm", label: "Daily precipitation (mm)" },
  { id: "Precipitacao_mensal_mm", label: "Monthly precipitation (mm)" },
  { id: "Precipitacao_anual_mm", label: "Annual precipitation (mm)" },
  {
    id: "Precipitacao_diaria_maxima_anual_mm",
    label: "Annual maximum daily precipitation (mm)",
  },
];

export type MeteorologiaPoint = {
  timestamp: string;
  value: number | null;
};

function BasicLine({
  points,
  color = 0xffffff,
}: {
  points: THREE.Vector3[];
  color?: number;
}) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
    });

    material.toneMapped = false;

    return new THREE.Line(geometry, material);
  }, [points, color]);

  useEffect(() => {
    return () => {
      line.geometry.dispose();

      if (Array.isArray(line.material)) {
        line.material.forEach((mat) => mat.dispose());
      } else {
        line.material.dispose();
      }
    };
  }, [line]);

  return <primitive object={line} />;
}

function ThickChartLine({
  points,
  color = 0x38bdf8,
}: {
  points: THREE.Vector3[];
  color?: number;
}) {
  const mesh = useMemo(() => {
    if (points.length < 2) return null;

    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.15);

    const geometry = new THREE.TubeGeometry(
      curve,
      Math.max(16, points.length * 2),
      0.006,
      8,
      false
    );

    const material = new THREE.MeshBasicMaterial({
      color,
      toneMapped: false,
    });

    return new THREE.Mesh(geometry, material);
  }, [points, color]);

  useEffect(() => {
    return () => {
      if (!mesh) return;

      mesh.geometry.dispose();

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => mat.dispose());
      } else {
        mesh.material.dispose();
      }
    };
  }, [mesh]);

  if (!mesh) return null;

  return <primitive object={mesh} />;
}

function downsampleData(data: MeteorologiaPoint[], maxPoints = 160) {
  const valid = data.filter((point) => typeof point.value === "number");

  if (valid.length <= maxPoints) return valid;

  const step = Math.ceil(valid.length / maxPoints);
  return valid.filter((_, index) => index % step === 0);
}

function formatShortDate(value?: string) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      timeZone: "UTC",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function ChartPanel({
  data,
  selectedLabel,
  title,
  loading,
  error,
  position,
  scale,
}: {
  data: MeteorologiaPoint[];
  selectedLabel: string;
  title: string;
  loading: boolean;
  error: string | null;
  position: [number, number, number];
  scale: number;
}) {
  const chartWidth = 1.35;
  const chartHeight = 0.58;

  const sampledData = useMemo(() => downsampleData(data, 160), [data]);

  const values = sampledData
    .map((point) => point.value)
    .filter((value): value is number => typeof value === "number");

  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 1;
  const range = maxValue - minValue || 1;

  const chartPoints = useMemo(() => {
    if (sampledData.length < 2) return [];

    return sampledData.map((point, index) => {
      const x =
        -chartWidth / 2 +
        (index / Math.max(sampledData.length - 1, 1)) * chartWidth;

      const normalized = ((point.value ?? minValue) - minValue) / range;
      const y = -chartHeight / 2 + normalized * chartHeight;

      return new THREE.Vector3(x, y, 0.04);
    });
  }, [sampledData, minValue, range]);

  const horizontalGrid = useMemo(() => {
    const lines: THREE.Vector3[][] = [];

    for (let i = 0; i <= 4; i++) {
      const y = -chartHeight / 2 + (i / 4) * chartHeight;

      lines.push([
        new THREE.Vector3(-chartWidth / 2, y, 0.025),
        new THREE.Vector3(chartWidth / 2, y, 0.025),
      ]);
    }

    return lines;
  }, []);

  const verticalGrid = useMemo(() => {
    const lines: THREE.Vector3[][] = [];

    for (let i = 0; i <= 6; i++) {
      const x = -chartWidth / 2 + (i / 6) * chartWidth;

      lines.push([
        new THREE.Vector3(x, -chartHeight / 2, 0.025),
        new THREE.Vector3(x, chartHeight / 2, 0.025),
      ]);
    }

    return lines;
  }, []);

  const midValue = minValue + range / 2;

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0, -0.035]}>
        <boxGeometry args={[1.72, 1.12, 0.05]} />
        <meshBasicMaterial color={0x020617} toneMapped={false} />
      </mesh>

      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[1.62, 1.02]} />
        <meshBasicMaterial
          color={0x0f172a}
          transparent
          opacity={0.94}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <Text
        position={[-0.72, 0.43, 0.04]}
        fontSize={0.045}
        color="white"
        anchorX="left"
        anchorY="middle"
        maxWidth={1.35}
      >
        {title}
      </Text>

      <Text
        position={[-0.72, 0.36, 0.04]}
        fontSize={0.026}
        color="#94a3b8"
        anchorX="left"
        anchorY="middle"
        maxWidth={1.35}
      >
        {selectedLabel}
      </Text>

      <mesh position={[0, -0.02, 0.015]}>
        <planeGeometry args={[1.44, 0.68]} />
        <meshBasicMaterial
          color={0x111827}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <group position={[0, -0.02, 0]}>
        {horizontalGrid.map((line, index) => (
          <BasicLine key={`h-${index}`} points={line} color={0x334155} />
        ))}

        {verticalGrid.map((line, index) => (
          <BasicLine key={`v-${index}`} points={line} color={0x1e293b} />
        ))}

        {!loading && !error && chartPoints.length >= 2 && (
          <ThickChartLine points={chartPoints} color={0x38bdf8} />
        )}

        {loading && (
          <Text
            position={[0, 0, 0.06]}
            fontSize={0.045}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Loading data...
          </Text>
        )}

        {error && (
          <Text
            position={[0, 0, 0.06]}
            fontSize={0.035}
            color="#f87171"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.1}
          >
            {error}
          </Text>
        )}

        {!loading && !error && chartPoints.length < 2 && (
          <Text
            position={[0, 0, 0.06]}
            fontSize={0.04}
            color="#cbd5e1"
            anchorX="center"
            anchorY="middle"
          >
            No data
          </Text>
        )}
      </group>

      <Text
        position={[-0.77, 0.27, 0.04]}
        fontSize={0.024}
        color="#cbd5e1"
        anchorX="left"
        anchorY="middle"
      >
        {maxValue.toFixed(2)}
      </Text>

      <Text
        position={[-0.77, -0.02, 0.04]}
        fontSize={0.024}
        color="#cbd5e1"
        anchorX="left"
        anchorY="middle"
      >
        {midValue.toFixed(2)}
      </Text>

      <Text
        position={[-0.77, -0.31, 0.04]}
        fontSize={0.024}
        color="#cbd5e1"
        anchorX="left"
        anchorY="middle"
      >
        {minValue.toFixed(2)}
      </Text>

      <Text
        position={[-0.58, -0.43, 0.04]}
        fontSize={0.024}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {formatShortDate(sampledData[0]?.timestamp)}
      </Text>

      <Text
        position={[0.58, -0.43, 0.04]}
        fontSize={0.024}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {formatShortDate(sampledData[sampledData.length - 1]?.timestamp)}
      </Text>

      <Text
        position={[-0.72, -0.49, 0.04]}
        fontSize={0.022}
        color="#64748b"
        anchorX="left"
        anchorY="middle"
      >
        Points: {sampledData.length} / Min: {minValue.toFixed(2)} / Max:{" "}
        {maxValue.toFixed(2)}
      </Text>
    </group>
  );
}

export function MeteorologiaLapa3DChart({
  seriesId,
  selectedLabel,
  title = "Meteorology - 3D Chart",
  position = [0, 1.45, -1.35],
  scale = 1,
  limit = 500,
}: {
  seriesId: string;
  selectedLabel: string;
  title?: string;
  position?: [number, number, number];
  scale?: number;
  limit?: number;
}) {
  const [data, setData] = useState<MeteorologiaPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/meteorologia_lapa?series=${encodeURIComponent(
            seriesId
          )}&limit=${limit}`,
          { signal: controller.signal }
        );

        const json = await res.json();

        if (!json.ok) {
          setData([]);
          setError(json.error ?? "Failed to load series");
          return;
        }

        setData(json.data ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setData([]);
          setError("Failed to load series");
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [seriesId, limit]);

  return (
    <ChartPanel
      data={data}
      selectedLabel={selectedLabel}
      title={title}
      loading={loading}
      error={error}
      position={position}
      scale={scale}
    />
  );
}
