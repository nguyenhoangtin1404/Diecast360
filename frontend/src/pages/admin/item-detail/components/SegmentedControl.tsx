import { useRef, type KeyboardEvent } from "react";
import segmentedStyles from "../../itemDetailSegmented.module.css";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  minWidth?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  mobile,
  fullWidthOnMobile,
  ariaLabel,
  disabled = false,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  mobile: boolean;
  fullWidthOnMobile?: boolean;
  ariaLabel: string;
  disabled?: boolean;
}) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusIndex = (index: number) => {
    if (disabled) return;
    const n = options.length;
    if (n === 0) return;
    const i = ((index % n) + n) % n;
    queueMicrotask(() => optionRefs.current[i]?.focus());
  };

  const groupClassName = [
    segmentedStyles.group,
    segmentedStyles.groupWrap,
    fullWidthOnMobile && mobile ? segmentedStyles.groupFullWidth : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={groupClassName}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled ? "true" : undefined}
    >
      {options.map((option, index) => {
        const selected = value === option.value;
        const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
          if (disabled) return;
          const n = options.length;
          if (n === 0) return;
          const currentIndex = options.findIndex((o) => o.value === value);
          const i = currentIndex === -1 ? index : currentIndex;

          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (e.key === " " && e.repeat) return;
            if (!selected) {
              onChange(option.value);
            }
            return;
          }

          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const next = (i + 1) % n;
            onChange(options[next].value);
            focusIndex(next);
            return;
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const next = (i - 1 + n) % n;
            onChange(options[next].value);
            focusIndex(next);
            return;
          }
          if (e.key === "Home") {
            e.preventDefault();
            onChange(options[0].value);
            focusIndex(0);
            return;
          }
          if (e.key === "End") {
            e.preventDefault();
            onChange(options[n - 1].value);
            focusIndex(n - 1);
          }
        };

        return (
          <button
            key={option.value}
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={disabled ? -1 : selected ? 0 : -1}
            disabled={disabled}
            className={[
              segmentedStyles.option,
              selected ? segmentedStyles.optionActive : "",
              mobile ? segmentedStyles.optionMobileGrow : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={option.minWidth ? { minWidth: option.minWidth } : undefined}
            onClick={() => {
              if (disabled) return;
              onChange(option.value);
            }}
            onKeyDown={onKeyDown}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
