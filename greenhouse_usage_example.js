// Greenhouse Parser Usage Example
// Shows how to use the optimized Greenhouse parser in real scenarios

const { parseGreenhouseJobs, searchGreenhouseJobs } = require('./greenhouse_optimized.js');

/**
 * Example: Parse jobs from a Greenhouse company page
 * @param {string} companyName - Name of the company
 * @param {string} greenhouseUrl - Greenhouse URL (e.g., 'boards.greenhouse.io/discord')
 * @returns {Array} Array of job objects with links
 */
async function getCompanyJobs(companyName, greenhouseUrl) {
  try {
    console.log(`🔍 Fetching jobs for ${companyName}...`);
    
    // In a real scenario, you would fetch the HTML from the URL
    // For this example, we'll use mock data
    const mockHTML = `
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
    `;
    
    // Parse jobs
    const jobs = parseGreenhouseJobs(mockHTML, companyName);
    
    console.log(`✅ Found ${jobs.length} jobs for ${companyName}`);
    return jobs;
    
  } catch (error) {
    console.error(`❌ Error fetching jobs for ${companyName}:`, error);
    return [];
  }
}

/**
 * Example: Search for specific types of jobs
 * @param {Array} jobs - Array of job objects
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered job array
 */
function findJobsByKeyword(jobs, searchTerm) {
  const results = searchGreenhouseJobs(jobs, { title: searchTerm });
  
  console.log(`🔍 Found ${results.length} jobs matching "${searchTerm}":`);
  results.forEach((job, index) => {
    console.log(`   ${index + 1}. ${job.title} - ${job.location}`);
    console.log(`      🔗 Apply: ${job.url}`);
  });
  
  return results;
}

/**
 * Example: Get remote jobs only
 * @param {Array} jobs - Array of job objects
 * @returns {Array} Remote job array
 */
function getRemoteJobs(jobs) {
  const remoteJobs = searchGreenhouseJobs(jobs, { location: 'Remote' });
  
  console.log(`🏠 Found ${remoteJobs.length} remote jobs:`);
  remoteJobs.forEach((job, index) => {
    console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
    console.log(`      🔗 Apply: ${job.url}`);
  });
  
  return remoteJobs;
}

/**
 * Example: Get jobs by department
 * @param {Array} jobs - Array of job objects
 * @param {string} department - Department name
 * @returns {Array} Department job array
 */
function getJobsByDepartment(jobs, department) {
  const deptJobs = searchGreenhouseJobs(jobs, { department: department });
  
  console.log(`🏢 Found ${deptJobs.length} jobs in ${department} department:`);
  deptJobs.forEach((job, index) => {
    console.log(`   ${index + 1}. ${job.title} - ${job.location}`);
    console.log(`      🔗 Apply: ${job.url}`);
  });
  
  return deptJobs;
}

/**
 * Example: Generate job application links
 * @param {Array} jobs - Array of job objects
 * @returns {Array} Array of application links
 */
function generateApplicationLinks(jobs) {
  const links = jobs.map(job => ({
    title: job.title,
    company: job.company,
    url: job.url,
    location: job.location
  }));
  
  console.log('📋 Job Application Links:');
  links.forEach((link, index) => {
    console.log(`   ${index + 1}. ${link.title} at ${link.company}`);
    console.log(`      Location: ${link.location}`);
    console.log(`      Apply: ${link.url}`);
    console.log('');
  });
  
  return links;
}

/**
 * Example: Filter jobs by multiple criteria
 * @param {Array} jobs - Array of job objects
 * @param {Object} criteria - Search criteria
 * @returns {Array} Filtered job array
 */
function filterJobs(jobs, criteria) {
  const filtered = searchGreenhouseJobs(jobs, criteria);
  
  console.log(`🎯 Found ${filtered.length} jobs matching criteria:`);
  console.log(`   Title: ${criteria.title || 'Any'}`);
  console.log(`   Location: ${criteria.location || 'Any'}`);
  console.log(`   Department: ${criteria.department || 'Any'}`);
  console.log('');
  
  filtered.forEach((job, index) => {
    console.log(`   ${index + 1}. ${job.title}`);
    console.log(`      Company: ${job.company}`);
    console.log(`      Location: ${job.location}`);
    console.log(`      Department: ${job.department}`);
    console.log(`      🔗 Apply: ${job.url}`);
    console.log('');
  });
  
  return filtered;
}

// Example usage
async function runExamples() {
  console.log('🚀 Greenhouse Parser Usage Examples\n');
  
  // Example 1: Get all jobs for a company
  console.log('=== Example 1: Get Company Jobs ===');
  const jobs = await getCompanyJobs('Discord', 'boards.greenhouse.io/discord');
  console.log('');
  
  // Example 2: Search for specific jobs
  console.log('=== Example 2: Search for Engineer Jobs ===');
  const engineerJobs = findJobsByKeyword(jobs, 'Engineer');
  console.log('');
  
  // Example 3: Get remote jobs
  console.log('=== Example 3: Get Remote Jobs ===');
  const remoteJobs = getRemoteJobs(jobs);
  console.log('');
  
  // Example 4: Get jobs by department
  console.log('=== Example 4: Get Engineering Jobs ===');
  const engJobs = getJobsByDepartment(jobs, 'Engineering');
  console.log('');
  
  // Example 5: Generate application links
  console.log('=== Example 5: Generate Application Links ===');
  const applicationLinks = generateApplicationLinks(jobs);
  console.log('');
  
  // Example 6: Advanced filtering
  console.log('=== Example 6: Advanced Filtering ===');
  const filteredJobs = filterJobs(jobs, {
    title: 'Engineer',
    location: 'San Francisco'
  });
  console.log('');
  
  console.log('✅ All examples completed!');
}

// Run examples
runExamples();
