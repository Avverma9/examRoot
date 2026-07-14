fetch('https://backend.examroot.cc/api/admin/generate-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceText: 'The quick brown fox jumps over the lazy dog. The capital of India is New Delhi. The largest planet is Jupiter.',
    prompt: 'Generate 2 MCQs',
    questionCount: 2
  })
}).then(r => r.json()).then(data => console.log(JSON.stringify(data))).catch(console.error);
