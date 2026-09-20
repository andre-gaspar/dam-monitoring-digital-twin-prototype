"use client";

import { CheckCircle2Icon } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { GuideLanguage } from "./guideContent";

type GuideDataChallengePanelProps = {
  language: GuideLanguage;
  onSolved: () => void;
};

const EXPECTED_PP5_PORE_PRESSURE_KPA = 97.52;

const CHALLENGE_COPY = {
  en: {
    title: "Pore pressure challenge",
    prompt:
      "Locate instrument PP5 and enter its latest pore pressure to two decimal places.",
    label: "Latest PP5 pore pressure",
    placeholder: "Example: 95.20",
    unit: "kPa",
    verify: "Check answer",
    incorrect: "That is not the expected latest pore pressure for PP5.",
    correct: "Correct — the PP5 reading has been verified.",
  },
  pt: {
    title: "Desafio da pressão intersticial",
    prompt:
      "Localize o instrumento PP5 e introduza a respetiva pressão intersticial mais recente com duas casas decimais.",
    label: "Pressão intersticial mais recente do PP5",
    placeholder: "Exemplo: 95,20",
    unit: "kPa",
    verify: "Verificar resposta",
    incorrect:
      "Esse não é o valor esperado para a pressão intersticial mais recente do PP5.",
    correct: "Correto — a leitura do PP5 foi verificada.",
  },
} satisfies Record<GuideLanguage, Record<string, string>>;

type AnswerStatus = "idle" | "incorrect" | "correct";

function parseMetricAnswer(value: string) {
  const normalized = value
    .trim()
    .replace(/\s*kpa\s*$/i, "")
    .replace(",", ".")
    .trim();
  const parsed = Number(normalized);

  return normalized && Number.isFinite(parsed) ? parsed : null;
}

export function GuideDataChallengePanel({
  language,
  onSolved,
}: GuideDataChallengePanelProps) {
  const copy = CHALLENGE_COPY[language];
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<AnswerStatus>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAnswer = parseMetricAnswer(answer);
    const isCorrect =
      parsedAnswer !== null &&
      parsedAnswer === EXPECTED_PP5_PORE_PRESSURE_KPA;

    if (!isCorrect) {
      setStatus("incorrect");
      return;
    }

    setStatus("correct");
    onSolved();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 rounded-md border border-cyan-200/25 bg-cyan-300/8 p-3"
    >
      <p className="text-sm font-semibold text-cyan-100">{copy.title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-300">{copy.prompt}</p>

      <div className="mt-3">
        <Label htmlFor="guide-pp5-answer" className="text-xs text-white">
          {copy.label} ({copy.unit})
        </Label>
        <div className="mt-1.5 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Input
              id="guide-pp5-answer"
              value={answer}
              inputMode="decimal"
              autoComplete="off"
              disabled={status === "correct"}
              aria-invalid={status === "incorrect"}
              aria-describedby="guide-pp5-feedback"
              placeholder={copy.placeholder}
              onChange={(event) => {
                setAnswer(event.target.value);
                if (status !== "idle") setStatus("idle");
              }}
              className="border-white/20 bg-slate-950/55 pr-9 text-white placeholder:text-slate-500"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              {copy.unit}
            </span>
          </div>
          <Button
            type="submit"
            disabled={status === "correct"}
            className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          >
            {copy.verify}
          </Button>
        </div>
      </div>

      <div
        id="guide-pp5-feedback"
        aria-live="polite"
        className={cn(
          "mt-2 flex items-center gap-2 text-xs leading-5",
          status === "incorrect" && "text-rose-200",
          status === "correct" && "text-emerald-200"
        )}
      >
        {status === "incorrect" ? (
          <span>{copy.incorrect}</span>
        ) : status === "correct" ? (
          <>
            <CheckCircle2Icon className="size-3.5" />
            <span>{copy.correct}</span>
          </>
        ) : null}
      </div>
    </form>
  );
}
