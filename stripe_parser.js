// Stripe Jobs Parser - Parse Stripe custom job board
// Target page: https://stripe.com/jobs/search

/**
 * Parse job information from Stripe job board page
 * @param {string} html - Page HTML content
 * @returns {Array} Array of job information
 */
function parseStripeJobs(html) {
  try {
    console.log("Starting to parse Stripe job board page...");
    
    // Check if page contains job information
    if (!html || typeof html !== 'string') {
      console.log("Invalid HTML content");
      return [];
    }

    // Stripe uses React/JavaScript rendering, job data is usually in JSON
    // Try to extract data from script tags
    const scriptRegex = /<script[^>]*>[\s\S]*?window\.__INITIAL_STATE__[\s\S]*?({[\s\S]*?})[\s\S]*?<\/script>/gi;
    const scriptMatch = html.match(scriptRegex);
    
    if (scriptMatch) {
      console.log("Found possible initial state data");
      // Can further parse JSON data here
    }

    // Fallback: Search for job elements directly in HTML
    // Stripe jobs usually have specific class or data attributes
    const jobElements = [];
    
    // Search for possible job containers
    const jobSelectors = [
      '[data-testid*="job"]',
      '[class*="job"]',
      '[class*="position"]',
      '[class*="listing"]',
      'article',
      '.job-item',
      '.position-item',
      '.career-item'
    ];

    for (const selector of jobSelectors) {
      const regex = new RegExp(`<[^>]*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^>]*>`, 'gi');
      const matches = html.match(regex);
      if (matches && matches.length > 0) {
        console.log(`Found ${matches.length} matching elements (selector: ${selector})`);
        jobElements.push(...matches);
      }
    }

    // Try to extract job information from HTML
    const jobs = [];
    
    // Search for job titles
    const titleRegex = /<[^>]*(?:title|heading|job[^>]*title)[^>]*>([^<]+)<\/[^>]*>/gi;
    let titleMatch;
    while ((titleMatch = titleRegex.exec(html)) !== null) {
      const title = titleMatch[1].trim();
      if (title && title.length > 3 && title.length < 100) {
        jobs.push({
          title: title,
          company: 'Stripe',
          location: 'Remote/Hybrid', // Default value
          department: 'Engineering', // Default value
          type: 'Full-time', // Default value
          url: 'https://stripe.com/jobs/search',
          source: 'Stripe Custom'
        });
      }
    }

    // Search for location information
    const locationRegex = /<[^>]*(?:location|office)[^>]*>([^<]+)<\/[^>]*>/gi;
    const locations = [];
    let locationMatch;
    while ((locationMatch = locationRegex.exec(html)) !== null) {
      const location = locationMatch[1].trim();
      if (location && location.length > 2 && location.length < 50) {
        locations.push(location);
      }
    }

    // Update job location information
    if (locations.length > 0 && jobs.length > 0) {
      jobs.forEach((job, index) => {
        job.location = locations[index % locations.length] || job.location;
      });
    }

    // Search for department information
    const deptRegex = /<[^>]*(?:department|team|org)[^>]*>([^<]+)<\/[^>]*>/gi;
    const departments = [];
    let deptMatch;
    while ((deptMatch = deptRegex.exec(html)) !== null) {
      const dept = deptMatch[1].trim();
      if (dept && dept.length > 2 && dept.length < 50) {
        departments.push(dept);
      }
    }

    // Update job department information
    if (departments.length > 0 && jobs.length > 0) {
      jobs.forEach((job, index) => {
        job.department = departments[index % departments.length] || job.department;
      });
    }

    console.log(`Parsing completed, found ${jobs.length} jobs`);
    
    // Remove duplicates
    const uniqueJobs = [];
    const seenTitles = new Set();
    
    for (const job of jobs) {
      if (!seenTitles.has(job.title.toLowerCase())) {
        seenTitles.add(job.title.toLowerCase());
        uniqueJobs.push(job);
      }
    }

    console.log(`After deduplication: ${uniqueJobs.length} jobs remaining`);
    return uniqueJobs;

  } catch (error) {
    console.error("Error parsing Stripe page:", error);
    return [];
  }
}

/**
 * Extract JSON data from Stripe page
 * @param {string} html - Page HTML
 * @returns {Object|null} Extracted JSON data
 */
function extractStripeJSON(html) {
  try {
    // Search for script tags containing job data
    const scriptRegex = /<script[^>]*>(?:[\s\S]*?)(\{[\s\S]*?"jobs"[\s\S]*?\})[\s\S]*?<\/script>/gi;
    const matches = html.match(scriptRegex);
    
    if (matches) {
      for (const match of matches) {
        try {
          // Try to extract JSON part
          const jsonMatch = match.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            // Clean up possible JavaScript code
            const cleanJson = jsonStr
              .replace(/^\s*window\.\w+\s*=\s*/, '')
              .replace(/;\s*$/, '');
            
            const data = JSON.parse(cleanJson);
            if (data.jobs || data.positions || data.openings) {
              console.log("Successfully extracted job data");
              return data;
            }
          }
        } catch (e) {
          // Continue trying next match
          continue;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting JSON data:", error);
    return null;
  }
}

/**
 * Parse job information from extracted JSON data
 * @param {Object} jsonData - Extracted JSON data
 * @returns {Array} Array of job information
 */
function parseStripeJSONJobs(jsonData) {
  try {
    const jobs = [];
    
    // Try different data structures
    const jobArrays = [
      jsonData.jobs,
      jsonData.positions,
      jsonData.openings,
      jsonData.listings,
      jsonData.results
    ];

    for (const jobArray of jobArrays) {
      if (Array.isArray(jobArray) && jobArray.length > 0) {
        console.log(`Found ${jobArray.length} jobs`);
        
        for (const job of jobArray) {
          if (job && typeof job === 'object') {
            jobs.push({
              title: job.title || job.name || job.position || 'Unknown Position',
              company: 'Stripe',
              location: job.location || job.office || job.city || 'Remote/Hybrid',
              department: job.department || job.team || job.org || 'Engineering',
              type: job.type || job.employment_type || 'Full-time',
              url: job.url || job.link || `https://stripe.com/jobs/${job.id || ''}`,
              source: 'Stripe JSON',
              description: job.description || job.summary || '',
              posted_date: job.posted_date || job.created_at || '',
              remote: job.remote || job.remote_ok || false
            });
          }
        }
        break; // Stop after finding first valid job array
      }
    }

    return jobs;
  } catch (error) {
    console.error("Error parsing JSON job data:", error);
    return [];
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseStripeJobs,
    extractStripeJSON,
    parseStripeJSONJobs
  };
}

// If in browser environment, add functions to global object
if (typeof window !== 'undefined') {
  window.parseStripeJobs = parseStripeJobs;
  window.extractStripeJSON = extractStripeJSON;
  window.parseStripeJSONJobs = parseStripeJSONJobs;
}

console.log("Stripe parser loaded");
