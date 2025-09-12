// Test optimized Greenhouse parser
const { parseGreenhouseJobs, searchGreenhouseJobs } = require('./greenhouse_optimized.js');

// Mock Greenhouse HTML content
const greenhouseHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Jobs at Example Company</title>
</head>
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
    
    <div class="opening">
        <div class="opening-title">
            <a href="/jobs/126">Frontend Engineer</a>
        </div>
        <div class="location">Seattle, WA</div>
        <div class="department">Engineering</div>
    </div>
</body>
</html>
`;

// Test function
function testGreenhouseParser() {
    console.log('🧪 Testing optimized Greenhouse parser...\n');
    
    // Parse jobs
    const jobs = parseGreenhouseJobs(greenhouseHTML, 'Example Company');
    console.log(`Found ${jobs.length} total jobs:\n`);
    
    jobs.forEach((job, index) => {
        console.log(`${index + 1}. ${job.title}`);
        console.log(`   Company: ${job.company}`);
        console.log(`   Location: ${job.location}`);
        console.log(`   Department: ${job.department}`);
        console.log(`   URL: ${job.url}`);
        console.log(`   Source: ${job.source}\n`);
    });
    
    // Show clickable links
    console.log('🔗 Clickable job links:');
    jobs.forEach((job, index) => {
        if (job.url && job.url !== '#') {
            console.log(`   ${index + 1}. ${job.title}: ${job.url}`);
        }
    });
    console.log('');
    
    // Test search functionality
    console.log('🔍 Testing search functionality...\n');
    
    // Search by title
    console.log('📋 Search by title "Engineer":');
    const engineerJobs = searchGreenhouseJobs(jobs, { title: 'Engineer' });
    engineerJobs.forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.title} - ${job.location}`);
    });
    console.log('');
    
    // Search by location
    console.log('📋 Search by location "Remote":');
    const remoteJobs = searchGreenhouseJobs(jobs, { location: 'Remote' });
    remoteJobs.forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.title} - ${job.location}`);
    });
    console.log('');
    
    // Search by department
    console.log('📋 Search by department "Engineering":');
    const engJobs = searchGreenhouseJobs(jobs, { department: 'Engineering' });
    engJobs.forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.title} - ${job.department}`);
    });
    console.log('');
    
    // Advanced search
    console.log('📋 Advanced search (Engineer + San Francisco):');
    const advancedJobs = searchGreenhouseJobs(jobs, { 
        title: 'Engineer', 
        location: 'San Francisco' 
    });
    advancedJobs.forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.title} - ${job.location}`);
    });
    console.log('');
    
    console.log('✅ Greenhouse parser test completed!');
}

// Run tests
testGreenhouseParser();
