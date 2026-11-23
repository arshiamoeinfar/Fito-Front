
import { useState } from "react";
import PreviewNote from "../shared/PreviewNote/PreviewNote";

function ProgressRing({
  value,
  max,
  color,
  label,
  unit = "",
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  const missing =
    value == null ||
    value === "" ||
    !Number.isFinite(Number(value));

  const percentage = missing
    ? 0
    : Math.min(
        100,
        Math.max(0, (Number(value) / max) * 100)
      );

  const offset = circumference * (1 - percentage / 100);

  return (
    <div className="flex min-w-0 flex-col items-center">
      <div className="relative aspect-square w-full max-w-[112px] sm:max-w-[128px] lg:max-w-[144px]">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full -rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeOpacity="0.12"
            strokeWidth="15"
          />

          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="15"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
          <span
            className="text-xs font-bold sm:text-sm"
            style={{ color }}
          >
            {missing ? "ثبت نشده" : `${value}${unit}`}
          </span>

          <span className="mt-1 text-center text-[10px] leading-4 text-gray-400 sm:text-xs">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SleepEnergyCard({
  initialSleepHours = 7.5,
  initialSleepQuality = 85,
  initialEnergyLevel = 6,
  summary = "برای ریکاوری بهتر، خواب شبانه منظم و کافی داشته باش.",
  connected = false,
  sleepHours: sleepProp = null,
  sleepQuality: qualityProp = null,
  energyLevel: energyProp = null,
}) {
  const [sleepHours, setSleepHours] = useState(initialSleepHours);
  const [sleepQuality, setSleepQuality] = useState(initialSleepQuality);
  const [energyLevel, setEnergyLevel] = useState(initialEnergyLevel);

  const shownSleep = connected ? sleepProp : sleepHours;
  const shownQuality = connected ? qualityProp : sleepQuality;
  const shownEnergy = connected ? energyProp : energyLevel;

  const [editing] = useState(false);

  return (
    <section
      dir="rtl"
      className="w-full min-w-0 rounded-2xl bg-white p-3.5 sm:p-5 lg:p-6"
    >
      {/* Header */}
      <div className="mb-5 flex min-w-0 items-start justify-between gap-3 sm:mb-6">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-600 sm:text-base">
            خواب و انرژی
          </h3>

          {!connected && (
            <div className="mt-2">
              <PreviewNote />
            </div>
          )}
        </div>
      </div>

      {/* Progress Rings */}
      <div className="grid grid-cols-3 items-start gap-1.5 sm:gap-4 lg:gap-6">
        <ProgressRing
          value={shownSleep}
          max={10}
          color="#65AD3E"
          label="ساعت خواب"
        />

        <ProgressRing
          value={shownQuality}
          max={100}
          color="#6479C2"
          label="کیفیت خواب"
          unit="%"
        />

        <ProgressRing
          value={shownEnergy}
          max={10}
          color="#D3A52D"
          label="سطح انرژی"
        />
      </div>

      {/* Edit Controls */}
      {editing && (
        <div className="mt-5 space-y-4 rounded-xl bg-gray-50 p-3.5 sm:p-4">
          <label className="block text-xs leading-6 text-gray-600 sm:text-sm">
            ساعت خواب: {sleepHours}

            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={sleepHours}
              onChange={(e) =>
                setSleepHours(Number(e.target.value))
              }
              className="mt-2 w-full accent-blue-600"
            />
          </label>

          <label className="block text-xs leading-6 text-gray-600 sm:text-sm">
            کیفیت خواب: {sleepQuality}%

            <input
              type="range"
              min="0"
              max="100"
              value={sleepQuality}
              onChange={(e) =>
                setSleepQuality(Number(e.target.value))
              }
              className="mt-2 w-full accent-blue-600"
            />
          </label>

          <label className="block text-xs leading-6 text-gray-600 sm:text-sm">
            سطح انرژی: {energyLevel} از ۱۰

            <input
              type="range"
              min="0"
              max="10"
              value={energyLevel}
              onChange={(e) =>
                setEnergyLevel(Number(e.target.value))
              }
              className="mt-2 w-full accent-blue-600"
            />
          </label>
        </div>
      )}

      {/* Summary */}
      <div className="mt-5 rounded-2xl bg-gray-50 p-3.5 dark:bg-[var(--surface-secondary)] sm:mt-6 sm:p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700 sm:text-sm">
          <span className="shrink-0 text-blue-500">✳</span>
          خلاصه وضعیت
        </div>

        <p className="break-words text-xs leading-6 text-gray-500 sm:text-sm">
          {summary}
        </p>
      </div>
    </section>
  );
}
