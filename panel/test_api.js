const title = "Dummy Test Series " + Date.now();
fetch('https://backend.examroot.cc/api/test-series', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title,
    tests: [{ title: 'Test 1', duration: 10, questions: [{ question: 'Q1', options: ['A','B','C','D'], correctAnswer: 'A' }] }]
  })
}).then(r => r.json()).then(data => {
  console.log(data);
}).catch(console.error);
