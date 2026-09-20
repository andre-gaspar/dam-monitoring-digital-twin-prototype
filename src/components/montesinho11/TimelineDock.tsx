"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
import {
  localeForLanguage,
  montesinhoCopy,
  type MontesinhoLanguage,
} from "./i18n";

type TimelineDockProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mobileMode?: boolean;
  raiseAboveOverlays?: boolean;
  language: MontesinhoLanguage;
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

function formatDate(date: Date, language: MontesinhoLanguage) {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatMonthYear(date: Date, language: MontesinhoLanguage) {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
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
  language,
  mobileMode = false,
}: {
  title: string;
  selectedDate: Date;
  month: Date;
  align?: "left" | "right";
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
  language: MontesinhoLanguage;
  mobileMode?: boolean;
}) {
  const copy = montesinhoCopy[language];
  const mobileDialogRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef(onClose);

  closeRef.current = onClose;

  React.useEffect(() => {
    if (!mobileMode) return;

    const dialog = mobileDialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getFocusable = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));

    const frameId = window.requestAnimationFrame(() => {
      getFocusable()[0]?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      const dialogs = Array.from(
        document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')
      );
      if (dialogs[dialogs.length - 1] !== dialog) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const activeIndex = active ? focusable.indexOf(active) : -1;

      event.preventDefault();

      if (!dialog.contains(active) || activeIndex < 0) {
        (event.shiftKey ? last : first).focus();
        return;
      }

      const nextIndex = event.shiftKey
        ? activeIndex === 0
          ? focusable.length - 1
          : activeIndex - 1
        : activeIndex === focusable.length - 1
          ? 0
          : activeIndex + 1;

      focusable[nextIndex].focus();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [mobileMode]);

  const calendar = (
    <Card
      className={cn(
        "pointer-events-auto z-[9999] gap-0 rounded-xl border-black/10 bg-white p-3 py-3 text-black shadow-2xl",
        mobileMode
          ? "relative max-h-full w-[348px] max-w-full overflow-y-auto overscroll-contain"
          : "absolute bottom-14 w-[320px] max-w-[calc(100vw-2rem)]",
        !mobileMode && (align === "right" ? "right-0" : "left-0")
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
          aria-label={copy.timeline.closeCalendar}
          className={cn(
            "text-neutral-700 hover:bg-neutral-100",
            mobileMode && "h-11 w-11"
          )}
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
          aria-label={copy.timeline.previousMonth}
          className={cn("hover:bg-white", mobileMode && "h-11 w-11")}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>

        <div className="text-sm font-bold text-neutral-900">
          {formatMonthYear(month, language)}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onMonthChange(addMonths(month, 1))}
          aria-label={copy.timeline.nextMonth}
          className={cn("hover:bg-white", mobileMode && "h-11 w-11")}
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
          className={cn(
            "mx-auto w-full p-0",
            mobileMode ? "[--cell-size:2.75rem]" : "[--cell-size:2.25rem]"
          )}
          style={
            mobileMode
              ? ({
                  "--cell-size":
                    "min(2.75rem, calc((100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 48px) / 7))",
                } as React.CSSProperties)
              : undefined
          }
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

  if (!mobileMode) return calendar;

  const mobileCalendar = (
    <div
      ref={mobileDialogRef}
      className="pointer-events-auto fixed inset-0 z-[9998] flex items-center justify-center bg-black/40"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
        paddingRight: "calc(env(safe-area-inset-right, 0px) + 12px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        paddingLeft: "calc(env(safe-area-inset-left, 0px) + 12px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      onPointerDown={onClose}
    >
      {calendar}
    </div>
  );

  return typeof document === "undefined"
    ? mobileCalendar
    : createPortal(mobileCalendar, document.body);
}

export function TimelineDock({
  isOpen,
  onOpenChange,
  mobileMode = false,
  raiseAboveOverlays = false,
  language,
  defaultStartDate = createLocalDate(2023, 0, 12),
  defaultEndDate = createLocalDate(2025, 0, 8),
  onBoundsChange,
  onSelectedRangeChange,
}: TimelineDockProps) {
  const copy = montesinhoCopy[language];

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
    <div
      data-overlay-focus-scope={raiseAboveOverlays ? "" : undefined}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0",
        mobileMode
          ? "pb-[calc(env(safe-area-inset-bottom,0px)+12px)]"
          : "px-6 pb-6",
        raiseAboveOverlays ? "z-[70]" : "z-50"
      )}
      style={
        mobileMode
          ? {
              paddingLeft: "calc(env(safe-area-inset-left, 0px) + 12px)",
              paddingRight: "calc(env(safe-area-inset-right, 0px) + 12px)",
            }
          : undefined
      }
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-col items-center",
          mobileMode ? "max-w-md" : "max-w-6xl"
        )}
      >
        <Button
          type="button"
          size={mobileMode ? "icon" : "icon-lg"}
          variant={isOpen ? "secondary" : "default"}
          onClick={() => onOpenChange(!isOpen)}
          className={cn(
            "pointer-events-auto mb-2 rounded-full shadow-2xl transition-all duration-300",
            mobileMode && "h-11 w-11",
            isOpen
              ? "border border-white/50 bg-white/90 text-black hover:bg-white"
              : "translate-y-1 bg-black/90 text-white hover:bg-black"
          )}
          aria-label={
            isOpen ? copy.timeline.hide : copy.timeline.show
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
              ? mobileMode
                ? "max-h-[58dvh] translate-y-0 opacity-100"
                : "max-h-56 translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 translate-y-4 overflow-hidden opacity-0"
          )}
          style={
            mobileMode && isOpen
              ? {
                  maxHeight:
                    "max(88px, calc(50dvh - env(safe-area-inset-bottom, 0px) - 76px))",
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                }
              : undefined
          }
          aria-hidden={!isOpen}
          inert={!isOpen ? true : undefined}
        >
          <Card
            className={cn(
              "gap-0 rounded-xl border-white/20 bg-white/95 text-black shadow-2xl backdrop-blur-md",
              mobileMode ? "overflow-visible px-3 py-3" : "px-5 py-4"
            )}
          >
            <div
              className={cn(
                "mb-3 flex gap-4",
                mobileMode
                  ? "flex-col items-stretch gap-2"
                  : "items-center justify-between"
              )}
            >
              <div className="text-sm font-semibold">{copy.timeline.title}</div>

              <div
                className={cn(
                  "rounded-full bg-black px-3 py-1 font-medium text-white",
                  mobileMode ? "text-center text-[11px]" : "text-xs"
                )}
              >
                {copy.timeline.selected}: {formatDate(selectedStartDate, language)} →{" "}
                {formatDate(selectedEndDate, language)}
              </div>
            </div>

            <div
              className={cn(
                mobileMode
                  ? "flex flex-col gap-3"
                  : "grid grid-cols-[auto_1fr_auto] items-center gap-4"
              )}
            >
              <div className="relative flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size={mobileMode ? "icon" : "icon-lg"}
                  onClick={openStartCalendar}
                  className={cn(
                    "rounded-full border-black/10 bg-white text-black shadow-sm hover:bg-neutral-100",
                    mobileMode && "h-11 w-11"
                  )}
                  aria-label={copy.timeline.pickStart}
                >
                  <CalendarIcon className="size-5" />
                </Button>

                <div
                  className={cn(
                    "text-sm font-medium",
                    mobileMode ? "min-w-0 flex-1" : "min-w-[105px]"
                  )}
                >
                  {mobileMode ? `${copy.timeline.datasetStart}: ` : null}
                  {formatDate(startDate, language)}
                </div>

                {openCalendar === "start" && (
                  <CalendarPopup
                    title={copy.timeline.startDate}
                    selectedDate={startDate}
                    month={startCalendarMonth}
                    align="left"
                    onMonthChange={setStartCalendarMonth}
                    onSelectDate={handleStartDateSelect}
                    onClose={() => setOpenCalendar(null)}
                    language={language}
                    mobileMode={mobileMode}
                  />
                )}
              </div>

              <div className={cn("relative pt-8", mobileMode ? "px-1" : "px-4")}>
                <div
                  className="pointer-events-none absolute top-0 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs font-medium text-white shadow-md"
                  style={getSliderLabelStyle(sliderValues[0])}
                >
                  {formatDate(selectedStartDate, language)}
                </div>

                <div
                  className="pointer-events-none absolute top-0 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs font-medium text-white shadow-md"
                  style={getSliderLabelStyle(sliderValues[1])}
                >
                  {formatDate(selectedEndDate, language)}
                </div>

                <Slider
                  min={0}
                  max={100}
                  step={0.01}
                  value={sliderValues}
                  onValueChange={handleSliderChange}
                  className={cn(
                    mobileMode &&
                      "h-11 [&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-track]]:h-2"
                  )}
                />
              </div>

              <div className="relative flex items-center justify-end gap-2">
                <div
                  className={cn(
                    "text-sm font-medium",
                    mobileMode ? "min-w-0 flex-1" : "min-w-[105px] text-right"
                  )}
                >
                  {mobileMode ? `${copy.timeline.datasetEnd}: ` : null}
                  {formatDate(endDate, language)}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size={mobileMode ? "icon" : "icon-lg"}
                  onClick={openEndCalendar}
                  className={cn(
                    "rounded-full border-black/10 bg-white text-black shadow-sm hover:bg-neutral-100",
                    mobileMode && "h-11 w-11"
                  )}
                  aria-label={copy.timeline.pickEnd}
                >
                  <CalendarIcon className="size-5" />
                </Button>

                {openCalendar === "end" && (
                  <CalendarPopup
                    title={copy.timeline.endDate}
                    selectedDate={endDate}
                    month={endCalendarMonth}
                    align="right"
                    onMonthChange={setEndCalendarMonth}
                    onSelectDate={handleEndDateSelect}
                    onClose={() => setOpenCalendar(null)}
                    language={language}
                    mobileMode={mobileMode}
                  />
                )}
              </div>
            </div>

            <div
              className={cn(
                "mt-3 flex items-center justify-between text-muted-foreground",
                mobileMode ? "gap-2 text-[10px]" : "text-xs"
              )}
            >
              <span>{copy.timeline.datasetStart}</span>
              <span>
                {formatDate(selectedStartDate, language)} →{" "}
                {formatDate(selectedEndDate, language)}
              </span>
              <span>{copy.timeline.datasetEnd}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
