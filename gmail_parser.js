// Parse Gmail emails and extract ALL job information
const allJobs = [];

// Debug: Log total emails and first few snippets
console.log('Total emails:', $input.all().length);
for (let i = 0; i < Math.min(3, $input.all().length); i++) {
  console.log(`Email ${i + 1} snippet:`, $input.all()[i].json.snippet);
  console.log(`Email ${i + 1} subject:`, $input.all()[i].json.Subject);
}

// Process each email - SIMPLIFIED VERSION
for (const email of $input.all()) {
  const emailId = email.json.id;
  const snippet = email.json.snippet || '';
  const subject = email.json.Subject || '';
  const internalDate = email.json.payload?.internalDate || Date.now();
  
  // Convert timestamp to readable date
  const applyDate = new Date(parseInt(internalDate)).toISOString().split('T')[0];
  
  // Skip only system notification emails, keep LinkedIn job alerts
  if (subject.includes('created') && subject.includes('alert')) {
    // This is a system notification about creating an alert, skip it
    continue;
  }
  
  // SIMPLIFIED: Create one job record per email for now
  // This ensures we process all emails and can see what we're working with
  const jobRecord = {
    'Job Title': snippet.substring(0, 100) || subject.substring(0, 100) || 'Job Alert',
    'Link': `https://linkedin.com/jobs/view/${emailId}`,
    'Onsite/Remote/Hybrid': 'Unknown',
    'Apply Date': applyDate,
    'Status': 'New',
    'Re-apply': 'No'
  };
  allJobs.push(jobRecord);
}

// Remove duplicates based on Job Title
const uniqueJobs = [];
const seenTitles = new Set();

allJobs.forEach(job => {
  if (!seenTitles.has(job['Job Title'])) {
    seenTitles.add(job['Job Title']);
    uniqueJobs.push(job);
  }
});

return uniqueJobs;
