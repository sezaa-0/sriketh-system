import Image from "next/image";

/**
 * Sri Keth brand mark — horizontal (navbar) or stacked (login).
 * @param {Object} props
 * @param {'horizontal' | 'stacked'} [props.variant]
 * @param {'sm' | 'md' | 'lg'} [props.size]
 * @param {string} [props.className]
 */
export function BrandLogo({
  variant = "horizontal",
  size = "sm",
  className = "",
}) {
  if (variant === "stacked") {
    return <StackedBrand size={size} className={className} />;
  }

  return <HorizontalBrand className={className} />;
}

/** @param {{ className?: string }} props */
function HorizontalBrand({ className }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <div className="relative h-7 w-7 shrink-0 sm:h-8 sm:w-8">
        <Image
          src="/sriketh-logo.png"
          alt="Sri Keth"
          width={32}
          height={32}
          className="h-full w-full object-contain"
          priority
        />
      </div>
      <p className="truncate whitespace-nowrap text-[13px] font-bold leading-none tracking-tight text-neutral-900 sm:text-sm">
        <span className="font-semibold text-neutral-900">Sri Keth</span>
        <span className="mx-1.5 font-normal text-neutral-300" aria-hidden="true">
          |
        </span>
        <span className="font-semibold text-neutral-500">Business ERP</span>
      </p>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} props.size
 * @param {string} props.className
 */
function StackedBrand({ size, className }) {
  const config = {
    sm: { img: 40, imgClass: "h-10 w-10", title: "text-[15px]", subtitle: "text-[13px]" },
    md: { img: 48, imgClass: "h-12 w-12", title: "text-base", subtitle: "text-[14px]" },
    lg: { img: 56, imgClass: "h-14 w-14", title: "text-lg", subtitle: "text-[15px]" },
  };
  const s = config[size];

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className={`relative shrink-0 ${s.imgClass}`}>
        <Image
          src="/sriketh-logo.png"
          alt="Sri Keth"
          width={s.img}
          height={s.img}
          className="h-full w-full object-contain"
          priority
        />
      </div>
      <div className="mt-3 flex flex-col items-center leading-tight">
        <span className={`font-bold tracking-tight text-neutral-900 ${s.title}`}>Sri Keth</span>
        <span className={`mt-0.5 font-medium text-neutral-400 ${s.subtitle}`}>
          Sri Keth ERP
        </span>
      </div>
    </div>
  );
}
