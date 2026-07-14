import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetTestSeriesQuery, useCreateTestSeriesMutation } from '../services/testSeriesApi';
import { FileDown, X, Loader2 } from 'lucide-react';

export function TestSeries() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useGetTestSeriesQuery({ page, limit: 20, mode: 'summary' });
  const [createSeries, { isLoading: isCreating }] = useCreateTestSeriesMutation();

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkSeriesJson, setBulkSeriesJson] = useState('');

  const [generateModalOpen, setGenerateModalOpen] = useState<'mock' | 'practice' | null>(null);
  const [generateSeriesId, setGenerateSeriesId] = useState<string | null>(null);
  const [generateForm, setGenerateForm] = useState({
    title: '',
    description: '',
    maxQuestions: 50,
    duration: 60,
    shuffle: true
  });

  const handleBulkImport = async () => {
    try {
      const parsed = JSON.parse(bulkSeriesJson);
      if (!Array.isArray(parsed)) {
        alert('JSON must be an array of series objects');
        return;
      }
      for (const series of parsed) {
        await createSeries(series).unwrap();
      }
      alert('Bulk import successful');
      setIsBulkImportOpen(false);
      setBulkSeriesJson('');
      refetch();
    } catch (e) {
      console.error(e);
      alert('Failed to import JSON');
    }
  };

  const handleGenerate = () => {
    // Generate api call will go here
    alert(`Generated ${generateModalOpen} for series ${generateSeriesId} with ${generateForm.maxQuestions} questions.`);
    setGenerateModalOpen(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Test Series</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsBulkImportOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 py-2 px-4 rounded-lg text-xs font-bold transition-colors text-zinc-300 flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" /> Bulk Import
          </button>
          <Link 
            to="/test-series/new"
            className="bg-indigo-600 hover:bg-indigo-500 py-2 px-4 rounded-lg text-xs font-bold transition-colors text-white"
          >
            Create Series
          </Link>
        </div>
      </div>
      {isLoading ? (
        <p className="text-zinc-400">Loading test series...</p>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-6 flex flex-col">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="text-zinc-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="pb-4 font-semibold border-b border-zinc-800">Title</th>
                <th className="pb-4 font-semibold border-b border-zinc-800">Category</th>
                <th className="pb-4 font-semibold border-b border-zinc-800 text-right">Price</th>
                <th className="pb-4 font-semibold border-b border-zinc-800 text-center">Tests</th>
                <th className="pb-4 font-semibold border-b border-zinc-800 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {data?.data?.map((series: any) => (
                <tr key={series._id} className="hover:bg-zinc-800/30">
                  <td className="py-4 border-b border-zinc-800/50 font-medium text-zinc-100">{series.title}</td>
                  <td className="py-4 border-b border-zinc-800/50 text-zinc-400">{series.category}</td>
                  <td className="py-4 border-b border-zinc-800/50 text-right font-mono text-zinc-400">
                    {series.isPaid ? `₹${series.discountedPrice || series.price}` : 'Free'}
                  </td>
                  <td className="py-4 border-b border-zinc-800/50 text-center text-zinc-400">{series.totalTests || 0}</td>
                  <td className="py-4 border-b border-zinc-800/50 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setGenerateSeriesId(series._id);
                        setGenerateModalOpen('mock');
                      }}
                      className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-2 py-1 rounded uppercase tracking-widest"
                      title="Generate Mock Test"
                    >
                      M
                    </button>
                    <button
                      onClick={() => {
                        setGenerateSeriesId(series._id);
                        setGenerateModalOpen('practice');
                      }}
                      className="text-[10px] font-bold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-2 py-1 rounded uppercase tracking-widest"
                      title="Generate Practice Set"
                    >
                      P
                    </button>
                    <Link
                      to={`/test-series/${series._id}`}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 ml-2 uppercase tracking-widest"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500 border-b border-zinc-800/50">No test series found</td>
                </tr>
              )}
            </tbody>
          </table>
          
          {data?.pages > 1 && (
            <div className="pt-4 mt-2 flex items-center justify-between border-t border-zinc-800/50">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 bg-zinc-800/50 border border-zinc-700/50 rounded-md disabled:opacity-50 hover:bg-zinc-800 transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-zinc-500 font-medium">Page {page} of {data.pages}</span>
              <button 
                disabled={page >= data.pages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 bg-zinc-800/50 border border-zinc-700/50 rounded-md disabled:opacity-50 hover:bg-zinc-800 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-100">Bulk Import Test Series</h2>
              <button onClick={() => setIsBulkImportOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs text-zinc-400 mb-4">Paste JSON array of test series here.</p>
              <textarea
                value={bulkSeriesJson}
                onChange={e => setBulkSeriesJson(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100 h-64 font-mono mb-4"
                placeholder='[\n  {\n    "title": "Lucent GK Test Series",\n    "tests": []\n  }\n]'
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsBulkImportOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={isCreating}
                  className="bg-indigo-600 hover:bg-indigo-500 py-2 px-6 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 text-white flex items-center gap-2"
                >
                  {isCreating && <Loader2 className="w-3 h-3 animate-spin" />}
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">
                Generate {generateModalOpen === 'mock' ? 'Mock Test' : 'Practice Set'}
              </h2>
              <button onClick={() => setGenerateModalOpen(null)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Title (Optional)</label>
                <input
                  type="text"
                  value={generateForm.title}
                  onChange={e => setGenerateForm({ ...generateForm, title: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                  placeholder="Leave empty for auto-generated title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Max Questions</label>
                  <input
                    type="number"
                    value={generateForm.maxQuestions}
                    onChange={e => setGenerateForm({ ...generateForm, maxQuestions: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Duration (mins)</label>
                  <input
                    type="number"
                    value={generateForm.duration}
                    onChange={e => setGenerateForm({ ...generateForm, duration: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={generateForm.shuffle}
                  onChange={e => setGenerateForm({ ...generateForm, shuffle: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-zinc-100">Shuffle Questions</div>
                  <div className="text-[10px] text-zinc-500">Randomize question order</div>
                </div>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/50">
                <button
                  onClick={() => setGenerateModalOpen(null)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  className="bg-indigo-600 hover:bg-indigo-500 py-2 px-6 rounded-lg text-xs font-bold transition-colors text-white"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
