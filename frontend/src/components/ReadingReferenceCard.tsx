import React from "react";

const ReadingReferenceCard: React.FC = () => {
  return (
    <section className="w-full max-w-md">
      <div className="rounded-2xl overflow-hidden border border-emerald-500/25 bg-neutral-950/70 backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(55,255,0,0.45)]">
        <div className="w-full aspect-video relative bg-gradient-to-br from-neutral-800 via-neutral-900 to-black">
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360' fill='none'><rect width='640' height='360' fill='#0a0a0a'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='32' fill='#37FF00'>Sample Image</text></svg>`)} `}
            alt="Sample water quality visual"
            className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </div>
        <div className="p-6 flex flex-col gap-4">
          <h3 className="text-lg font-semibold tracking-wide text-emerald-300">Example Reading Card</h3>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-neutral-400">Description</p>
            <p className="text-sm leading-relaxed text-neutral-300">This card can display a snapshot or reference for water quality readings. Replace the placeholder image with a real sensor photo or diagram. Typical good ranges: pH 6.5–8.5, TDS &lt; 300 ppm, Turbidity &lt; 5 NTU, stable temperature, low gas anomalies.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReadingReferenceCard;
