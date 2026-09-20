"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  label: string;
  value: string;              // ISO string like 2025-04-01T09:00:00Z
  onChange: (iso: string) => void;
};

function isoToParts(iso: string): { date?: Date; time: string } {
  if (!iso) return { date: undefined, time: "00:00:00" };
  const d = new Date(iso);
  // show in UTC
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return { date: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), time: `${hh}:${mm}:${ss}` };
}

function partsToIso(date: Date | undefined, time: string): string {
  if (!date) return "";
  const t = time.length === 5 ? `${time}:00` : time; // ensure seconds
  const [hh, mm, ss] = t.split(":").map(Number);
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, ss || 0));
  return utc.toISOString();
}

export function DateTimePicker({ label, value, onChange }: Props) {
  const [open, setOpen] = React.useState(false);

  const { date, time } = React.useMemo(() => isoToParts(value), [value]);

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-3">
        <Label className="px-1">{label}</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-40 justify-between font-normal">
              {date
                ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
                    date.getUTCDate()
                    ).padStart(2, "0")}`
                : "Select date"}
              <ChevronDownIcon className="h-4 w-4 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(d) => {
                onChange(partsToIso(d, time));
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-3">
        <Label className="px-1">Time (UTC)</Label>
        <Input
          type="time"
          step="1"
          value={time}
          onChange={(e) => onChange(partsToIso(date, e.target.value))}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
