"use client";

import * as React from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";

type MonitoringDateSliderProps = {
  defaultStartDate?: Date;
  defaultEndDate?: Date;

  /**
   * Called when the outer calendar bounds change.
   * Example: dataset available from 2023-01-12 to 2025-01-08.
   */
  onBoundsChange?: (startDate: Date, endDate: Date) => void;

  /**
   * Called when the two draggable slider thumbs change.
   * This is the callback you will later use to query Supabase.
   */
  onSelectedRangeChange?: (
    selectedStartDate: Date,
    selectedEndDate: Date,
    sliderValues: [number, number]
  ) => void;
};

function createLocalDate(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, 0, 0, 0, 0);
}

function startOfLocalDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function sortSliderRange(values: number[]): [number, number] {
  const a = clamp(values[0] ?? 0, 0, 100);
  const b = clamp(values[1] ?? 100, 0, 100);

  return a <= b ? [a, b] : [b, a];
}

function dateToSliderValue(date: Date, startDate: Date, endDate: Date) {
  const start = startOfLocalDay(startDate).getTime();
  const end = startOfLocalDay(endDate).getTime();
  const current = startOfLocalDay(date).getTime();

  if (end <= start) return 0;

  return clamp(((current - start) / (end - start)) * 100, 0, 100);
}

function sliderValueToDate(value: number, startDate: Date, endDate: Date) {
  const start = startOfLocalDay(startDate).getTime();
  const end = startOfLocalDay(endDate).getTime();
  const t = clamp(value, 0, 100) / 100;

  return startOfLocalDay(new Date(start + (end - start) * t));
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function CalendarPopup({
  title,
  selectedDate,
  month,
  align = "left",
  onMonthChange,
  onSelectDate,
  onClose,
}: {
  title: string;
  selectedDate: Date;
  month: Date;
  align?: "left" | "right";
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}) {
  return (
    <div
      className={`pointer-events-auto absolute bottom-14 z-[9999] w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-black/10 bg-white p-3 text-black shadow-2xl ${
        align === "right" ? "right-0" : "left-0"
      }`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-700">{title}</span>

        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-neutral-700 hover:bg-neutral-100"
          aria-label="Close calendar"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-xl bg-neutral-100 px-2 py-2">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          className="rounded-md p-1 hover:bg-white"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="size-4" />
        </button>

        <div className="text-sm font-bold text-neutral-900">
          {formatMonthYear(month)}
        </div>

        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="rounded-md p-1 hover:bg-white"
          aria-label="Next month"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>

      <div className="flex w-full justify-center">
        <Calendar
          mode="single"
          month={month}
          onMonthChange={onMonthChange}
          selected={selectedDate}
          onDayClick={(day) => {
            onSelectDate(startOfLocalDay(day));
          }}
          captionLayout="label"
          className="mx-auto w-full p-0 [--cell-size:2.25rem]"
          classNames={{
            root: "w-full",
            months: "w-full",
            month: "w-full",
            month_caption: "hidden",
            nav: "hidden",
            table: "w-full border-collapse",
            weekdays: "grid grid-cols-7 w-full",
            weekday:
              "flex h-8 items-center justify-center text-sm font-normal text-neutral-500 select-none",
            week: "grid grid-cols-7 w-full",
            day: "relative flex aspect-square items-center justify-center p-0 text-center select-none",
          }}
        />
      </div>
    </div>
  );
}

export function MonitoringDateSlider({
  defaultStartDate = createLocalDate(2023, 0, 12),
  defaultEndDate = createLocalDate(2025, 0, 8),
  onBoundsChange,
  onSelectedRangeChange,
}: MonitoringDateSliderProps) {
  const [startDate, setStartDate] = React.useState(() =>
    startOfLocalDay(defaultStartDate)
  );

  const [endDate, setEndDate] = React.useState(() =>
    startOfLocalDay(defaultEndDate)
  );

  /**
   * Two slider thumbs.
   * 0 = dataset start
   * 100 = dataset end
   */
  const [sliderValues, setSliderValues] = React.useState<[number, number]>([
    0, 100,
  ]);

  const [openCalendar, setOpenCalendar] = React.useState<
    "start" | "end" | null
  >(null);

  const [startCalendarMonth, setStartCalendarMonth] = React.useState(startDate);
  const [endCalendarMonth, setEndCalendarMonth] = React.useState(endDate);

  const selectedStartDate = React.useMemo(() => {
    return sliderValueToDate(sliderValues[0], startDate, endDate);
  }, [sliderValues, startDate, endDate]);

  const selectedEndDate = React.useMemo(() => {
    return sliderValueToDate(sliderValues[1], startDate, endDate);
  }, [sliderValues, startDate, endDate]);

  React.useEffect(() => {
    onSelectedRangeChange?.(selectedStartDate, selectedEndDate, sliderValues);
  }, [
    selectedStartDate,
    selectedEndDate,
    sliderValues,
    onSelectedRangeChange,
  ]);

  function openStartCalendar() {
    setStartCalendarMonth(startDate);
    setOpenCalendar((prev) => (prev === "start" ? null : "start"));
  }

  function openEndCalendar() {
    setEndCalendarMonth(endDate);
    setOpenCalendar((prev) => (prev === "end" ? null : "end"));
  }

  function updateBounds(nextStart: Date, nextEnd: Date) {
    const currentSelectedStart = sliderValueToDate(
      sliderValues[0],
      startDate,
      endDate
    );
    const currentSelectedEnd = sliderValueToDate(
      sliderValues[1],
      startDate,
      endDate
    );

    const nextStartValue = dateToSliderValue(
      currentSelectedStart,
      nextStart,
      nextEnd
    );
    const nextEndValue = dateToSliderValue(currentSelectedEnd, nextStart, nextEnd);

    setStartDate(nextStart);
    setEndDate(nextEnd);
    setSliderValues(sortSliderRange([nextStartValue, nextEndValue]));

    onBoundsChange?.(nextStart, nextEnd);
  }

  function handleStartDateSelect(date: Date) {
    const nextStart = startOfLocalDay(date);
    let nextEnd = endDate;

    if (nextStart.getTime() > endDate.getTime()) {
      nextEnd = nextStart;
    }

    updateBounds(nextStart, nextEnd);
    setOpenCalendar(null);
  }

  function handleEndDateSelect(date: Date) {
    const nextEnd = startOfLocalDay(date);
    let nextStart = startDate;

    if (nextEnd.getTime() < startDate.getTime()) {
      nextStart = nextEnd;
    }

    updateBounds(nextStart, nextEnd);
    setOpenCalendar(null);
  }

  function handleSliderChange(value: number[]) {
    setSliderValues(sortSliderRange(value));
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pointer-events-none">
      <div className="mx-auto w-full max-w-6xl pointer-events-auto">
        <div className="rounded-2xl border border-white/20 bg-white/95 px-5 py-4 shadow-2xl backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="text-sm font-semibold text-black">
              Monitoring timeline
            </div>

            <div className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
              Selected: {formatDate(selectedStartDate)} →{" "}
              {formatDate(selectedEndDate)}
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={openStartCalendar}
                className="flex size-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:bg-neutral-100"
                aria-label="Pick dataset start date"
              >
                <CalendarIcon className="size-5" />
              </button>

              <div className="min-w-[105px] text-sm font-medium text-black">
                {formatDate(startDate)}
              </div>

              {openCalendar === "start" && (
                <CalendarPopup
                  title="Dataset start date"
                  selectedDate={startDate}
                  month={startCalendarMonth}
                  align="left"
                  onMonthChange={setStartCalendarMonth}
                  onSelectDate={handleStartDateSelect}
                  onClose={() => setOpenCalendar(null)}
                />
              )}
            </div>

            <div className="relative px-4 pt-8">
              <div
                className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md bg-black px-2 py-1 text-xs font-medium text-white shadow-md"
                style={{ left: `${sliderValues[0]}%` }}
              >
                {formatDate(selectedStartDate)}
              </div>

              <div
                className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md bg-black px-2 py-1 text-xs font-medium text-white shadow-md"
                style={{ left: `${sliderValues[1]}%` }}
              >
                {formatDate(selectedEndDate)}
              </div>

              <Slider
                min={0}
                max={100}
                step={0.01}
                value={sliderValues}
                onValueChange={handleSliderChange}
              />
            </div>

            <div className="relative flex items-center justify-end gap-2">
              <div className="min-w-[105px] text-right text-sm font-medium text-black">
                {formatDate(endDate)}
              </div>

              <button
                type="button"
                onClick={openEndCalendar}
                className="flex size-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:bg-neutral-100"
                aria-label="Pick dataset end date"
              >
                <CalendarIcon className="size-5" />
              </button>

              {openCalendar === "end" && (
                <CalendarPopup
                  title="Dataset end date"
                  selectedDate={endDate}
                  month={endCalendarMonth}
                  align="right"
                  onMonthChange={setEndCalendarMonth}
                  onSelectDate={handleEndDateSelect}
                  onClose={() => setOpenCalendar(null)}
                />
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Dataset start</span>
            <span>
              {formatDate(selectedStartDate)} → {formatDate(selectedEndDate)}
            </span>
            <span>Dataset end</span>
          </div>
        </div>
      </div>
    </div>
  );
}