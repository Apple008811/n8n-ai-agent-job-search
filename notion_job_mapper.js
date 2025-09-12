// Notion Job Mapper
// Maps Greenhouse parser data to your existing Job List database

const { parseGreenhouseJobs, searchGreenhouseJobs } = require('./greenhouse_optimized.js');

/**
 * Convert job data to your Notion Job List database format
 * @param {Object} job - Job object from Greenhouse parser
 * @returns {Object} Notion page properties for Job List database
 */
function mapJobToNotionJobList(job) {
  return {
    properties: {
      "Job Title": job.title,
      "Link": job.url,
      "Onsite/Remote/Hybrid": job.location,
      "Added Date": new Date().toISOString().split('T')[0],
      "Apply Date": "", // Empty initially
      "Status": "New", // Default status
      "Re-apply": "" // Empty initially
    },
    // Add source information for deduplication
    source: "Greenhouse",
    originalUrl: job.url
  };
}

/**
 * Check if a job already exists in Notion (by title and company)
 * @param {Object} job - Job object
 * @param {Array} existingJobs - Array of existing job objects from Notion
 * @returns {boolean} True if job already exists
 */
function isJobDuplicate(job, existingJobs) {
  if (!existingJobs || existingJobs.length === 0) {
    return false;
  }
  
  return existingJobs.some(existingJob => {
    // Check by title similarity (case insensitive)
    const titleMatch = existingJob.title && job.title && 
      existingJob.title.toLowerCase().trim() === job.title.toLowerCase().trim();
    
    // Check by URL similarity (for same company)
    const urlMatch = existingJob.url && job.url && 
      (existingJob.url.includes('greenhouse.io') && job.url.includes('greenhouse.io')) ||
      (existingJob.url.includes('linkedin.com') && job.url.includes('linkedin.com'));
    
    return titleMatch || urlMatch;
  });
}

/**
 * Filter out duplicate jobs
 * @param {Array} jobs - Array of job objects
 * @param {Array} existingJobs - Array of existing job objects from Notion
 * @returns {Array} Array of unique job objects
 */
function removeDuplicateJobs(jobs, existingJobs = []) {
  if (!existingJobs || existingJobs.length === 0) {
    console.log('ℹ️ No existing jobs to check against, returning all jobs');
    return jobs;
  }
  
  console.log(`🔍 Checking ${jobs.length} new jobs against ${existingJobs.length} existing jobs...`);
  
  const uniqueJobs = [];
  const duplicates = [];
  
  for (const job of jobs) {
    if (isJobDuplicate(job, existingJobs)) {
      duplicates.push(job);
      console.log(`   ⚠️ Duplicate found: ${job.title}`);
    } else {
      uniqueJobs.push(job);
    }
  }
  
  console.log(`📊 Deduplication results:`);
  console.log(`   New jobs: ${uniqueJobs.length}`);
  console.log(`   Duplicates: ${duplicates.length}`);
  
  return uniqueJobs;
}

/**
 * Parse Greenhouse jobs and convert to Notion format
 * @param {string} html - Greenhouse page HTML
 * @param {string} company - Company name
 * @param {Array} existingJobs - Array of existing jobs from Notion (optional)
 * @returns {Array} Array of unique Notion page objects
 */
function parseAndMapToNotion(html, company, existingJobs = []) {
  try {
    console.log(`🔄 Parsing Greenhouse jobs for ${company}...`);
    
    // Parse jobs using Greenhouse parser
    const jobs = parseGreenhouseJobs(html, company);
    
    console.log(`📋 Found ${jobs.length} jobs from Greenhouse`);
    
    // Remove duplicates if existing jobs provided
    const uniqueJobs = removeDuplicateJobs(jobs, existingJobs);
    
    console.log(`📋 Converting ${uniqueJobs.length} unique jobs to Notion format...`);
    
    // Convert to Notion format
    const notionPages = uniqueJobs.map(job => mapJobToNotionJobList(job));
    
    // Display results
    notionPages.forEach((page, index) => {
      console.log(`   ${index + 1}. ${page.properties["Job Title"]}`);
      console.log(`      Location: ${page.properties["Onsite/Remote/Hybrid"]}`);
      console.log(`      Link: ${page.properties["Link"]}`);
      console.log(`      Status: ${page.properties["Status"]}`);
      console.log(`      Source: ${page.source}`);
      console.log('');
    });
    
    return notionPages;
    
  } catch (error) {
    console.error('❌ Error parsing and mapping jobs:', error);
    return [];
  }
}

/**
 * Filter jobs and convert to Notion format
 * @param {string} html - Greenhouse page HTML
 * @param {string} company - Company name
 * @param {Object} filters - Filter criteria
 * @returns {Array} Array of filtered Notion page objects
 */
function parseFilteredAndMapToNotion(html, company, filters = {}) {
  try {
    console.log(`🔄 Parsing and filtering Greenhouse jobs for ${company}...`);
    console.log(`🔍 Filters:`, filters);
    
    // Parse jobs
    const jobs = parseGreenhouseJobs(html, company);
    
    // Apply filters
    const filteredJobs = searchGreenhouseJobs(jobs, filters);
    
    console.log(`📋 Found ${filteredJobs.length} jobs matching criteria`);
    
    if (filteredJobs.length === 0) {
      console.log('ℹ️ No jobs match the specified criteria');
      return [];
    }
    
    // Convert to Notion format
    const notionPages = filteredJobs.map(job => mapJobToNotionJobList(job));
    
    // Display results
    notionPages.forEach((page, index) => {
      console.log(`   ${index + 1}. ${page.properties["Job Title"]}`);
      console.log(`      Location: ${page.properties["Onsite/Remote/Hybrid"]}`);
      console.log(`      Link: ${page.properties["Link"]}`);
      console.log(`      Status: ${page.properties["Status"]}`);
      console.log('');
    });
    
    return notionPages;
    
  } catch (error) {
    console.error('❌ Error parsing and filtering jobs:', error);
    return [];
  }
}

/**
 * Generate Notion API payload for creating pages
 * @param {Array} notionPages - Array of Notion page objects
 * @param {string} databaseId - Your Job List database ID
 * @returns {Array} Array of Notion API payloads
 */
function generateNotionAPIPayloads(notionPages, databaseId) {
  return notionPages.map(page => ({
    parent: {
      database_id: databaseId
    },
    properties: page.properties
  }));
}

/**
 * Export jobs as JSON for manual import
 * @param {Array} notionPages - Array of Notion page objects
 * @returns {string} JSON export data
 */
function exportJobsForNotion(notionPages) {
  const exportData = {
    timestamp: new Date().toISOString(),
    total_jobs: notionPages.length,
    database_id: "2644ae56-fb5a-8022-9bab-dd248426236c", // Your Job List database ID
    jobs: notionPages.map(page => ({
      "Job Title": page.properties["Job Title"],
      "Link": page.properties["Link"],
      "Onsite/Remote/Hybrid": page.properties["Onsite/Remote/Hybrid"],
      "Added Date": page.properties["Added Date"],
      "Apply Date": page.properties["Apply Date"],
      "Status": page.properties["Status"],
      "Re-apply": page.properties["Re-apply"]
    }))
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Create a sample job entry for testing
 * @returns {Object} Sample Notion page object
 */
function createSampleJobEntry() {
  const sampleJob = {
    title: "Senior Software Engineer",
    company: "Example Company",
    location: "San Francisco, CA",
    department: "Engineering",
    type: "Full-time",
    url: "https://boards.greenhouse.io/example/jobs/123",
    source: "Greenhouse"
  };
  
  return mapJobToNotionJobList(sampleJob);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mapJobToNotionJobList,
    parseAndMapToNotion,
    parseFilteredAndMapToNotion,
    generateNotionAPIPayloads,
    exportJobsForNotion,
    createSampleJobEntry,
    isJobDuplicate,
    removeDuplicateJobs
  };
}

// If in browser environment, add functions to global object
if (typeof window !== 'undefined') {
  window.mapJobToNotionJobList = mapJobToNotionJobList;
  window.parseAndMapToNotion = parseAndMapToNotion;
  window.parseFilteredAndMapToNotion = parseFilteredAndMapToNotion;
  window.generateNotionAPIPayloads = generateNotionAPIPayloads;
  window.exportJobsForNotion = exportJobsForNotion;
  window.createSampleJobEntry = createSampleJobEntry;
}

console.log('Notion Job Mapper loaded');
