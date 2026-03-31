import Image from "next/image";

type BrandLogoProps = {
  compact?: boolean;
};

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="rounded-2xl bg-white/80 p-1 shadow-sm ring-1 ring-slate-200">
        <Image
          src="/activiqhq_icon_clipped.svg"
          alt="ActiviqHQ"
          width={compact ? 24 : 36}
          height={compact ? 24 : 36}
          priority
        />
      </div>
      <span className="text-xl font-semibold tracking-tight text-slate-800">
        ActiviqHQ
      </span>
    </div>
  );
}
