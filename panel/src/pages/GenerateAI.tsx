import { useState } from 'react';
import { Loader2, Sparkles, Upload } from 'lucide-react';
import { useGetTestSeriesQuery } from '../services/testSeriesApi';
import { useAutoGenerateMcqFromPdfMutation } from '../services/aiGenerateApi';

export function GenerateAI() {
  const { data: seriesList, isLoading: seriesLoading } = useGetTestSeriesQuery({ limit: 200, mode: 'summary' });
  const [autoGenerateMcqFromPdf, { isLoading }] = useAutoGenerateMcqFromPdfMutation();

  const [seriesId, setSeriesId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ testsInserted?: number; questionsInserted?: number } | null>(null);

  const handleSubmit = async () => {
    if (!seriesId) {
      setError('Please select a test series.');
      return;
    }
    if (!file) {
      setError('Please upload a PDF, JPG, JPEG, PNG, or WEBP file.');
      return;
    }

    setError(null);
    setMessage(null);
    setResult(null);

    try {
      const response = await autoGenerateMcqFromPdf({ seriesId, file }).unwrap();
      setMessage(response?.message || 'MCQ generation completed');
      setResult({
        testsInserted: response?.data?.testsInserted,
        questionsInserted: response?.data?.questionsInserted,
      });
    } catch (err: any) {
      setError(err?.data?.message || err?.error || err?.message || 'Failed to generate MCQs');
    }
  };

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">PDF to MCQ Generator</h1>
        <p className="mt-2 text-sm text-zinc-400">
          PDF upload server par save hoga, har page OCR hoga, Gemini se MCQ JSON banega, aur selected test series me insert ho jayega.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
        <div className="border-b border-zinc-800 bg-zinc-950/60 p-5">
          <div className="text-sm font-bold text-zinc-100">Choose Series and Upload PDF</div>
          <div className="mt-1 text-xs text-zinc-500">Aapko pehle target test series select karni hogi.</div>
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Target Test Series</label>
            <select
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-100 outline-none transition-colors focus:border-indigo-500"
              disabled={seriesLoading}
            >
              <option value="">{seriesLoading ? 'Loading series...' : 'Select a test series'}</option>
              {seriesList?.data?.map((series: any) => (
                <option key={series._id} value={series._id}>
                  {series.title} ({series.totalTests || 0} tests)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">File Upload</label>
            <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-6 text-center transition-colors hover:border-indigo-500/60 hover:bg-zinc-900/60">
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Upload className="mb-3 h-9 w-9 text-zinc-500" />
              {file ? (
                <div>
                  <div className="text-sm font-semibold text-zinc-100">{file.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">{Math.round(file.size / 1024)} KB</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-semibold text-zinc-200">Click to upload PDF or image</div>
                  <div className="mt-1 text-xs text-zinc-500">PDF, JPG, JPEG, PNG, WEBP supported</div>
                </div>
              )}
            </label>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-xs text-zinc-400">
            <div className="font-semibold text-zinc-200">Flow</div>
            <ol className="mt-2 space-y-1">
              <li>1. File `uploads/` folder me save hogi.</li>
              <li>2. PDF ho to page images me convert hoga, image ho to direct OCR chalega.</li>
              <li>3. OCR text Gemini ko jayega aur MCQ JSON aayega.</li>
              <li>4. Questions selected test series me insert ho jayenge.</li>
            </ol>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-4">
            <div className="min-h-10 text-sm">
              {message && <div className="text-emerald-400">{message}</div>}
              {error && <div className="text-red-400">{error}</div>}
              {result && (
                <div className="text-zinc-400">
                  Inserted {result.testsInserted || 0} test(s) and {result.questionsInserted || 0} question(s)
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading || !seriesId || !file}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-900/20 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate MCQs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
