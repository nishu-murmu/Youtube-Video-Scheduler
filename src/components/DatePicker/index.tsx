import { useEffect, useRef, useState } from "react";
import {
  addDays,
  addHours,
  format,
  formatDistanceToNowStrict,
  nextSaturday,
  setHours,
  startOfHour,
} from "date-fns";
import { AlertCircle, CalendarClock } from "lucide-react";

const ITEM_HEIGHT = 36;
const VISIBLE_OFFSET = 3;
const WHEEL_THRESHOLD = 40;
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad = (value: number) => value.toString().padStart(2, "0");

type WheelColumnProps = {
  label: string;
  values: number[];
  current: number;
  onSelect: (value: number) => void;
  format?: (value: number) => string;
};

// A single scrollable column. Supports mouse wheel / trackpad, drag, click
// on a neighbouring item, and arrow keys. Selection stops at either end.
const WheelColumn = ({
  label,
  values,
  current,
  onSelect,
  format: formatValue = pad,
}: WheelColumnProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ values, current, onSelect });
  latest.current = { values, current, onSelect };
  const wheelDelta = useRef(0);
  const drag = useRef<{ startY: number; startIndex: number; moved: boolean }>(
    null
  );

  const currentIndex = values.indexOf(current);

  const selectIndex = (index: number) => {
    const { values, current, onSelect } = latest.current;
    if (!values.length) return;
    const clamped = Math.min(Math.max(index, 0), values.length - 1);
    if (values[clamped] !== current) onSelect(values[clamped]);
  };

  const stepBy = (steps: number) => {
    const { values, current } = latest.current;
    const index = values.indexOf(current);
    selectIndex((index === -1 ? 0 : index) + steps);
  };

  // Keep the selection valid when the available values shrink
  useEffect(() => {
    if (currentIndex === -1 && values.length > 0) onSelect(values[0]);
  }, [currentIndex, values.length]);

  // Native listener so preventDefault works (React wheel listeners are passive)
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;

      // A mouse notch is one step; trackpad deltas are accumulated
      if (Math.abs(delta) >= 100) {
        wheelDelta.current = 0;
        stepBy(Math.sign(delta));
        return;
      }
      if (Math.sign(delta) !== Math.sign(wheelDelta.current)) {
        wheelDelta.current = 0;
      }
      wheelDelta.current += delta;
      const steps = Math.trunc(wheelDelta.current / WHEEL_THRESHOLD);
      if (steps !== 0) {
        wheelDelta.current -= steps * WHEEL_THRESHOLD;
        stepBy(steps);
      }
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      startY: e.clientY,
      startIndex: Math.max(currentIndex, 0),
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dy = drag.current.startY - e.clientY;
    if (Math.abs(dy) > 4) drag.current.moved = true;
    if (drag.current.moved) {
      selectIndex(drag.current.startIndex + Math.round(dy / ITEM_HEIGHT));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current && !drag.current.moved) {
      // Treat as a click on whichever item is under the pointer
      const rect = e.currentTarget.getBoundingClientRect();
      const offset = Math.round(
        (e.clientY - (rect.top + rect.height / 2)) / ITEM_HEIGHT
      );
      if (offset !== 0) stepBy(offset);
    }
    drag.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      PageUp: -5,
      PageDown: 5,
    };
    // Stop propagation so YouTube's own shortcuts (seek, volume) don't fire
    if (e.key in steps || e.key === "Home" || e.key === "End") {
      e.stopPropagation();
    }
    if (e.key in steps) {
      e.preventDefault();
      stepBy(steps[e.key]);
    } else if (e.key === "Home") {
      e.preventDefault();
      selectIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      selectIndex(values.length - 1);
    }
  };

  return (
    <div
      ref={ref}
      role="spinbutton"
      aria-label={label}
      aria-valuenow={current}
      aria-valuetext={currentIndex === -1 ? undefined : formatValue(current)}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={handleKeyDown}
      className="relative z-10 h-full min-w-0 flex-1 cursor-grab touch-none select-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 active:cursor-grabbing"
    >
      {values.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-zinc-400">
          —
        </div>
      ) : (
        values.map((value, index) => {
          const offset = index - currentIndex;
          if (Math.abs(offset) > VISIBLE_OFFSET) return null;

          const distance = Math.abs(offset);
          return (
            <div
              key={value}
              className={`pointer-events-none absolute inset-x-0 top-1/2 flex items-center justify-center tabular-nums transition-[transform,opacity,color] duration-150 ease-out ${
                offset === 0
                  ? "text-[17px] font-semibold text-zinc-900"
                  : "text-[16px] font-medium text-zinc-400"
              }`}
              style={{
                height: ITEM_HEIGHT,
                marginTop: -ITEM_HEIGHT / 2,
                opacity: distance === VISIBLE_OFFSET ? 0 : 1 - distance * 0.25,
                transform: `translateY(${offset * ITEM_HEIGHT}px) scale(${
                  1 - distance * 0.06
                })`,
              }}
            >
              {formatValue(value)}
            </div>
          );
        })
      )}
    </div>
  );
};

export const NeoMorphicDateTimePicker = ({
  selectedDate,
  onChange,
}: NeoMorphicDateTimePickerProps) => {
  const currentDateTime = new Date();
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const parseDate = (dateInput: Date | string | null | undefined): Date => {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === "string") {
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  };

  const initialDate = parseDate(selectedDate);
  if (initialDate.getTime() < currentDateTime.getTime()) {
    initialDate.setTime(currentDateTime.getTime());
  }

  const [date, setDate] = useState(initialDate.getDate());
  const [month, setMonth] = useState(initialDate.getMonth() + 1);
  const [year, setYear] = useState(initialDate.getFullYear());
  const [hour, setHour] = useState(initialDate.getHours());
  const [minute, setMinute] = useState(initialDate.getMinutes());

  const applyDate = (value: Date) => {
    setYear(value.getFullYear());
    setMonth(value.getMonth() + 1);
    setDate(value.getDate());
    setHour(value.getHours());
    setMinute(value.getMinutes());
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const parsedDate = parseDate(selectedDate);
      // Only update if the parsed date is different from current internal state
      const currentInternalDate = new Date(year, month - 1, date, hour, minute);
      if (parsedDate.getTime() !== currentInternalDate.getTime()) {
        applyDate(parsedDate);
      }
    }
  }, [selectedDate]);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const isCurrentYear = year === currentDateTime.getFullYear();
  const isCurrentMonth =
    isCurrentYear && month === currentDateTime.getMonth() + 1;
  const isToday = isCurrentMonth && date === currentDateTime.getDate();
  const isCurrentHour = isToday && hour === currentDateTime.getHours();

  const days = Array.from(
    { length: getDaysInMonth(month, year) },
    (_, i) => i + 1
  ).filter((d) => !isCurrentMonth || d >= currentDateTime.getDate());

  const months = Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (m) => !isCurrentYear || m >= currentDateTime.getMonth() + 1
  );

  const years = Array.from(
    { length: 21 },
    (_, i) => currentDateTime.getFullYear() + i
  );

  const hours = Array.from({ length: 24 }, (_, i) => i).filter(
    (h) => !isToday || h >= currentDateTime.getHours()
  );

  const minutes = Array.from({ length: 60 }, (_, i) => i).filter(
    (m) => !isCurrentHour || m >= currentDateTime.getMinutes()
  );

  useEffect(() => {
    const newTime = new Date(year, month - 1, date, hour, minute);
    const maxDays = getDaysInMonth(month, year);
    if (date > maxDays) {
      setDate(maxDays);
    }

    // Compare at minute precision so "now" itself isn't flagged as the past
    const startOfCurrentMinute = new Date(currentDateTime);
    startOfCurrentMinute.setSeconds(0, 0);
    if (newTime.getTime() < startOfCurrentMinute.getTime()) {
      applyDate(currentDateTime);
      setError("That time has already passed, so it was moved to now.");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setError(null), 3000);
    }
  }, [year, month, date, hour, minute, selectedDate]);

  useEffect(() => {
    if (onChange) {
      const newDateObj = new Date(year, month - 1, date, hour, minute);
      const currentSelectedDate = selectedDate ? parseDate(selectedDate) : null;
      if (
        !currentSelectedDate ||
        newDateObj.getTime() !== currentSelectedDate.getTime()
      ) {
        onChange(newDateObj);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, month, year, hour, minute]);

  const selected = new Date(year, month - 1, date, hour, minute);
  const nextHour = startOfHour(addHours(currentDateTime, 2));
  const presets = [
    { label: "In 1 hour", value: addHours(currentDateTime, 1) },
    nextHour.getDate() === currentDateTime.getDate()
      ? { label: format(nextHour, "'Today' HH:mm"), value: nextHour }
      : null,
    {
      label: "Tomorrow 09:00",
      value: setHours(startOfHour(addDays(currentDateTime, 1)), 9),
    },
    {
      label: "Saturday 10:00",
      value: setHours(startOfHour(nextSaturday(currentDateTime)), 10),
    },
  ].filter((preset): preset is { label: string; value: Date } => !!preset);

  const relative =
    selected.getTime() - currentDateTime.getTime() < 60_000
      ? "right now"
      : formatDistanceToNowStrict(selected, { addSuffix: true });

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap gap-2">
        {presets.map(({ label, value }) => {
          const isActive =
            Math.abs(value.getTime() - selected.getTime()) < 60_000;
          return (
            <button
              key={label}
              type="button"
              onClick={() => applyDate(value)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl bg-zinc-50 p-2 ring-1 ring-zinc-200/80">
        <div className="flex px-1 pt-1 pb-2 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          <span className="flex-1 text-center">Day</span>
          <span className="flex-1 text-center">Month</span>
          <span className="flex-[1.4] text-center">Year</span>
          <span className="w-4" />
          <span className="flex-1 text-center">Hour</span>
          <span className="w-3" />
          <span className="flex-1 text-center">Min</span>
        </div>

        <div
          className="relative flex px-1"
          style={{
            height: ITEM_HEIGHT * 5,
            maskImage:
              "linear-gradient(to bottom, transparent, #000 28%, #000 72%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, #000 28%, #000 72%, transparent)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 rounded-lg bg-white shadow-sm ring-1 ring-zinc-200"
            style={{ height: ITEM_HEIGHT, marginTop: -ITEM_HEIGHT / 2 }}
          />
          <div className="flex flex-1">
            <WheelColumn
              label="Day"
              values={days}
              current={date}
              onSelect={setDate}
            />
          </div>
          <div className="flex flex-1">
            <WheelColumn
              label="Month"
              values={months}
              current={month}
              onSelect={setMonth}
              format={(m) => MONTH_NAMES[m - 1]}
            />
          </div>
          <div className="flex flex-[1.4]">
            <WheelColumn
              label="Year"
              values={years}
              current={year}
              onSelect={setYear}
              format={String}
            />
          </div>
          <div className="relative z-10 flex w-4 items-center justify-center">
            <span className="h-6 w-px bg-zinc-200" />
          </div>
          <div className="flex flex-1">
            <WheelColumn
              label="Hour"
              values={hours}
              current={hour}
              onSelect={setHour}
            />
          </div>
          <div className="relative z-10 flex w-3 items-center justify-center text-[17px] font-semibold text-zinc-400">
            :
          </div>
          <div className="flex flex-1">
            <WheelColumn
              label="Minute"
              values={minutes}
              current={minute}
              onSelect={setMinute}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <CalendarClock className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900">
            {format(selected, "EEEE, d MMMM yyyy 'at' HH:mm")}
          </p>
          <p className="text-xs text-zinc-500">{relative}</p>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};
