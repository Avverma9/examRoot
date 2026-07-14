fetch('https://backend.examroot.cc/api/test-series/66914777d921381c81cd92b2', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New Title',
    tests: [{ title: 'New Test Title' }]
  })
}).then(r => r.json()).then(data => console.log(JSON.stringify(data))).catch(console.error);
