import { useState, useRef } from 'react';
import { Loader2, Sparkles, Upload } from 'lucide-react';
import { cn } from '../utils/cn';
import { useCreateTestSeriesMutation, useGetTestSeriesQuery, useAddSeriesTestsMutation } from '../services/testSeriesApi';
import { useNavigate } from 'react-router-dom';

export function GenerateAI() {
  const [model, setModel] = useState('gemini-3.5-flash');
  const [mode, setMode] = useState<'text' | 'file'>('file');
  const [targetType, setTargetType] = useState<'new' | 'existing'>('new');
  const [targetSeriesId, setTargetSeriesId] = useState<string>('');

  const [sourceText, setSourceText] = useState('');
  const [prompt, setPrompt] = useState('Extract exactly 80 unique MCQs and return as a JSON array of tests.');
  const [systemInstruction, setSystemInstruction] = useState('You are an expert bilingual exam question generator. Generate EXACTLY 80 unique MCQs from the provided source. Output MUST be an array containing a single test object following this structure: [{ "group": "<Subject Name>", "title": "<Subject> Page <Page Number>", "description": "Generate exactly 80 unique MCQs from the given page.", "duration": 60, "isFree": true, "isPublished": true, "questions": [ { "question": "English Question", "questionHi": "Hindi Question", "options": ["Option 1", "Option 2", "Option 3", "Option 4"], "optionsHi": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"], "correctAnswer": "Must exactly match one value from options", "correctAnswerHi": "Must exactly match one value from optionsHi", "explanation": "Short explanation in English.", "explanationHi": "Short explanation in Hindi." } ] }]');
  const [file, setFile] = useState<File | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: seriesList } = useGetTestSeriesQuery({ limit: 100 });
  const [createSeries] = useCreateTestSeriesMutation();
  const [addSeriesTests] = useAddSeriesTestsMutation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (mode === 'text' && !sourceText) return;
    if (mode === 'file' && !file) return;
    if (targetType === 'existing' && !targetSeriesId) {
       setError('Please select a Test Series to add tests to.');
       return;
    }
    
    setIsGenerating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('model', model);
      formData.append('systemInstruction', systemInstruction);
      formData.append('prompt', prompt);
      
      if (mode === 'text') {
        formData.append('sourceText', sourceText);
      } else if (file) {
        formData.append('file', file);
      }

      const res = await fetch('/api/local-generate', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate');
      }

      const generatedTests = data.data;
      if (!Array.isArray(generatedTests) || generatedTests.length === 0) {
         throw new Error('Generated output is not a valid tests array');
      }

      const formattedTests = generatedTests.map((t: any) => ({
        title: t.title || 'Generated Test ' + new Date().toLocaleTimeString(),
        group: t.group || 'General',
        duration: t.duration || t.questions?.length * 1 || 60,
        isFree: typeof t.isFree === 'boolean' ? t.isFree : false,
        totalQuestions: t.questions?.length || 0,
        questions: t.questions || []
      }));

      if (targetType === 'new') {
        const newSeries = {
          title: `AI Generated Test Series - ${new Date().toLocaleString()}`,
          category: 'AI Generated',
          isPaid: false,
          tests: formattedTests
        };
        const created = await createSeries(newSeries).unwrap();
        setSuccessMsg(`Successfully generated and saved! Redirecting to editor...`);
        setTimeout(() => {
           navigate(`/test-series/${created.data?._id || created._id}`);
        }, 2000);
      } else {
        // Safe append: only inserts the newly generated tests/questions via
        // the dedicated bulk-add endpoint. This never fetches, reassembles,
        // or rewrites the existing series' tests, so existing tests and
        // questions can never be lost or overwritten.
        await addSeriesTests({ seriesId: targetSeriesId, tests: formattedTests }).unwrap();

        setSuccessMsg(`Successfully added to selected Test Series! Redirecting...`);
        setTimeout(() => {
           navigate(`/test-series/${targetSeriesId}`);
        }, 2000);
      }

    } catch (err: any) {
      console.error("Generation failed", err);
      setError(err.message || 'An error occurred during generation');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-6">AI Automated Generation</h1>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col shadow-xl">
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 rounded-t-xl">
          <h3 className="text-sm font-bold text-zinc-100">AI Source Parser</h3>
          <p className="text-[10px] text-zinc-500 mt-1">Upload study material and extract structured tests seamlessly.</p>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6 border-r border-zinc-800 pr-6">
            <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">1. Settings</h4>
            
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Gemini Model</label>
              <select 
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
              >
                <option value="gemini-3.5-flash">Gemini 1.5 Flash (Fast)</option>
                <option value="gemini-3.1-pro-preview">Gemini 1.5 Pro (Complex Reasoning)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Target Test Series</label>
              <select 
                value={targetType === 'new' ? 'new' : targetSeriesId}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'new') {
                    setTargetType('new');
                    setTargetSeriesId('');
                  } else {
                    setTargetType('existing');
                    setTargetSeriesId(val);
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
              >
                <option value="new">+ Create New Test Series</option>
                {seriesList?.data?.map((series: any) => (
                  <option key={series._id} value={series._id}>
                    {series.title} ({series.tests?.length || 0} tests)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">System Instructions (Rules)</label>
              <textarea
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100 placeholder-zinc-600 resize-none"
                placeholder="Rules for the AI..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">User Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100 placeholder-zinc-600 h-24 resize-none"
                placeholder="Additional instructions..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">2. Source Content</h4>
            
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Input Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('file')}
                  className={cn(
                    "flex-1 py-2 text-[10px] rounded-md font-bold uppercase transition-colors",
                    mode === 'file' 
                      ? "bg-indigo-600 text-white" 
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
                  )}
                >
                  File Upload
                </button>
                <button
                  onClick={() => setMode('text')}
                  className={cn(
                    "flex-1 py-2 text-[10px] rounded-md font-bold uppercase transition-colors",
                    mode === 'text' 
                      ? "bg-indigo-600 text-white" 
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
                  )}
                >
                  Text Source
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                {mode === 'text' ? 'Source Text' : 'Upload PDF/Image'}
              </label>
              {mode === 'text' ? (
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Paste the study material here..."
                  className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100 placeholder-zinc-600 resize-none"
                />
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 bg-zinc-950 border border-zinc-800 border-dashed rounded-lg p-3 flex flex-col items-center justify-center text-xs text-zinc-400 cursor-pointer hover:bg-zinc-900 transition-colors hover:border-indigo-500/50"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="w-8 h-8 mb-3 text-zinc-600" />
                  {file ? (
                    <span className="text-indigo-400 font-medium">{file.name}</span>
                  ) : (
                    <div className="text-center">
                      <p>Click to upload PDF or Image</p>
                      <p className="text-[10px] text-zinc-600 mt-1">Supports common image formats and PDF</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || (mode === 'text' ? !sourceText : !file)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-900/20"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate & Save
              </button>
              
              {error && (
                <div className="mt-3 p-3 bg-red-950/30 rounded-lg border border-red-900/50 text-[10px] text-red-400">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mt-3 p-3 bg-emerald-950/30 rounded-lg border border-emerald-900/50 text-[10px] text-emerald-400 font-bold">
                  {successMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
