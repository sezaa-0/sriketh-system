"use client";

/**
 * @param {Object} props
 * @param {string} props.labelSi
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 * @param {'green' | 'orange'} [props.accent]
 */
export function FormField({ labelSi, children, className = "", accent = "green" }) {
  return (
    <div className={className}>
      <label className="label-field">
        <span className="text-[14px] font-medium leading-snug text-neutral-900" lang="si">
          {labelSi}
        </span>
      </label>
      <div
        className={
          accent === "orange" ? "[&_.input-field]:input-field-orange" : ""
        }
      >
        {children}
      </div>
    </div>
  );
}
