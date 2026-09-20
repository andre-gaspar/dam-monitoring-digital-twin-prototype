"use client";

import * as React from "react";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type TimelineDockProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  defaultStartDate?: Date;
  defaultEndDate?: Date;
  onBoundsChange?: (startDate: Date, endDate: Date) => void;
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

function getSliderLabelStyle(value: number): React.CSSProperties {
  const position = clamp(value, 0, 100);
  const transform =
    position <= 8
      ? "translateX(0)"
      : position >= 92
        ? "translateX(-100%)"
        : "translateX(-50%)";

  return {
    left: `${position}%`,
    transform,
  };
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
    <Card
      className={cn(
        "pointer-events-auto absolute bottom-14 z-[9999] w-[320px] max-w-[calc(100vw-2rem)] gap-0 rounded-xl border-black/10 bg-white p-3 py-3 text-black shadow-2xl",
        align === "right" ? "right-0" : "left-0"
      )}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-700">{title}</span>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          aria-label="Close calendar"
          className="text-neutral-700 hover:bg-neutral-100"
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-lg bg-neutral-100 px-2 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onMonthChange(addMonths(month, -1))}
          aria-label="Previous month"
          className="hover:bg-white"
        >
          <ChevronLeftIcon className="size-4" />
        </Button>

        <div className="text-sm font-bold text-neutral-900">
          {formatMonthYear(month)}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onMonthChange(addMonths(month, 1))}
          aria-label="Next month"
          className="hover:bg-white"
        >
          <ChevronRightIcon className="size-4" />
        </Button>
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
    </Card>
  );
}

export function TimelineDock({
  isOpen,
  onOpenChange,
  defaultStartDate = createLocalDate(2023, 0, 12),
  defaultEndDate = createLocalDate(2025, 0, 8),
  onBoundsChange,
  onSelectedRangeChange,
}: TimelineDockProps) {
  const [startDate, setStartDate] = React.useState(() =>
    startOfLocalDay(defaultStartDate)
  );

  const [endDate, setEndDate] = React.useState(() =>
    startOfLocalDay(defaultEndDate)
  );

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

  React.useEffect(() => {
    if (!isOpen) {
      setOpenCalendar(null);
    }
  }, [isOpen]);

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
    const nextEndValue = dateToSliderValue(
      currentSelectedEnd,
      nextStart,
      nextEnd
    );

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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-6 pb-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
        <Button
          type="button"
          size="icon-lg"
          variant={isOpen ? "secondary" : "default"}
          onClick={() => onOpenChange(!isOpen)}
          className={cn(
            "pointer-events-auto mb-2 rounded-full shadow-2xl transition-all duration-300",
            isOpen
              ? "border border-white/50 bg-white/90 text-black hover:bg-white"
              : "translate-y-1 bg-black/90 text-white hover:bg-black"
          )}
          aria-label={
            isOpen ? "Hide monitoring timeline" : "Show monitoring timeline"
          }
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <ChevronDownIcon className="size-6" />
          ) : (
            <ChevronUpIcon className="size-6" />
          )}
        </Button>

        <div
          className={cn(
            "pointer-events-auto w-full transition-all duration-300 ease-out",
            isOpen
              ? "max-h-56 translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 translate-y-4 overflow-hidden opacity-0"
          )}
          aria-hidden={!isOpen}
        >
          <Card className="gap-0 rounded-xl border-white/20 bg-white/95 px-5 py-4 text-black shadow-2xl backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="text-sm font-semibold">Monitoring timeline</div>

              <div className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                Selected: {formatDate(selectedStartDate)} →{" "}
                {formatDate(selectedEndDate)}
              </div>
            </div>

            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <div className="relative flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  onClick={openStartCalendar}
                  className="rounded-full border-black/10 bg-white text-black shadow-sm hover:bg-neutral-100"
                  aria-label="Pick dataset start date"
                >
                  <CalendarIcon className="size-5" />
                </Button>

                <div className="min-w-[105px] text-sm font-medium">
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
                  className="pointer-events-none absolute top-0 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs font-medium text-white shadow-md"
                  style={getSliderLabelStyle(sliderValues[0])}
                >
                  {formatDate(selectedStartDate)}
                </div>

                <div
                  className="pointer-events-none absolute top-0 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs font-medium text-white shadow-md"
                  style={getSliderLabelStyle(sliderValues[1])}
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
                <div className="min-w-[105px] text-right text-sm font-medium">
                  {formatDate(endDate)}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  onClick={openEndCalendar}
                  className="rounded-full border-black/10 bg-white text-black shadow-sm hover:bg-neutral-100"
                  aria-label="Pick dataset end date"
                >
                  <CalendarIcon className="size-5" />
                </Button>

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
          </Card>
        </div>
      </div>
    </div>
  );
}
