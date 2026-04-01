fetch('http://localhost:3000/api/cron/morning-briefing')
  .then(res => res.json())
  .then(data => {
      console.log('GET Motivation:', data);
  })
  .catch(console.error);
