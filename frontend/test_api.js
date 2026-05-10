const fs = require('fs');

async function test() {
  const fileBuffer = fs.readFileSync('dummy_resume.txt');
  const blob = new Blob([fileBuffer], { type: 'text/plain' });
  
  const formData = new FormData();
  formData.append('resume', blob, 'dummy_resume.txt');

  try {
    const res = await fetch('http://localhost:3000/api/parse-resume', {
      method: 'POST',
      body: formData
    });
    
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", json);
  } catch(e) {
    console.error("Fetch failed", e);
  }
}

test();
