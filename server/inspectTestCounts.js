import fs from 'fs';
const path = 'c:/Users/Av957/OneDrive/Desktop/examRoot.testseries.json';
const raw = fs.readFileSync(path, 'utf8');
const data = JSON.parse(raw);
const series = Array.isArray(data) ? data[0] : data;
const tests = series.tests || [];
console.log('total tests', tests.length);
[162,163,164,165].forEach(i => {
  const t = tests[i];
  console.log(
    'idx', i + 1,
    'title', t?.title || '<missing>',
    'questions', Array.isArray(t?.questions) ? t.questions.length : '?',
    'totalQuestions', t?.totalQuestions,
    'existsQuestions', Object.prototype.hasOwnProperty.call(t || {}, 'questions')
  );
});
