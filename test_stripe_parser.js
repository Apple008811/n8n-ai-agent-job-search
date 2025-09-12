// Test Stripe Parser
const { parseStripeJobs, extractStripeJSON, parseStripeJSONJobs } = require('./stripe_parser.js');

// Mock Stripe page HTML content (based on actual data you provided)
const stripeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jobs at Stripe</title>
</head>
<body>
    <div id="app">
        <!-- Stripe uses React, content is usually dynamically loaded -->
        <div class="jobs-container">
            <h1>Open Positions</h1>
            
            <!-- Possible job elements -->
            <div class="job-listing">
                <h2 class="job-title">Senior Software Engineer</h2>
                <div class="job-location">San Francisco, CA</div>
                <div class="job-department">Engineering</div>
            </div>
            
            <div class="job-listing">
                <h2 class="job-title">Product Manager</h2>
                <div class="job-location">New York, NY</div>
                <div class="job-department">Product</div>
            </div>
            
            <!-- Possible JSON data -->
            <script>
                window.__INITIAL_STATE__ = {
                    "jobs": [
                        {
                            "id": "12345",
                            "title": "Staff Engineer",
                            "location": "Remote",
                            "department": "Engineering",
                            "type": "Full-time",
                            "url": "https://stripe.com/jobs/12345",
                            "description": "Build scalable payment systems"
                        },
                        {
                            "id": "12346",
                            "title": "Data Scientist",
                            "location": "Seattle, WA",
                            "department": "Data",
                            "type": "Full-time",
                            "url": "https://stripe.com/jobs/12346",
                            "description": "Analyze payment data patterns"
                        }
                    ]
                };
            </script>
        </div>
    </div>
</body>
</html>`;

// Test function
function testStripeParser() {
    console.log("🧪 Starting Stripe parser test...\n");
    
    // Test 1: Basic HTML parsing
    console.log("📋 Test 1: Basic HTML parsing");
    const jobs1 = parseStripeJobs(stripeHTML);
    console.log(`Found ${jobs1.length} jobs:`);
    jobs1.forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.title} - ${job.location} (${job.department})`);
    });
    console.log("");
    
    // Test 2: JSON data extraction
    console.log("📋 Test 2: JSON data extraction");
    const jsonData = extractStripeJSON(stripeHTML);
    if (jsonData) {
        console.log("✅ Successfully extracted JSON data");
        console.log("JSON structure:", Object.keys(jsonData));
    } else {
        console.log("❌ Failed to extract JSON data");
    }
    console.log("");
    
    // Test 3: JSON job parsing
    if (jsonData) {
        console.log("📋 Test 3: JSON job parsing");
        const jsonJobs = parseStripeJSONJobs(jsonData);
        console.log(`Found ${jsonJobs.length} jobs from JSON:`);
        jsonJobs.forEach((job, index) => {
            console.log(`  ${index + 1}. ${job.title} - ${job.location} (${job.department})`);
            console.log(`      URL: ${job.url}`);
            console.log(`      Description: ${job.description.substring(0, 50)}...`);
        });
        console.log("");
    }
    
    // Test 4: Empty HTML handling
    console.log("📋 Test 4: Empty HTML handling");
    const emptyJobs = parseStripeJobs("");
    console.log(`Empty HTML returns ${emptyJobs.length} jobs (expected: 0)`);
    console.log("");
    
    // Test 5: Invalid HTML handling
    console.log("📋 Test 5: Invalid HTML handling");
    const invalidJobs = parseStripeJobs(null);
    console.log(`Invalid HTML returns ${invalidJobs.length} jobs (expected: 0)`);
    console.log("");
    
    console.log("✅ Stripe parser test completed!");
}

// Run tests
testStripeParser();
