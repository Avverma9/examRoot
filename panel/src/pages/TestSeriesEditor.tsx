import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetTestSeriesByIdQuery, useGetTestSeriesMetaQuery, useUpdateTestSeriesMutation, useCreateTestSeriesMutation, useAddSeriesTestsMutation, usePatchTestMetaMutation, useUpdateTestQuestionsMutation, useDeleteTestMutation } from '../services/testSeriesApi';
import { Loader2, Plus, Trash2, ArrowLeft, X, Pencil, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { cn } from '../utils/cn';

const bulkTestExample = `[
  {
    "group": "<Subject Name>",
    "title": "<Subject> Page <Page Number>",
    "description": "Generate exactly 80 unique MCQs from the given page.",
    "duration": 60,
    "isFree": true,
    "isPublished": true,
    "questions": [
      {
        "question": "English Question",
        "questionHi": "Hindi Question",
        "options": [
          "Option 1",
          "Option 2",
          "Option 3",
          "Option 4"
        ],
        "optionsHi": [
          "विकल्प 1",
          "विकल्प 2",
          "विकल्प 3",
          "विकल्प 4"
        ],
        "correctAnswer": "Must exactly match one value from options",
        "correctAnswerHi": "Must exactly match one value from optionsHi",
        "explanation": "Short explanation in English.",
        "explanationHi": "Short explanation in Hindi."
      }
    ]
  }
]`;

const bulkQuestionExample = `[
  {
    "question": "Who founded the Maurya Empire?",
    "options": ["Ashoka", "Chandragupta Maurya", "Bindusara", "Bimbisara"],
    "correctAnswer": "Chandragupta Maurya",
    "explanation": "Founded around 321 BCE."
  }
]`;

const toBoolean = (value: any, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  if (typeof value === 'number') return value !== 0;
  if (value === null || value === undefined) return fallback;
  return Boolean(value);
};

const normalizeQuestionDraft = (question: any = {}) => ({
  question: String(question.question || '').trim(),
  questionHi: String(question.questionHi || '').trim(),
  options: Array.isArray(question.options) ? question.options.map((option: any) => String(option || '').trim()) : [],
  optionsHi: Array.isArray(question.optionsHi) ? question.optionsHi.map((option: any) => String(option || '').trim()) : [],
  correctAnswer: String(question.correctAnswer || '').trim(),
  correctAnswerHi: String(question.correctAnswerHi || '').trim(),
  explanation: String(question.explanation || '').trim(),
  explanationHi: String(question.explanationHi || '').trim(),
});

const normalizeTestDraft = (test: any = {}, index = 0) => {
  const questions = Array.isArray(test.questions) ? test.questions.map(normalizeQuestionDraft) : [];

  return {
    ...test,
    group: String(test.group || '').trim(),
    title: String(test.title || '').trim(),
    description: String(test.description || '').trim(),
    duration: Number(test.duration) || 0,
    isFree: Object.prototype.hasOwnProperty.call(test || {}, 'isFree') ? toBoolean(test.isFree, false) : false,
    isPublished: Object.prototype.hasOwnProperty.call(test || {}, 'isPublished') ? toBoolean(test.isPublished, true) : true,
    order: Object.prototype.hasOwnProperty.call(test || {}, 'order') ? Number(test.order) || index : index,
    questions,
  };
};

const isMeaningfulQuestion = (question: any = {}) => {
  const questionText = String(question.question || '').trim();
  const correctAnswer = String(question.correctAnswer || '').trim();
  const options = Array.isArray(question.options) ? question.options.map((option: any) => String(option || '').trim()).filter(Boolean) : [];
  const explanation = String(question.explanation || '').trim();
  return Boolean(questionText || correctAnswer || options.length || explanation);
};

const isEmptyTestDraft = (test: any = {}) => {
  const questions = Array.isArray(test.questions) ? test.questions.filter(isMeaningfulQuestion) : [];
  return !String(test.title || '').trim()
    && !String(test.group || '').trim()
    && !String(test.description || '').trim()
    && !Number(test.duration || 0)
    && !questions.length;
};

// IMPORTANT: Only attach a `questions` array to a test payload when the
// original draft actually carried question data. If we always attach an
// (possibly empty) `questions` array, the backend treats that as "this test
// has an explicit (empty) question list" and wipes out any existing
// questions for that test on save. Tests loaded from tests-meta never carry
// questions, so they must be sent through untouched.
const prepareSeriesPayload = (payload: any = {}) => ({
  ...payload,
  tests: Array.isArray(payload.tests)
    ? payload.tests.map((test: any, index: number) => {
        const hadQuestionsField = Object.prototype.hasOwnProperty.call(test || {}, 'questions');
        const normalized = normalizeTestDraft(test, index);
        const { questions, ...rest } = normalized;

        if (!hadQuestionsField) {
          return rest;
        }

        return {
          ...rest,
          questions: questions.filter(isMeaningfulQuestion),
        };
      })
    : [],
});

const isTestPayload = (item: any = {}) => (
  Object.prototype.hasOwnProperty.call(item || {}, 'title')
  || Object.prototype.hasOwnProperty.call(item || {}, 'group')
  || Object.prototype.hasOwnProperty.call(item || {}, 'duration')
  || Object.prototype.hasOwnProperty.call(item || {}, 'isFree')
  || Object.prototype.hasOwnProperty.call(item || {}, 'isPublished')
  || Object.prototype.hasOwnProperty.call(item || {}, 'questions')
);

const detectBulkQuestionImport = (parsed: any) => {
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { mode: 'questions', tests: [], questions: [] };
  }

  const looksLikeTests = parsed.every(isTestPayload);
  if (looksLikeTests) {
    return {
      mode: 'tests',
      tests: parsed.map((test, index) => normalizeTestDraft(test, index)),
      questions: [],
    };
  }

  return {
    mode: 'questions',
    tests: [],
    questions: parsed.map(normalizeQuestionDraft),
  };
};

export function TestSeriesEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const { data, isLoading } = useGetTestSeriesByIdQuery(id!, { skip: isNew });
  const { data: testsMeta } = useGetTestSeriesMetaQuery(id!, { skip: isNew });
  const [updateSeries, { isLoading: isUpdating }] = useUpdateTestSeriesMutation();
  const [createSeries, { isLoading: isCreating }] = useCreateTestSeriesMutation();
  const [addSeriesTests, { isLoading: isAddingTests }] = useAddSeriesTestsMutation();
  const [patchTestMeta, { isLoading: isPatchingMeta }] = usePatchTestMetaMutation();
  const [updateTestQuestions, { isLoading: isSavingQuestions }] = useUpdateTestQuestionsMutation();
  const [deleteTest] = useDeleteTestMutation();

  const [formData, setFormData] = useState<any>({
    title: '',
    category: '',
    subject: '',
    bookName: '',
    tags: [],
    description: '',
    isPaid: false,
    price: 0,
    discountedPrice: 0,
    freeTestsCount: 0,
    isPublished: false,
    tests: []
  });

  const [bulkJson, setBulkJson] = useState('');
  const [showBulkTestImport, setShowBulkTestImport] = useState(false);
  const [bulkQuestionJson, setBulkQuestionJson] = useState('');
  const [showBulkQuestionImport, setShowBulkQuestionImport] = useState(false);
  const [expandedTests, setExpandedTests] = useState<number[]>([]);
  const [editingTestIndex, setEditingTestIndex] = useState<number | null>(null);

  const toggleTestExpanded = (index: number) => {
    setExpandedTests(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const [activeTab, setActiveTab] = useState('basic');
  const [currentPage, setCurrentPage] = useState(1);
  const [testToDelete, setTestToDelete] = useState<number | null>(null);
  const testsPerPage = 10;

  const bulkTestPreview = useMemo(() => {
    if (!bulkJson.trim()) return { error: null, tests: [] as any[], totalQuestions: 0, hasQuestions: false };

    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) return { error: 'JSON must be an array of tests', tests: [], totalQuestions: 0, hasQuestions: false };

      const tests = parsed.map((test, index) => normalizeTestDraft(test, (formData.tests || []).length + index));
      const totalQuestions = tests.reduce((sum, test) => sum + (test.questions?.length || 0), 0);
      return { error: null, tests, totalQuestions, hasQuestions: totalQuestions > 0 };
    } catch {
      return { error: 'Invalid JSON', tests: [], totalQuestions: 0, hasQuestions: false };
    }
  }, [bulkJson, formData.tests]);

  const bulkQuestionPreview = useMemo(() => {
    if (!bulkQuestionJson.trim()) return { error: null, questions: [] as any[], hasQuestionHi: false, hasOptionsHi: false };

    try {
      const parsed = JSON.parse(bulkQuestionJson);
      if (!Array.isArray(parsed)) return { error: 'JSON must be an array', questions: [], hasQuestionHi: false, hasOptionsHi: false };

      const detected = detectBulkQuestionImport(parsed);
      if (detected.mode === 'tests') {
        const questions = detected.tests.flatMap((test: any) => test.questions || []);
        return {
          error: null,
          questions,
          hasQuestionHi: questions.some((question: any) => Boolean(question.questionHi)),
          hasOptionsHi: questions.some((question: any) => (question.optionsHi || []).some(Boolean)),
        };
      }

      const questions = detected.questions;
      return {
        error: null,
        questions,
        hasQuestionHi: questions.some((question: any) => Boolean(question.questionHi)),
        hasOptionsHi: questions.some((question: any) => (question.optionsHi || []).some(Boolean)),
      };
    } catch {
      return { error: 'Invalid JSON', questions: [], hasQuestionHi: false, hasOptionsHi: false };
    }
  }, [bulkQuestionJson]);

  const handleImportBulkTests = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(bulkJson);
    } catch (e) {
      alert('Invalid JSON');
      return;
    }

    if (!Array.isArray(parsed)) {
      alert('JSON must be an array of tests');
      return;
    }

    const normalizedTests = parsed.map((test, index) => normalizeTestDraft(test, index));

    // Existing series: persist directly via the safe append endpoint so
    // existing tests/questions are never touched or replaced.
    if (id && id !== 'new') {
      try {
        const payloadTests = normalizedTests.map(({ questions, ...rest }) => ({
          ...rest,
          questions: questions.filter(isMeaningfulQuestion),
        }));
        const response = await addSeriesTests({ seriesId: id, tests: payloadTests }).unwrap();
        setBulkJson('');
        setShowBulkTestImport(false);
        alert(response?.message || 'Tests added successfully');
      } catch (err: any) {
        alert(err?.data?.message || 'Failed to import tests');
      }
      return;
    }

    // New (unsaved) series: stage tests locally until the series itself is created.
    setFormData({
      ...formData,
      tests: [...(formData.tests || []), ...normalizedTests]
    });
    setBulkJson('');
    setShowBulkTestImport(false);
    alert('Tests imported successfully into draft');
  };

  const handleImportBulkQuestions = async (testIndex: number) => {
    let parsed: any;
    try {
      parsed = JSON.parse(bulkQuestionJson);
    } catch (e) {
      alert('Invalid JSON');
      return;
    }

    if (!Array.isArray(parsed)) {
      alert('JSON must be an array');
      return;
    }

    const detected = detectBulkQuestionImport(parsed);

    if (detected.mode === 'tests') {
      const importedTest = detected.tests[0];

      // Existing series: persist the pasted full-test payload directly as a
      // brand-new test via the safe append endpoint. This never touches the
      // test currently being edited or any other existing test/questions.
      if (id && id !== 'new') {
        try {
          const { questions, ...rest } = importedTest;
          const response = await addSeriesTests({
            seriesId: id,
            tests: [{ ...rest, questions: (questions || []).filter(isMeaningfulQuestion) }],
          }).unwrap();
          setBulkQuestionJson('');
          setShowBulkQuestionImport(false);
          setEditingTestIndex(null);
          alert(response?.message || 'Test added successfully');
        } catch (err: any) {
          alert(err?.data?.message || 'Failed to import test');
        }
        return;
      }

      // New (unsaved) series: fill the current empty draft test, or stage a new one.
      const newTests = [...(formData.tests || [])];
      const currentTest = newTests[testIndex];
      if (currentTest && isEmptyTestDraft(currentTest)) {
        newTests[testIndex] = {
          ...(currentTest || {}),
          ...importedTest,
          questions: importedTest.questions || [],
        };
      } else {
        newTests.push(importedTest);
        setEditingTestIndex(newTests.length - 1);
      }
      setFormData({ ...formData, tests: newTests });
      setBulkQuestionJson('');
      setShowBulkQuestionImport(false);
      alert('Test added successfully');
      return;
    }

    const normalizedQuestions = detected.questions;
    const newTests = [...(formData.tests || [])];
    newTests[testIndex] = {
      ...(newTests[testIndex] || {}),
      questions: [...(newTests[testIndex].questions || []), ...normalizedQuestions]
    };
    setFormData({ ...formData, tests: newTests });
    setBulkQuestionJson('');
    setShowBulkQuestionImport(false);
    alert('Questions imported successfully');
  };

  useEffect(() => {
    if (data?.data) {
      setFormData(data.data);
    }
  }, [data]);

  useEffect(() => {
    if (!testsMeta?.data?.tests) return;
    setFormData((prev: any) => ({
      ...prev,
      tests: testsMeta.data.tests,
    }));
  }, [testsMeta]);

  const handleSave = async () => {
    try {
      if (isNew) {
        // New series: tests + questions are created together in one request.
        const payload = prepareSeriesPayload(formData);
        await createSeries(payload).unwrap();
      } else {
        // Existing series: tests are managed exclusively via the dedicated
        // per-test endpoints (meta patch, questions patch, bulk append,
        // delete). Never send the `tests` array here — doing so would force
        // the backend to delete-and-reinsert every test/question in the
        // entire series just to save a basic-info/pricing edit.
        const { tests, ...seriesOnlyBody } = formData;
        await updateSeries({ id: id!, body: seriesOnlyBody }).unwrap();
      }
      navigate('/test-series');
    } catch (error) {
      console.error('Failed to save', error);
      alert('Failed to save test series');
    }
  };

  const handleAddTest = () => {
    setFormData({
      ...formData,
      tests: [
        ...formData.tests,
        {
          title: 'New Test',
          group: 'General',
          description: '',
          duration: 60,
          isFree: false,
          isPublished: false,
          order: formData.tests.length,
          questions: []
        }
      ]
    });
    setEditingTestIndex(formData.tests.length);
  };

  const handleRemoveTest = (index: number) => {
    setTestToDelete(index);
  };

  const confirmRemoveTest = async () => {
    if (testToDelete === null) return;
    const index = testToDelete;
    const test = formData.tests[index];
    if (test._id && id && id !== 'new') {
      try {
        await deleteTest({ seriesId: id, testId: test._id }).unwrap();
      } catch (e) {
        alert('Failed to delete test from server');
        setTestToDelete(null);
        return;
      }
    }
    const newTests = [...formData.tests];
    newTests.splice(index, 1);
    setFormData({ ...formData, tests: newTests });
    setTestToDelete(null);
  };

  const handleTestChange = (index: number, field: string, value: any) => {
    const newTests = [...formData.tests];
    newTests[index] = { ...newTests[index], [field]: value };
    setFormData({ ...formData, tests: newTests });
  };

  const handleAddQuestion = (testIndex: number) => {
    const newTests = [...formData.tests];
    const questions = [...(newTests[testIndex].questions || [])];
    questions.push({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: ''
    });
    newTests[testIndex] = { ...newTests[testIndex], questions };
    setFormData({ ...formData, tests: newTests });
  };

  const handleRemoveQuestion = (testIndex: number, qIndex: number) => {
    const newTests = [...formData.tests];
    const questions = [...newTests[testIndex].questions];
    questions.splice(qIndex, 1);
    newTests[testIndex] = { ...newTests[testIndex], questions };
    setFormData({ ...formData, tests: newTests });
  };

  const handleQuestionChange = (testIndex: number, qIndex: number, field: string, value: any) => {
    const newTests = [...formData.tests];
    const questions = [...newTests[testIndex].questions];
    questions[qIndex] = { ...questions[qIndex], [field]: value };
    newTests[testIndex] = { ...newTests[testIndex], questions };
    setFormData({ ...formData, tests: newTests });
  };

  const handleOptionChange = (testIndex: number, qIndex: number, optIndex: number, value: string) => {
    const newTests = [...formData.tests];
    const questions = [...newTests[testIndex].questions];
    const options = [...questions[qIndex].options];
    options[optIndex] = value;
    questions[qIndex] = { ...questions[qIndex], options };
    newTests[testIndex] = { ...newTests[testIndex], questions };
    setFormData({ ...formData, tests: newTests });
  };

  const [visibleQCount, setVisibleQCount] = useState(10);
  useEffect(() => {
    if (editingTestIndex !== null) {
      const qCount = formData.tests[editingTestIndex]?.questions?.length || 0;
      if (qCount > visibleQCount) {
        const timer = setTimeout(() => {
           setVisibleQCount(prev => prev + 10);
        }, 50);
        return () => clearTimeout(timer);
      }
    } else {
      setVisibleQCount(10);
    }
  }, [editingTestIndex, formData.tests, visibleQCount]);

  const isSaving = isUpdating || isCreating;
  const isSavingTest = isPatchingMeta || isSavingQuestions || isAddingTests;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/test-series')}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
          {isNew ? 'Create Test Series' : 'Edit Test Series'}
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />}
        </h1>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 py-2 px-6 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 text-white flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Series
        </button>
      </div>

      <div className="flex items-center gap-6 border-b border-zinc-800 mb-6">
        {['basic', 'pricing', 'tests'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-sm font-bold transition-colors border-b-2",
              activeTab === tab 
                ? "border-indigo-500 text-indigo-400" 
                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
            )}
          >
            {tab === 'basic' && 'Basic Info'}
            {tab === 'pricing' && 'Pricing & Status'}
            {tab === 'tests' && `Tests (${formData.tests?.length || 0})`}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-zinc-100 mb-4">Basic Information</h2>
            <div className="space-y-4 max-w-3xl">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                  placeholder="e.g. Lucent GK Master"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                    placeholder="e.g. SSC"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject || ''}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                    placeholder="e.g. General Knowledge"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Book Name</label>
                  <input
                    type="text"
                    value={formData.bookName || ''}
                    onChange={e => setFormData({ ...formData, bookName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                    placeholder="e.g. Lucent General Knowledge"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={(formData.tags || []).join(', ')}
                    onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                    placeholder="e.g. gk, ssc, lucent"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100 h-32 resize-none"
                  placeholder="Test series description..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6 max-w-xl">
            <h2 className="text-sm font-bold text-zinc-100 mb-4">Pricing & Status</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isPublished || false}
                  onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500"
                />
                <div>
                  <div className="text-sm font-bold text-zinc-100">Published</div>
                  <div className="text-xs text-zinc-500">Make this series visible to users</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isPaid || false}
                  onChange={e => setFormData({ ...formData, isPaid: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500"
                />
                <div>
                  <div className="text-sm font-bold text-zinc-100">Paid Series</div>
                  <div className="text-xs text-zinc-500">Requires purchase to access all tests</div>
                </div>
              </label>

              {formData.isPaid && (
                <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Price (₹)</label>
                    <input
                      type="number"
                      value={formData.price || 0}
                      onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Discount Price (₹)</label>
                    <input
                      type="number"
                      value={formData.discountedPrice || 0}
                      onChange={e => setFormData({ ...formData, discountedPrice: parseInt(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Free Tests Count</label>
                    <input
                      type="number"
                      value={formData.freeTestsCount || 0}
                      onChange={e => setFormData({ ...formData, freeTestsCount: parseInt(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-100">Draft Tests ({formData.tests?.length || 0})</h2>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowBulkTestImport(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 px-4 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                >
                  Bulk Import Tests
                </button>
                <button 
                  onClick={handleAddTest}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New Test
                </button>
              </div>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="text-xs uppercase bg-zinc-950/50 border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 w-16 text-center">#</th>
                      <th className="px-4 py-3">Group</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3 w-24 text-center">Questions</th>
                      <th className="px-4 py-3 w-24 text-center">Duration</th>
                      <th className="px-4 py-3 w-24 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.tests?.slice((currentPage - 1) * testsPerPage, currentPage * testsPerPage).map((test: any, index: number) => {
                      const actualIndex = (currentPage - 1) * testsPerPage + index;
                      return (
                        <tr key={actualIndex} className="border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                          <td className="px-4 py-3 text-center">{actualIndex + 1}</td>
                          <td className="px-4 py-3 text-zinc-300">{test.group || '-'}</td>
                          <td className="px-4 py-3 font-medium text-zinc-200">{test.title}</td>
                          <td className="px-4 py-3 text-center">{test.totalQuestions || test.questions?.length || 0}</td>
                          <td className="px-4 py-3 text-center">{test.duration || 0}m</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-3">
                              <button 
                                onClick={() => setEditingTestIndex(actualIndex)}
                                className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                title="Edit Test"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleRemoveTest(actualIndex)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Delete Test"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!formData.tests || formData.tests.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 bg-zinc-950/50">
                          No tests added yet. Click "Add New Test" to get started or use the Bulk Import.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {formData.tests && formData.tests.length > testsPerPage && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-950/30">
                  <span className="text-xs text-zinc-500">
                    Showing <span className="font-medium text-zinc-300">{((currentPage - 1) * testsPerPage) + 1}</span> to <span className="font-medium text-zinc-300">{Math.min(currentPage * testsPerPage, formData.tests.length)}</span> of <span className="font-medium text-zinc-300">{formData.tests.length}</span> tests
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(formData.tests.length / testsPerPage), currentPage + 1))}
                      disabled={currentPage === Math.ceil(formData.tests.length / testsPerPage)}
                      className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {editingTestIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Edit Test: <span className="text-indigo-400">{formData.tests[editingTestIndex]?.title || 'Untitled Test'}</span>
              </h2>
              <button onClick={() => setEditingTestIndex(null)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex gap-6">
              <div className="w-1/3 space-y-4 border-r border-zinc-800 pr-6">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Test Details</h3>
                
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.tests[editingTestIndex]?.title || ''}
                    onChange={e => handleTestChange(editingTestIndex, 'title', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                    placeholder="Test Title..."
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Group</label>
                  <input
                    type="text"
                    value={formData.tests[editingTestIndex]?.group || ''}
                    onChange={e => handleTestChange(editingTestIndex, 'group', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                    placeholder="Group (e.g. History)"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Description</label>
                  <textarea
                    value={formData.tests[editingTestIndex]?.description || ''}
                    onChange={e => handleTestChange(editingTestIndex, 'description', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100 min-h-[80px]"
                    placeholder="Test Description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Duration (mins)</label>
                    <input
                      type="number"
                      value={formData.tests[editingTestIndex]?.duration || 0}
                      onChange={e => handleTestChange(editingTestIndex, 'duration', parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs outline-none text-zinc-100"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tests[editingTestIndex]?.isFree || false}
                      onChange={e => handleTestChange(editingTestIndex, 'isFree', e.target.checked)}
                      className="w-4 h-4 accent-indigo-500"
                    />
                    <span className="text-xs font-bold text-zinc-300">Free Test</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tests[editingTestIndex]?.isPublished || false}
                      onChange={e => handleTestChange(editingTestIndex, 'isPublished', e.target.checked)}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <span className="text-xs font-bold text-zinc-300">Published</span>
                  </label>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Questions ({formData.tests[editingTestIndex]?.totalQuestions || formData.tests[editingTestIndex]?.questions?.length || 0})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowBulkQuestionImport(true)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                      Bulk Import
                    </button>
                    <button
                      onClick={() => handleAddQuestion(editingTestIndex)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Question
                    </button>
                  </div>
                </div>

                {showBulkQuestionImport && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4 mb-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-zinc-100">Bulk Import Questions</h4>
                      <button onClick={() => setShowBulkQuestionImport(false)} className="text-zinc-500 hover:text-zinc-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] text-zinc-400">Paste a JSON array of questions.</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setBulkQuestionJson(bulkQuestionExample)}
                          className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1 px-2 rounded font-bold transition-colors"
                        >
                          See Example
                        </button>
                        <button 
                          onClick={() => navigator.clipboard.writeText(bulkQuestionExample)}
                          className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1 px-2 rounded font-bold transition-colors flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy Example
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={bulkQuestionJson}
                      onChange={e => setBulkQuestionJson(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100 h-40 font-mono"
                      placeholder="Paste JSON array here..."
                    />

                    {bulkQuestionPreview.error && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                        {bulkQuestionPreview.error}
                      </div>
                    )}

                    {!bulkQuestionPreview.error && bulkQuestionPreview.questions.length > 0 && (
                      <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Preview</div>
                            <div className="text-[11px] text-zinc-500">
                              Detected {bulkQuestionPreview.questions.length} question{bulkQuestionPreview.questions.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {bulkQuestionPreview.hasQuestionHi || bulkQuestionPreview.hasOptionsHi ? 'Bilingual content included' : 'English only'}
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                          {bulkQuestionPreview.questions.slice(0, 5).map((question: any, index: number) => (
                            <div key={`${question.question || 'question'}-${index}`} className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
                              <div className="font-semibold text-zinc-100">{question.question || `Untitled Question ${index + 1}`}</div>
                              <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-500">
                                <span>Options: {question.options?.length || 0}</span>
                                <span>Answer: {question.correctAnswer || 'Not set'}</span>
                                <span>{question.questionHi ? 'Hindi text present' : 'No Hindi text'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleImportBulkQuestions(editingTestIndex)}
                        disabled={isAddingTests}
                        className="bg-indigo-600 hover:bg-indigo-500 py-1.5 px-4 rounded-md text-xs font-bold transition-colors text-white disabled:opacity-50 flex items-center gap-2"
                      >
                        {isAddingTests && <Loader2 className="w-3 h-3 animate-spin" />}
                        Import
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-6 pb-8">
                  {formData.tests[editingTestIndex]?.questions?.slice(0, visibleQCount).map((q: any, qIndex: number) => (
                    <div key={qIndex} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Question {qIndex + 1}</label>
                          <textarea
                            value={q.question || ''}
                            onChange={e => handleQuestionChange(editingTestIndex, qIndex, 'question', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100 min-h-[80px]"
                            placeholder="Enter your question here..."
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveQuestion(editingTestIndex, qIndex)}
                          className="text-red-400 hover:text-red-300 p-2 rounded-md hover:bg-red-500/10 transition-colors"
                          title="Remove Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {(q.options || ['', '', '', '']).map((opt: string, optIndex: number) => (
                          <div key={optIndex}>
                            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Option {optIndex + 1}</label>
                            <input
                              type="text"
                              value={opt}
                              onChange={e => handleOptionChange(editingTestIndex, qIndex, optIndex, e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                              placeholder={`Option ${optIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Correct Answer</label>
                          <select
                            value={q.correctAnswer || ''}
                            onChange={e => handleQuestionChange(editingTestIndex, qIndex, 'correctAnswer', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100"
                          >
                            <option value="">Select correct answer</option>
                            {(q.options || []).filter(Boolean).map((opt: string, idx: number) => (
                              <option key={idx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Explanation (Optional)</label>
                          <textarea
                            value={q.explanation || ''}
                            onChange={e => handleQuestionChange(editingTestIndex, qIndex, 'explanation', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100 h-[46px]"
                            placeholder="Explanation for the correct answer..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.tests[editingTestIndex]?.questions?.length > visibleQCount && (
                    <div className="w-full text-center py-4 text-zinc-500 text-xs flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
                      <span>Loading more questions...</span>
                    </div>
                  )}

                  {(!formData.tests[editingTestIndex]?.questions || formData.tests[editingTestIndex].questions.length === 0) && (
                    <div className="text-center py-12 text-zinc-500 text-xs border border-zinc-800 border-dashed rounded-lg">
                      {formData.tests[editingTestIndex]?.totalQuestions > 0 
                        ? 'Questions are not loaded to improve performance. To edit questions, use a dedicated question editor.' 
                        : 'No questions added yet. Click "Add Question" to start.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setEditingTestIndex(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-300"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  const currentTest = formData.tests?.[editingTestIndex];
                  if (id && id !== 'new') {
                    try {
                      if (currentTest?._id) {
                        // Existing test: lightweight meta-only patch — never
                        // touches any other test or the full question set of
                        // the entire series (fast).
                        const metaResponse = await patchTestMeta({
                          seriesId: id,
                          testId: currentTest._id,
                          body: {
                            group: currentTest.group,
                            title: currentTest.title,
                            description: currentTest.description,
                            duration: currentTest.duration,
                            isFree: currentTest.isFree,
                            isPublished: currentTest.isPublished,
                          },
                        }).unwrap();

                        // Only touch this single test's questions if the
                        // draft actually carries a questions array (added
                        // manually or via bulk import into this test).
                        if (Object.prototype.hasOwnProperty.call(currentTest, 'questions')) {
                          const cleanQuestions = (currentTest.questions || [])
                            .map(normalizeQuestionDraft)
                            .filter(isMeaningfulQuestion);
                          await updateTestQuestions({
                            seriesId: id,
                            testId: currentTest._id,
                            questions: cleanQuestions,
                          }).unwrap();
                        }

                        if (metaResponse?.data) {
                          setFormData((prev: any) => {
                            const nextTests = [...(prev.tests || [])];
                            nextTests[editingTestIndex] = {
                              ...nextTests[editingTestIndex],
                              ...metaResponse.data,
                            };
                            return { ...prev, tests: nextTests };
                          });
                        }
                      } else {
                        // Brand-new local draft test (added via "+ Add New
                        // Test"): create it on the server via the safe
                        // append endpoint, without touching existing tests.
                        const normalized = normalizeTestDraft(currentTest, editingTestIndex);
                        await addSeriesTests({
                          seriesId: id,
                          tests: [{ ...normalized, questions: normalized.questions.filter(isMeaningfulQuestion) }],
                        }).unwrap();
                      }
                    } catch (e) {
                      console.error('Failed to save test', e);
                      alert('Failed to save test');
                      return;
                    }
                  }
                  setEditingTestIndex(null);
                }}
                disabled={isSavingTest}
                className="bg-indigo-600 hover:bg-indigo-500 py-2 px-6 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 text-white flex items-center gap-2"
              >
                {isSavingTest && <Loader2 className="w-3 h-3 animate-spin" />}
                Save Test
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkTestImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
              <h2 className="text-sm font-bold text-zinc-100">Bulk Import Tests</h2>
              <button onClick={() => setShowBulkTestImport(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-zinc-400">Paste a JSON array containing your tests.</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setBulkJson(bulkTestExample)}
                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1 px-2 rounded font-bold transition-colors"
                  >
                    See Example
                  </button>
                  <button 
                    onClick={() => navigator.clipboard.writeText(bulkTestExample)}
                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1 px-2 rounded font-bold transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy Example
                  </button>
                </div>
              </div>
              <textarea
                value={bulkJson}
                onChange={e => setBulkJson(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 transition-colors text-zinc-100 h-64 font-mono"
                placeholder="[{ &quot;title&quot;: &quot;Test 1&quot;, &quot;duration&quot;: 30 }, ...]"
              />

              {bulkTestPreview.error && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                  {bulkTestPreview.error}
                </div>
              )}

              {!bulkTestPreview.error && bulkTestPreview.tests.length > 0 && (
                <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Preview</div>
                      <div className="text-[11px] text-zinc-500">
                        Detected {bulkTestPreview.tests.length} test{bulkTestPreview.tests.length !== 1 ? 's' : ''} and {bulkTestPreview.totalQuestions} question{bulkTestPreview.totalQuestions !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {bulkTestPreview.hasQuestions ? 'Questions included in payload' : 'No nested questions in payload'}
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {bulkTestPreview.tests.slice(0, 6).map((test: any, index: number) => (
                      <div key={`${test.title || 'test'}-${index}`} className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold text-zinc-100">{test.title || `Untitled Test ${index + 1}`}</div>
                          <div className="text-[10px] text-zinc-500">{test.duration || 0} min</div>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-500">
                          <span>Group: {test.group || 'Ungrouped'}</span>
                          <span>Questions: {test.questions?.length || 0}</span>
                          <span>{test.isFree ? 'Free' : 'Paid'}</span>
                          <span>{test.isPublished ? 'Published' : 'Draft'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkTestImport(false)}
                className="py-2 px-4 rounded-lg text-xs font-bold transition-colors text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleImportBulkTests}
                disabled={isAddingTests || !!bulkTestPreview.error || bulkTestPreview.tests.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 py-2 px-6 rounded-lg text-xs font-bold transition-colors text-white disabled:opacity-50 flex items-center gap-2"
              >
                {isAddingTests && <Loader2 className="w-3 h-3 animate-spin" />}
                Import Tests
              </button>
            </div>
          </div>
        </div>
      )}
      {testToDelete !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Delete Test</h3>
            <p className="text-sm text-zinc-400 mb-6">Are you sure you want to delete this test? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTestToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveTest}
                className="bg-red-600 hover:bg-red-500 py-2 px-6 rounded-lg text-xs font-bold transition-colors text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
