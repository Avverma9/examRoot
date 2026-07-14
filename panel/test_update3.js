fetch('https://backend.examroot.cc/api/test-series/66914777d921381c81cd92b2')
.then(r => r.json())
.then(async data => {
  const series = data.data;
  series.tests[0].title = 'Updated Title ' + Date.now();
  const res = await fetch(`https://backend.examroot.cc/api/test-series/66914777d921381c81cd92b2`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(series)
  });
  console.log(await res.text());
}).catch(console.error);
