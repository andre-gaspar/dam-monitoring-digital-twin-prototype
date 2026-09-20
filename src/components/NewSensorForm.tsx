"use client";

import React, { useState } from "react";
import type { SensorItem } from "@/components/ScrollableCardList";

type NewSensorFormProps = {
  onCreateSensor?: (sensor: SensorItem) => void;
};

function parseLatLon(input: string) {
  const parts = input.split(",").map((p) => p.trim());

  if (parts.length < 2) return null;

  const lat = Number(parts[0]);
  const lon = Number(parts[1]);

  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  return { lat, lon };
}

export function NewSensorForm({ onCreateSensor }: NewSensorFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [badge, setBadge] = useState("");
  const [coordInput, setCoordInput] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = parseLatLon(coordInput);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!parsed) {
      setError("Coordinates must be in the format: lat, lon");
      return;
    }

    const newSensor: SensorItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      badge: badge.trim() || undefined,
      lat: parsed.lat,
      lon: parsed.lon,
      image: "https://avatar.vercel.sh/shadcn1",
    };

    onCreateSensor?.(newSensor);

    setTitle("");
    setDescription("");
    setBadge("");
    setCoordInput("");
    setError("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl space-y-4 rounded-xl border bg-background p-6 shadow-sm"
    >
      <div>
        <h2 className="text-xl font-semibold">Create New Sensor</h2>
        <p className="text-sm text-muted-foreground">
          Simple UI first. You can wire the logic into your main page later.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sensor A1"
          className="w-full rounded-md border px-3 py-2 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this sensor..."
          className="min-h-[110px] w-full rounded-md border px-3 py-2 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Badge</label>
        <input
          value={badge}
          onChange={(e) => setBadge(e.target.value)}
          placeholder="Active"
          className="w-full rounded-md border px-3 py-2 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Coordinates</label>
        <input
          value={coordInput}
          onChange={(e) => setCoordInput(e.target.value)}
          placeholder="41.437905122229715, -6.904954833597143"
          style={{
            width: 280,
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            outline: "none",
            color: "black",
          }}
        />
        <p className="text-xs text-muted-foreground">
          Format: latitude, longitude
        </p>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button
        type="submit"
        className="rounded-md bg-black px-4 py-2 text-white"
      >
        Create Sensor
      </button>
    </form>
  );
}