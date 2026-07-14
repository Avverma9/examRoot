fetch('https://backend.examroot.cc/api/test-series')
.then(r => r.json())
.then(data => {
  const id = data.data[0]._id;
  console.log('ID:', id);
}).catch(console.error);
