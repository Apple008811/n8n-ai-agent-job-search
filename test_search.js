// Test search functionality for job parsing
const { parseJobs, getSupportedJobBoards } = require('./universal_job_parser.js');

// Mock HTML content for different companies
const mockHTML = `
<!DOCTYPE html>
<html>
<head><title>Jobs</title></head>
<body>
  <div class="opening">
    <div class="opening-title">
      <a href="/jobs/123">Senior Software Engineer</a>
    </div>
    <div class="location">San Francisco, CA</div>
    <div class="department">Engineering</div>
  </div>
  
  <div class="opening">
    <div class="opening-title">
      <a href="/jobs/124">Product Manager</a>
    </div>
    <div class="location">New York, NY</div>
    <div class="department">Product</div>
  </div>
  
  <div class="opening">
    <div class="opening-title">
      <a href="/jobs/125">Data Scientist</a>
    </div>
    <div class="location">Remote</div>
    <div class="department">Data</div>
  </div>
</body>
</html>
`;

// Test search functions
function testSearchFunctionality() {
  console.log('🔍 Testing job search functionality...\n');
  
  // Parse jobs
  const jobs = parseJobs(mockHTML, 'https://boards.greenhouse.io/example', 'Example Company');
  console.log(`Found ${jobs.length} total jobs\n`);
  
  // Search by title keyword
  console.log('📋 Search by title keyword "Engineer":');
  const engineerJobs = jobs.filter(job => 
    job.title.toLowerCase().includes('engineer')
  );
  engineerJobs.forEach((job, index) => {
    console.log(`  ${index + 1}. ${job.title} - ${job.location}`);
  });
  console.log('');
  
  // Search by location
  console.log('📋 Search by location "Remote":');
  const remoteJobs = jobs.filter(job => 
    job.location.toLowerCase().includes('remote')
  );
  remoteJobs.forEach((job, index) => {
    console.log(`  ${index + 1}. ${job.title} - ${job.location}`);
  });
  console.log('');
  
  // Search by department
  console.log('📋 Search by department "Engineering":');
  const engJobs = jobs.filter(job => 
    job.department.toLowerCase().includes('engineering')
  );
  engJobs.forEach((job, index) => {
    console.log(`  ${index + 1}. ${job.title} - ${job.department}`);
  });
  console.log('');
  
  // Advanced search with multiple criteria
  console.log('📋 Advanced search (Engineer + San Francisco):');
  const advancedJobs = jobs.filter(job => 
    job.title.toLowerCase().includes('engineer') && 
    job.location.toLowerCase().includes('san francisco')
  );
  advancedJobs.forEach((job, index) => {
    console.log(`  ${index + 1}. ${job.title} - ${job.location}`);
  });
  console.log('');
  
  // Show supported job boards
  console.log('📋 Supported job board types:');
  const supportedBoards = getSupportedJobBoards();
  supportedBoards.forEach((board, index) => {
    console.log(`  ${index + 1}. ${board}`);
  });
}

// Run tests
testSearchFunctionality();
