const id = "6a411b7f570508f021767edf";
fetch(`https://backend.examroot.cc/api/test-series/${id}`)
.then(r => r.json())
.then(async data => {
  const series = data.data;
  if (!series.tests || !series.tests[0]) return console.log('no tests');
  series.tests[0].title = 'Updated Title ' + Date.now();
  const res = await fetch(`https://backend.examroot.cc/api/test-series/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(series)
  });
  console.log(await res.text());
}).catch(console.error);
