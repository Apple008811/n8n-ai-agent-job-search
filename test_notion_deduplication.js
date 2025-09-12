// Test Notion Job Deduplication
// Shows how to avoid conflicts with existing LinkedIn jobs

const { parseAndMapToNotion, isJobDuplicate, removeDuplicateJobs } = require('./notion_job_mapper.js');

// Mock existing jobs from your Notion database (LinkedIn jobs)
const existingLinkedInJobs = [
  {
    title: "Finance Director",
    url: "https://www.linkedin.com/comm/jobs/view/4298202465/",
    location: "Unknown",
    source: "LinkedIn"
  },
  {
    title: "Senior Finance Associate", 
    url: "https://www.linkedin.com/comm/jobs/view/4288302377/",
    location: "Unknown",
    source: "LinkedIn"
  },
  {
    title: "AI Engineer",
    url: "https://www.linkedin.com/comm/jobs/view/4291234567/",
    location: "San Francisco, CA",
    source: "LinkedIn"
  }
];

// Mock Greenhouse HTML with some overlapping jobs
const greenhouseHTML = `
<!DOCTYPE html>
<html>
<head><title>Jobs at Example Company</title></head>
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
            <a href="/jobs/124">AI Engineer</a> <!-- This might conflict with LinkedIn -->
        </div>
        <div class="location">Remote</div>
        <div class="department">Engineering</div>
    </div>
    
    <div class="opening">
        <div class="opening-title">
            <a href="/jobs/125">Product Manager</a>
        </div>
        <div class="location">New York, NY</div>
        <div class="department">Product</div>
    </div>
    
    <div class="opening">
        <div class="opening-title">
            <a href="/jobs/126">Finance Director</a> <!-- This will conflict with LinkedIn -->
        </div>
        <div class="location">Chicago, IL</div>
        <div class="department">Finance</div>
    </div>
</body>
</html>
`;

// Test function
function testDeduplication() {
  console.log('🧪 Testing Notion Job Deduplication\n');
  
  // Test 1: Parse Greenhouse jobs without deduplication
  console.log('=== Test 1: Parse Greenhouse Jobs (No Deduplication) ===');
  const allJobs = parseAndMapToNotion(greenhouseHTML, 'Example Company');
  console.log(`Found ${allJobs.length} total jobs\n`);
  
  // Test 2: Parse Greenhouse jobs with deduplication
  console.log('=== Test 2: Parse Greenhouse Jobs (With Deduplication) ===');
  const uniqueJobs = parseAndMapToNotion(greenhouseHTML, 'Example Company', existingLinkedInJobs);
  console.log(`Found ${uniqueJobs.length} unique jobs after deduplication\n`);
  
  // Test 3: Test individual duplicate detection
  console.log('=== Test 3: Individual Duplicate Detection ===');
  const testJobs = [
    { title: "AI Engineer", url: "https://boards.greenhouse.io/example/jobs/124" },
    { title: "Finance Director", url: "https://boards.greenhouse.io/example/jobs/126" },
    { title: "Senior Software Engineer", url: "https://boards.greenhouse.io/example/jobs/123" }
  ];
  
  testJobs.forEach((job, index) => {
    const isDuplicate = isJobDuplicate(job, existingLinkedInJobs);
    console.log(`   ${index + 1}. "${job.title}" - ${isDuplicate ? '❌ DUPLICATE' : '✅ UNIQUE'}`);
  });
  console.log('');
  
  // Test 4: Show what gets filtered out
  console.log('=== Test 4: Deduplication Summary ===');
  const greenhouseJobs = [
    { title: "Senior Software Engineer", url: "https://boards.greenhouse.io/example/jobs/123" },
    { title: "AI Engineer", url: "https://boards.greenhouse.io/example/jobs/124" },
    { title: "Product Manager", url: "https://boards.greenhouse.io/example/jobs/125" },
    { title: "Finance Director", url: "https://boards.greenhouse.io/example/jobs/126" }
  ];
  
  const filteredJobs = removeDuplicateJobs(greenhouseJobs, existingLinkedInJobs);
  
  console.log('📊 Results:');
  console.log(`   Total Greenhouse jobs: ${greenhouseJobs.length}`);
  console.log(`   Existing LinkedIn jobs: ${existingLinkedInJobs.length}`);
  console.log(`   Unique jobs to add: ${filteredJobs.length}`);
  console.log(`   Duplicates filtered out: ${greenhouseJobs.length - filteredJobs.length}`);
  console.log('');
  
  // Test 5: Show final Notion pages
  console.log('=== Test 5: Final Notion Pages ===');
  const notionPages = filteredJobs.map(job => ({
    properties: {
      "Job Title": job.title,
      "Link": job.url,
      "Onsite/Remote/Hybrid": "Remote/Hybrid",
      "Added Date": new Date().toISOString().split('T')[0],
      "Apply Date": "",
      "Status": "New",
      "Re-apply": ""
    },
    source: "Greenhouse"
  }));
  
  notionPages.forEach((page, index) => {
    console.log(`   ${index + 1}. ${page.properties["Job Title"]}`);
    console.log(`      Link: ${page.properties["Link"]}`);
    console.log(`      Source: ${page.source}`);
    console.log('');
  });
  
  console.log('✅ Deduplication test completed!');
  console.log('\n💡 Key Benefits:');
  console.log('   - Avoids duplicate entries in your Job List database');
  console.log('   - Preserves existing LinkedIn job data');
  console.log('   - Only adds truly new Greenhouse jobs');
  console.log('   - Maintains data integrity across different sources');
}

// Run tests
testDeduplication();
