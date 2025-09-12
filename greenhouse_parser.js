// Greenhouse Job Parser for n8n (without cheerio)
// Parses job listings from Greenhouse careers pages using regex

// Get HTML content from input
const htmlContent = $input.first().json.data;

// Initialize results array
const jobs = [];

// Extract company name from title tag
const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
const companyName = titleMatch ? titleMatch[1].replace(' - Greenhouse', '').replace('Careers - ', '').replace('Positions Archive - ', '').trim() : 'Unknown Company';

// Parse job listings using regex patterns
// Pattern 1: Look for job links with href containing '/jobs/'
const jobLinkPattern = /<a[^>]+href=["']([^"']*\/jobs\/\d+)["'][^>]*>([^<]+)<\/a>/gi;
let match;

while ((match = jobLinkPattern.exec(htmlContent)) !== null) {
  try {
    const jobLink = match[1];
    const title = match[2].trim();
    
    // Skip if title contains unwanted text
    if (title.toLowerCase().includes('apply') || title.toLowerCase().includes('button')) {
      continue;
    }
    
    // Extract job ID from URL
    const jobIdMatch = jobLink.match(/\/jobs\/(\d+)/);
    const jobId = jobIdMatch ? jobIdMatch[1] : `gh_${Date.now()}_${jobs.length}`;
    
    // Convert relative URLs to absolute URLs
    let fullJobLink = jobLink;
    if (jobLink.startsWith('/')) {
      fullJobLink = 'https://boards.greenhouse.io' + jobLink;
    }
    
    // Try to find location information near the job link
    let location = 'Not specified';
    
    // Look for location in the surrounding context
    const contextStart = Math.max(0, match.index - 500);
    const contextEnd = Math.min(htmlContent.length, match.index + 500);
    const context = htmlContent.substring(contextStart, contextEnd);
    
    // Try to find location patterns
    const locationPatterns = [
      /<span[^>]*class=["'][^"']*location[^"']*["'][^>]*>([^<]+)<\/span>/i,
      /<div[^>]*class=["'][^"']*location[^"']*["'][^>]*>([^<]+)<\/div>/i,
      /location[^>]*>([^<,]+)</i
    ];
    
    for (const pattern of locationPatterns) {
      const locationMatch = context.match(pattern);
      if (locationMatch && locationMatch[1]) {
        location = locationMatch[1].trim();
        break;
      }
    }
    
    const job = {
      jobTitle: title,
      company: companyName,
      location: location,
      department: 'Not specified',
      jobLink: fullJobLink,
      workType: 'Unknown',
      source: 'Greenhouse',
      scrapedDate: new Date().toISOString(),
      jobId: jobId
    };
    
    jobs.push(job);
  } catch (error) {
    console.log(`Error parsing job:`, error.message);
  }
}

// Remove duplicates based on job ID
const uniqueJobs = [];
const seenIds = new Set();

jobs.forEach(job => {
  if (!seenIds.has(job.jobId)) {
    seenIds.add(job.jobId);
    uniqueJobs.push(job);
  }
});

// Return the parsed jobs
return uniqueJobs.map(job => ({ json: job }));
