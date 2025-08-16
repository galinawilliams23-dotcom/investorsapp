import React, { useEffect, useMemo, useState } from "react";

const numberOr = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const percentToDecimal = (p) => {
  const n = Number(p);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
};

const currency = (v) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
    Number.isFinite(v) ? v : 0
  );

const loadLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
};

const defaultRow = {
  ticker: "DAL",
  eps: 6.9,
  growthPct: 10,
  aaaCurrentYield: 4.8,
  price: 56.65,
  mosTargetPct: 35,
};

export default function App() {
  const [row, setRow] = useState(defaultRow);
  const [watchlist, setWatchlist] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);

  useEffect(() => {
    setWatchlist(loadLocal("investor_watchlist", []));
  }, []);

  useEffect(() => {
    saveLocal("investor_watchlist", watchlist);
  }, [watchlist]);

  const intrinsicValue = useMemo(() => {
    const eps = numberOr(row.eps, 0);
    const g = percentToDecimal(row.growthPct);
    const Y = numberOr(row.aaaCurrentYield, 4.8);
    const base = eps * (8.5 + 2 * (g * 100));
    const value = base * (4.4 / Y);
    return value;
  }, [row]);

  const mosTarget = useMemo(() => percentToDecimal(row.mosTargetPct), [row.mosTargetPct]);
  const acceptableBuyPrice = useMemo(() => intrinsicValue * (1 - mosTarget), [intrinsicValue, mosTarget]);

  const diffPct = useMemo(() => {
    const p = numberOr(row.price, 0);
    if (p <= 0) return 0;
    return ((intrinsicValue - p) / p) * 100;
  }, [intrinsicValue, row.price]);

  const action = useMemo(() => {
    const p = numberOr(row.price, 0);
    if (!p) return "—";
    if (p <= acceptableBuyPrice) return "BUY (meets MOS)";
    if (p < intrinsicValue) return "WATCH (below IV, not MOS)";
    return "HOLD / AVOID";
  }, [acceptableBuyPrice, intrinsicValue, row.price]);

  const setField = (k) => (e) => setRow((r) => ({ ...r, [k]: e.target.value }));

  const addToWatchlist = () => {
    const item = {
      ...row,
      intrinsicValue: Number(intrinsicValue.toFixed(2)),
      acceptableBuyPrice: Number(acceptableBuyPrice.toFixed(2)),
      diffPct: Number(diffPct.toFixed(2)),
      action,
      ts: Date.now(),
    };
    if (editingIndex >= 0) {
      const next = [...watchlist];
      next[editingIndex] = item;
      setWatchlist(next);
      setEditingIndex(-1);
    } else {
      setWatchlist((w) => [item, ...w]);
    }
  };

  const editItem = (idx) => {
    const it = watchlist[idx];
    if (!it) return;
    setRow({
      ticker: it.ticker,
      eps: it.eps,
      growthPct: it.growthPct,
      aaaCurrentYield: it.aaaCurrentYield,
      price: it.price,
      mosTargetPct: it.mosTargetPct,
    });
    setEditingIndex(idx);
  };

  const deleteItem = (idx) => {
    const next = watchlist.filter((_, i) => i !== idx);
    setWatchlist(next);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Investor’s App – MVP</h1>
          <div className="text-sm opacity-80">Graham IV • Watchlist</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid gap-6">
        <section className="grid gap-4 bg-white rounded-2xl shadow p-4 md:p-6">
          <h2 className="text-xl font-semibold">Graham Intrinsic Value Calculator</h2>
          <p className="text-sm text-gray-600">Adjust inputs to compute intrinsic value, margin of safety, and suggested buy price.</p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Ticker</label>
              <input className="border rounded-xl px-3 py-2" value={row.ticker} onChange={setField("ticker")} placeholder="AAPL" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">EPS (TTM)</label>
              <input type="number" step="0.01" className="border rounded-xl px-3 py-2" value={row.eps} onChange={setField("eps")} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Growth Rate g (%)</label>
              <input type="number" step="0.1" className="border rounded-xl px-3 py-2" value={row.growthPct} onChange={setField("growthPct")} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Current AAA Bond Yield Y (%)</label>
              <input type="number" step="0.01" className="border rounded-xl px-3 py-2" value={row.aaaCurrentYield} onChange={setField("aaaCurrentYield")} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Current Stock Price ($)</label>
              <input type="number" step="0.01" className="border rounded-xl px-3 py-2" value={row.price} onChange={setField("price")} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Margin of Safety Target (%)</label>
              <input type="number" step="1" className="border rounded-xl px-3 py-2" value={row.mosTargetPct} onChange={setField("mosTargetPct")} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Intrinsic Value</div>
              <div className="text-2xl font-semibold">{currency(intrinsicValue)}</div>
              <div className="text-xs text-gray-500 mt-1">Formula: EPS × (8.5 + 2g) × (4.4 / Y)</div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Acceptable Buy Price</div>
              <div className="text-2xl font-semibold">{currency(acceptableBuyPrice)}</div>
              <div className="text-xs text-gray-500 mt-1">MOS target: {row.mosTargetPct}%</div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Upside vs Price</div>
              <div className={`text-2xl font-semibold ${diffPct >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {diffPct.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Action: {action}</div>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90"
              onClick={addToWatchlist}
            >
              {editingIndex >= 0 ? "Update Watch Item" : "Save to Watchlist"}
            </button>
            {editingIndex >= 0 && (
              <button
                className="px-4 py-2 rounded-xl border"
                onClick={() => setEditingIndex(-1)}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </section>

        <section className="grid gap-3 bg-white rounded-2xl shadow p-4 md:p-6">
          <h2 className="text-xl font-semibold">Watchlist</h2>
          {watchlist.length === 0 ? (
            <p className="text-sm text-gray-600">No items saved yet. Add a calculation above and save it here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Ticker</th>
                    <th className="py-2 pr-4">EPS</th>
                    <th className="py-2 pr-4">g %</th>
                    <th className="py-2 pr-4">AAA Y %</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2 pr-4">IV</th>
                    <th className="py-2 pr-4">Buy @</th>
                    <th className="py-2 pr-4">Upside</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">—</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map((it, idx) => (
                    <tr key={it.ts} className="border-b hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium">{it.ticker}</td>
                      <td className="py-2 pr-4">{it.eps}</td>
                      <td className="py-2 pr-4">{it.growthPct}</td>
                      <td className="py-2 pr-4">{it.aaaCurrentYield}</td>
                      <td className="py-2 pr-4">{currency(it.price)}</td>
                      <td className="py-2 pr-4">{currency(it.intrinsicValue)}</td>
                      <td className="py-2 pr-4">{currency(it.acceptableBuyPrice)}</td>
                      <td className={`py-2 pr-4 ${it.diffPct >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{it.diffPct}%</td>
                      <td className="py-2 pr-4">{it.action}</td>
                      <td className="py-2 pr-4 flex gap-2">
                        <button className="px-2 py-1 rounded border" onClick={() => editItem(idx)}>Edit</button>
                        <button className="px-2 py-1 rounded border" onClick={() => deleteItem(idx)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="grid gap-2 text-xs text-gray-600 p-2">
          <div>
            <strong>Next up:</strong> hook EPS & price to a live data API (e.g., Polygon/Alpha Vantage), add news sentiment & short-term predictive signal, and persist watchlist to a backend.
          </div>
          <div>
            <strong>Disclaimer:</strong> This calculator is for educational purposes. Not financial advice.
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-6 text-xs text-gray-500">
        Built for rapid iteration. © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
