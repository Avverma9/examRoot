import React, { useEffect, useMemo, useState } from 'react';
import { User, Layers } from 'lucide-react';
import { Screen } from '../types';

interface TestSeriesScreenProps {
  onNavigate: (s: Screen) => void;
}

const normalizeApiUrl = (value?: string) => {
  const raw = String(value || '').trim().replace(/\/$/, '');
  if (!raw) return 'https://backend.examroot.cc/api';
  return raw.endsWith('/api') ? raw : `${raw}/api`;
};

const API_BASE_URL = normalizeApiUrl((import.meta as any)?.env?.VITE_API_BASE_URL);

export function TestSeriesScreen({ onNavigate }: TestSeriesScreenProps) {
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [selectedSeries, setSelectedSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSeries = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/test-series?includeDrafts=true&page=1&limit=20`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load test series');
        const items = Array.isArray(data?.data) ? data.data : [];
        if (cancelled) return;
        setSeriesList(items);
        if (items.length > 0) setSelectedSeriesId(String(items[0]._id));
      } catch (error) {
        if (!cancelled) setSeriesList([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSeries();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selectedSeriesId) {
      setSelectedSeries(null);
      return;
    }

    const loadSeriesDetails = async () => {
      try {
        setDetailsLoading(true);
        const res = await fetch(`${API_BASE_URL}/test-series/${selectedSeriesId}?includeQuestions=false`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load tests');
        if (!cancelled) setSelectedSeries(data?.data || null);
      } catch {
        if (!cancelled) setSelectedSeries(null);
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    };

    loadSeriesDetails();
    return () => {
      cancelled = true;
    };
  }, [selectedSeriesId]);

  const tests = useMemo(() => {
    const list = Array.isArray(selectedSeries?.tests) ? selectedSeries.tests : [];
    return [...list].sort((a: any, b: any) => (a?.order || 0) - (b?.order || 0));
  }, [selectedSeries]);

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="bg-indigo-600 text-white p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold">Test Series</h1>
        <button onClick={() => onNavigate('profile')} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30">
          <User size={20} className="text-white" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-r from-indigo-600 to-orange-500 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase mb-2 inline-block">
              {selectedSeries?.isPaid ? 'Premium' : 'Free'}
            </span>
            <h2 className="text-xl font-bold mb-1">{selectedSeries?.title || 'Test Series'}</h2>
            <p className="text-white/80 text-sm mb-4">
              {(selectedSeries?.totalTests || tests.length || 0)} Tests
            </p>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">
                {selectedSeries?.isPaid ? `₹${selectedSeries?.discountedPrice || selectedSeries?.price || 0}` : 'FREE'}
              </span>
            </div>
          </div>
          <Layers size={100} className="absolute -right-4 -bottom-4 text-white/10" />
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-sm text-slate-500">
            Loading test series...
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Series</label>
            <select
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 outline-none"
            >
              {seriesList.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-3">Tests List</h3>
          {detailsLoading ? (
            <p className="text-sm text-slate-500">Loading tests...</p>
          ) : tests.length === 0 ? (
            <p className="text-sm text-slate-500">No tests found in this series.</p>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {tests.map((test: any, index: number) => (
                <div key={String(test?._id || index)} className="border border-slate-100 rounded-xl p-3 bg-slate-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">{index + 1}. {test?.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{test?.group || 'Ungrouped'} • {test?.duration || 0} min • {test?.totalQuestions || 0} Qs</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${test?.isFree ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {test?.isFree ? 'FREE' : 'LOCKED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
