const id = "66914777d921381c81cd92b2";
const testId = "66914777d921381c81cd92b3";
fetch(`https://backend.examroot.cc/api/test-series/${id}/tests/${testId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Updated Test Title 123'
  })
}).then(r => r.json()).then(data => console.log(data)).catch(console.error);
