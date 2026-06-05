"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { BilingualText } from "./BilingualText";

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.titleSi
 * @param {string} props.titleEn
 * @param {string} [props.subtitleSi]
 * @param {string} [props.subtitleEn]
 * @param {React.ReactNode} props.children
 */
export function Modal({
  isOpen,
  onClose,
  titleSi,
  titleEn,
  subtitleSi,
  subtitleEn,
  children,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-card-hover sm:max-h-[85vh] sm:max-w-lg sm:rounded-3xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex shrink-0 items-start justify-between border-b border-neutral-100 px-5 py-5 sm:px-6">
              <div id="modal-title">
                <BilingualText si={titleSi} en={titleEn} variant="heading" />
                {subtitleSi && subtitleEn ? (
                  <p className="mt-2">
                    <span
                      className="block text-[14px] font-medium text-neutral-700"
                      lang="si"
                    >
                      {subtitleSi}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-neutral-400" lang="en">
                      {subtitleEn}
                    </span>
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-neutral-500 transition-colors hover:bg-neutral-200"
                aria-label="Close"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain bg-white px-5 py-5 sm:px-6">
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
