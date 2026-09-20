"use client";
import { useEffect, useState } from "react";
import mqtt from "mqtt";

// Minimal, bare-bones viewer. No styling, no extras.
// Set these in .env.local or Vercel Project → Environment Variables:
//   NEXT_PUBLIC_MQTT_HOST=yourcluster.s1.eu.hivemq.cloud
//   NEXT_PUBLIC_MQTT_USERNAME=viewer_user   // subscribe-only user
//   NEXT_PUBLIC_MQTT_PASSWORD=viewer_pass
//   NEXT_PUBLIC_MQTT_TOPIC=local/#          // or a tighter filter

const HOST = process.env.NEXT_PUBLIC_MQTT_HOST;
const USER = process.env.NEXT_PUBLIC_MQTT_USERNAME;
const PASS = process.env.NEXT_PUBLIC_MQTT_PASSWORD;
const TOPIC = process.env.NEXT_PUBLIC_MQTT_TOPIC || "local/#";

export default function Page() {
  const [status, setStatus] = useState("disconnected");
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!HOST || !USER || !PASS) {
      setStatus("missing env (HOST/USER/PASS)");
      return;
    }

    const url = `wss://${HOST}:8884/mqtt`;
    const client = mqtt.connect(url, {
      username: USER,
      password: PASS,
      protocol: "wss",
      protocolVersion: 4, // MQTT 3.1.1
      reconnectPeriod: 2000,
      clean: true,
      connectTimeout: 10000,
    });

    client.on("connect", () => {
      setStatus("connected");
      client.subscribe(TOPIC, { qos: 0 }, (err) => {
        if (err) setStatus("subscribe error: " + err.message);
      });
    });

    client.on("reconnect", () => setStatus("reconnecting"));
    client.on("error", (e) => setStatus("error: " + (e?.message || "unknown")));

    client.on("message", (topic, payload) => {
      let text = "";
      try {
        text = new TextDecoder().decode(payload as Uint8Array);
      } catch {
        text = String(payload);
      }
      const line = `${new Date().toLocaleTimeString()}  ${topic}  ${text}`;
      setLines((prev) => [line, ...prev].slice(0, 200));
    });

    return () => { client.end(true); };
  }, [HOST, USER, PASS]);

  return (
    <pre style={{ padding: 16, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      status: {status}
    subscribing: {TOPIC}


      {lines.join("")}
    </pre>
  );
}
