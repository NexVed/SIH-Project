import LightRays from "./components/LightRays";
import ReadingReferenceCard from "./components/ReadingReferenceCard";
import "./index.css";
import { useState, type FormEvent } from "react";
import { identifyDravya } from "./lib/api";
import axios from "axios";

interface IdentifyResult {
  dravya: string;
  description: string;
  image_base64?: string | null;
}

function App() {
  // Form state
  const [ph, setPh] = useState("");
  const [tds, setTds] = useState("");
  const [turbidity, setTurbidity] = useState("");
  const [gas, setGas] = useState("");
  const [colorIndex, setColorIndex] = useState("");
  const [temperature, setTemperature] = useState("");

  // Result & UI state
  const [identifyResult, setIdentifyResult] = useState<IdentifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIdentifyResult(null);
    try {
      const payload = {
        pH: parseFloat(ph),
        TDS: parseFloat(tds),
        Turbidity: parseFloat(turbidity),
        Gas: parseFloat(gas),
        ColorIndex: parseFloat(colorIndex),
        Temp: parseFloat(temperature)
      };
      if (Object.values(payload).some(v => isNaN(v))) {
        throw new Error("Please provide valid numeric values for all fields.");
      }
      const data = await identifyDravya(payload as any);
      setIdentifyResult(data as any);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(`Server error (${err.response.status}): ${err.response.data?.detail || 'Failed to identify dravya'}`);
        } else if (err.request) {
          setError("Network error: backend unreachable. Check that the FastAPI server is running.");
        } else {
          setError(err.message);
        }
      } else {
        setError(err.message || "Failed to identify dravya");
      }
    } finally {
      setLoading(false);
    }
  };

  // (Removed unused search state/handler)

  return (
    <div className="w-full h-dvh relative overflow-hidden font-sans text-neutral-100">
      {/* Background layer */}
      <div className="absolute inset-0 bg-black">
        <LightRays
          raysOrigin="top-center"
          raysColor="#37FF00"
            raysSpeed={1.5}
            lightSpread={0.8}
            rayLength={1.2}
            followMouse={true}
            mouseInfluence={0.1}
            noiseAmount={0.1}
            distortion={0.05}
            className="custom-rays"
        />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 w-full h-full flex flex-row">
        {/* Left Sidebar Brand (fixed width) */}
        <aside className="hidden md:flex flex-col items-center w-60 border-r border-emerald-500/15 bg-neutral-950/30 backdrop-blur-xl py-10 px-4 shrink-0 relative">
          <div className="flex flex-col items-center gap-5 sticky top-8">
            <img src="/Logo.png" alt="Dravya Labs Logo" className="w-24 h-24 object-contain drop-shadow-[0_0_28px_rgba(55,255,0,0.5)]" />
            <h1 className="text-[1.75rem] font-black tracking-tight text-center leading-snug bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-300 text-transparent bg-clip-text drop-shadow-[0_0_12px_rgba(55,255,0,0.35)]">
              Dravya Labs
            </h1>
            <div className="w-full flex flex-col items-center gap-3">
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
              <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 text-center leading-relaxed">
                Intelligent<br />Identification
              </p>
            </div>
          </div>
          {/* Future nav placeholder */}
          <div className="mt-auto pt-10 text-[10px] text-neutral-600 tracking-wider">
            v0.1
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-6 md:px-8 pb-24 pt-24">
          <div className="flex flex-col lg:flex-row lg:items-start gap-14">
            <form onSubmit={handleSubmit} className="flex flex-col gap-10 w-full max-w-6xl mx-auto lg:flex-[1.1] items-center text-center">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[1fr] justify-center">
              {/* pH */}
              <fieldset className="group rounded-2xl bg-neutral-950/60 border border-emerald-500/20 hover:border-emerald-400/50 transition-colors backdrop-blur-xl p-5 flex flex-col gap-4 shadow-[0_0_30px_-8px_rgba(55,255,0,0.35)] h-full">
                <legend className="sr-only">pH</legend>
                <div>
                  <h2 className="text-lg font-semibold tracking-wide text-emerald-300">pH</h2>
                  <p className="text-xs mt-1 text-neutral-400">Enter pH value</p>
                </div>
                <label className="text-xs tracking-wide font-medium" htmlFor="ph-value">Value</label>
                <input id="ph-value" name="ph" type="number" step="0.01" placeholder="e.g. 7.2" className="rounded-lg bg-neutral-900/70 border border-neutral-700 focus:border-emerald-400 outline-none px-3 py-2 text-sm placeholder:text-neutral-500" value={ph} onChange={e=>setPh(e.target.value)} />
              </fieldset>

              {/* TDS */}
              <fieldset className="group rounded-2xl bg-neutral-950/60 border border-emerald-500/20 hover:border-emerald-400/50 transition-colors backdrop-blur-xl p-5 flex flex-col gap-4 shadow-[0_0_30px_-8px_rgba(55,255,0,0.35)] h-full">
                <legend className="sr-only">TDS</legend>
                <div>
                  <h2 className="text-lg font-semibold tracking-wide text-emerald-300">TDS</h2>
                  <p className="text-xs mt-1 text-neutral-400">Total Dissolved Solids (ppm)</p>
                </div>
                <label className="text-xs tracking-wide font-medium" htmlFor="tds-value">Value</label>
                <input id="tds-value" name="tds" type="number" step="1" placeholder="e.g. 220" className="rounded-lg bg-neutral-900/70 border border-neutral-700 focus:border-emerald-400 outline-none px-3 py-2 text-sm placeholder:text-neutral-500" value={tds} onChange={e=>setTds(e.target.value)} />
              </fieldset>

              {/* Turbidity */}
              <fieldset className="group rounded-2xl bg-neutral-950/60 border border-emerald-500/20 hover:border-emerald-400/50 transition-colors backdrop-blur-xl p-5 flex flex-col gap-4 shadow-[0_0_30px_-8px_rgba(55,255,0,0.35)] h-full">
                <legend className="sr-only">Turbidity</legend>
                <div>
                  <h2 className="text-lg font-semibold tracking-wide text-emerald-300">Turbidity</h2>
                  <p className="text-xs mt-1 text-neutral-400">Enter NTU</p>
                </div>
                <label className="text-xs tracking-wide font-medium" htmlFor="turbidity-value">Value</label>
                <input id="turbidity-value" name="turbidity" type="number" step="0.1" placeholder="e.g. 3.5" className="rounded-lg bg-neutral-900/70 border border-neutral-700 focus:border-emerald-400 outline-none px-3 py-2 text-sm placeholder:text-neutral-500" value={turbidity} onChange={e=>setTurbidity(e.target.value)} />
              </fieldset>

              {/* Gas */}
              <fieldset className="group rounded-2xl bg-neutral-950/60 border border-emerald-500/20 hover:border-emerald-400/50 transition-colors backdrop-blur-xl p-5 flex flex-col gap-4 shadow-[0_0_30px_-8px_rgba(55,255,0,0.35)] h-full">
                <legend className="sr-only">Gas</legend>
                <div>
                  <h2 className="text-lg font-semibold tracking-wide text-emerald-300">Gas</h2>
                  <p className="text-xs mt-1 text-neutral-400">Detected Gas Level (ppm)</p>
                </div>
                <label className="text-xs tracking-wide font-medium" htmlFor="gas-value">Value</label>
                <input id="gas-value" name="gas" type="number" step="1" placeholder="e.g. 15" className="rounded-lg bg-neutral-900/70 border border-neutral-700 focus:border-emerald-400 outline-none px-3 py-2 text-sm placeholder:text-neutral-500" value={gas} onChange={e=>setGas(e.target.value)} />
              </fieldset>

              {/* Color Index */}
              <fieldset className="group rounded-2xl bg-neutral-950/60 border border-emerald-500/20 hover:border-emerald-400/50 transition-colors backdrop-blur-xl p-5 flex flex-col gap-4 shadow-[0_0_30px_-8px_rgba(55,255,0,0.35)] h-full">
                <legend className="sr-only">Color Index</legend>
                <div>
                  <h2 className="text-lg font-semibold tracking-wide text-emerald-300">Color Index</h2>
                  <p className="text-xs mt-1 text-neutral-400">Visual scale value</p>
                </div>
                <label className="text-xs tracking-wide font-medium" htmlFor="colorindex-value">Value</label>
                <input id="colorindex-value" name="colorIndex" type="number" step="1" placeholder="e.g. 12" className="rounded-lg bg-neutral-900/70 border border-neutral-700 focus:border-emerald-400 outline-none px-3 py-2 text-sm placeholder:text-neutral-500" value={colorIndex} onChange={e=>setColorIndex(e.target.value)} />
              </fieldset>

              {/* Temperature */}
              <fieldset className="group rounded-2xl bg-neutral-950/60 border border-emerald-500/20 hover:border-emerald-400/50 transition-colors backdrop-blur-xl p-5 flex flex-col gap-4 shadow-[0_0_30px_-8px_rgba(55,255,0,0.35)] h-full">
                <legend className="sr-only">Temperature</legend>
                <div>
                  <h2 className="text-lg font-semibold tracking-wide text-emerald-300">Temperature</h2>
                  <p className="text-xs mt-1 text-neutral-400">Enter °C</p>
                </div>
                <label className="text-xs tracking-wide font-medium" htmlFor="temp-value">Value</label>
                <input id="temp-value" name="temperature" type="number" step="0.1" placeholder="e.g. 24.6" className="rounded-lg bg-neutral-900/70 border border-neutral-700 focus:border-emerald-400 outline-none px-3 py-2 text-sm placeholder:text-neutral-500" value={temperature} onChange={e=>setTemperature(e.target.value)} />
              </fieldset>
              </div>
              <div className="flex justify-center w-full">
                <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-neutral-900 font-semibold text-sm tracking-wide px-10 py-3 shadow-[0_0_25px_-5px_rgba(55,255,0,0.5)] transition-colors disabled:opacity-60">
                  {loading ? 'Processing...' : 'Submit Readings'}
                </button>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </form>

            {/* Output Card on Right */}
            <aside className="w-full max-w-md lg:flex-[0.55] lg:sticky lg:top-10 space-y-4">
              <h2 className="text-sm font-semibold tracking-wider text-emerald-400">Output</h2>
              {identifyResult ? (
                <div className="rounded-2xl overflow-hidden border border-emerald-500/25 bg-neutral-950/70 backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(55,255,0,0.45)]">
                  <div className="p-6 flex flex-col gap-4">
                    <h3 className="text-lg font-semibold tracking-wide text-emerald-300">{identifyResult.dravya}</h3>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider text-neutral-400">Description</p>
                      <p className="text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap">{identifyResult.description}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider text-neutral-400">Image</p>
                      {identifyResult.image_base64 ? (
                        <img
                          src={`data:image/png;base64,${identifyResult.image_base64}`}
                          alt={identifyResult.dravya}
                          className="w-full rounded-md border border-emerald-500/20"
                        />
                      ) : (
                        <p className="text-xs text-neutral-500 italic">No image available.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <ReadingReferenceCard />
              )}
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
