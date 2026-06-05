"use client";

/**
 * @typedef {import('@/lib/trading/labels').BilingualString} BilingualString
 */

/**
 * @param {Object} props
 * @param {string} props.si
 * @param {string} props.en
 * @param {'label' | 'heading' | 'title' | 'tab' | 'inline' | 'stat'} [props.variant]
 * @param {boolean} [props.reverse]
 * @param {string} [props.className]
 */
export function BilingualText({
  si,
  en,
  variant = "label",
  reverse = false,
  className = "",
}) {
  const siStyles = {
    label: "text-[14px] font-medium leading-snug text-neutral-900",
    stat: "text-[12px] font-medium leading-snug text-neutral-800",
    tab: "text-[13px] font-semibold leading-tight text-neutral-900 sm:text-[14px]",
    heading: "text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl",
    title: "text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-[2.75rem]",
    inline: "text-[15px] font-medium text-neutral-900",
  };

  const enStyles = {
    label: "mt-0.5 text-[11px] leading-tight text-neutral-400",
    stat: "mt-0.5 text-[10px] leading-tight text-neutral-400",
    tab: "mt-0.5 text-[10px] leading-tight text-neutral-400",
    heading: "mt-1.5 text-[13px] leading-relaxed text-neutral-400 sm:text-sm",
    title: "mt-2 text-[14px] leading-relaxed text-neutral-400 sm:text-[15px]",
    inline: "ml-2 text-[12px] text-neutral-400",
  };

  const siEl = (
    <span className={siStyles[variant]} lang="si">
      {si}
    </span>
  );
  const enEl = (
    <span className={enStyles[variant]} lang="en">
      {en}
    </span>
  );

  if (variant === "inline") {
    return (
      <span className={`inline-flex flex-wrap items-baseline gap-x-1 ${className}`}>
        {siEl}
        {enEl}
      </span>
    );
  }

  return (
    <div
      className={`flex flex-col ${reverse ? "flex-col-reverse" : ""} ${className}`}
    >
      {siEl}
      {enEl}
    </div>
  );
}
