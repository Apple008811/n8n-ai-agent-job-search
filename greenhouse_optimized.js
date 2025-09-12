// Optimized Greenhouse Job Parser
// Specifically designed for boards.greenhouse.io job boards

/**
 * Parse Greenhouse job board page
 * @param {string} html - Page HTML content
 * @param {string} company - Company name
 * @returns {Array} Array of job information
 */
function parseGreenhouseJobs(html, company = 'Unknown Company') {
  try {
    console.log(`Starting Greenhouse parsing for: ${company}`);
    
    if (!html || typeof html !== 'string') {
      console.log('Invalid HTML content');
      return [];
    }

    const jobs = [];
    
    // Method 1: Try to extract from JSON data first (most reliable)
    const jsonJobs = parseGreenhouseJSON(html, company);
    if (jsonJobs.length > 0) {
      console.log(`Found ${jsonJobs.length} jobs from JSON data`);
      return jsonJobs;
    }
    
    // Method 2: Parse HTML structure
    const htmlJobs = parseGreenhouseHTML(html, company);
    if (htmlJobs.length > 0) {
      console.log(`Found ${htmlJobs.length} jobs from HTML parsing`);
      return htmlJobs;
    }
    
    // Method 3: Generic fallback
    const genericJobs = parseGreenhouseGeneric(html, company);
    console.log(`Found ${genericJobs.length} jobs from generic parsing`);
    return genericJobs;
    
  } catch (error) {
    console.error('Error parsing Greenhouse jobs:', error);
    return [];
  }
}

/**
 * Parse jobs from Greenhouse JSON data
 * @param {string} html - Page HTML content
 * @param {string} company - Company name
 * @returns {Array} Array of job information
 */
function parseGreenhouseJSON(html, company) {
  try {
    // Look for Greenhouse's typical JSON structure
    const jsonPatterns = [
      /window\.greenhouseJobs\s*=\s*(\{[\s\S]*?\});/gi,
      /window\.jobs\s*=\s*(\{[\s\S]*?\});/gi,
      /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/gi,
      /"jobs":\s*\[([\s\S]*?)\]/gi
    ];
    
    for (const pattern of jsonPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        for (const match of matches) {
          try {
            // Extract JSON part
            const jsonMatch = match.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const jsonStr = jsonMatch[0];
              const cleanJson = jsonStr
                .replace(/^\s*window\.\w+\s*=\s*/, '')
                .replace(/;\s*$/, '');
              
              const data = JSON.parse(cleanJson);
              
              // Try different possible job arrays
              const jobArrays = [
                data.jobs,
                data.openings,
                data.positions,
                data.results,
                data.data
              ];
              
              for (const jobArray of jobArrays) {
                if (Array.isArray(jobArray) && jobArray.length > 0) {
                  console.log(`Found ${jobArray.length} jobs in JSON data`);
                  return parseJobArray(jobArray, company);
                }
              }
            }
          } catch (e) {
            continue;
          }
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing Greenhouse JSON:', error);
    return [];
  }
}

/**
 * Parse jobs from Greenhouse HTML structure
 * @param {string} html - Page HTML content
 * @param {string} company - Company name
 * @returns {Array} Array of job information
 */
function parseGreenhouseHTML(html, company) {
  try {
    const jobs = [];
    
    // Greenhouse specific selectors
    const jobSelectors = [
      '.opening',
      '.job-listing',
      '.position',
      '[data-testid*="job"]',
      '.job-item'
    ];
    
    for (const selector of jobSelectors) {
      const regex = new RegExp(`<[^>]*class="[^"]*${selector.replace('.', '')}[^"]*"[^>]*>([\\s\\S]*?)<\\/[^>]*>`, 'gi');
      const matches = html.match(regex);
      
      if (matches && matches.length > 0) {
        console.log(`Found ${matches.length} job containers with selector: ${selector}`);
        
        for (const match of matches) {
          const job = parseJobContainer(match, company);
          if (job) {
            jobs.push(job);
          }
        }
        
        if (jobs.length > 0) {
          break; // Stop after finding jobs with first working selector
        }
      }
    }
    
    // If no jobs found with specific selectors, try a more flexible approach
    if (jobs.length === 0) {
      console.log('Trying flexible HTML parsing...');
      const flexibleJobs = parseFlexibleHTML(html, company);
      jobs.push(...flexibleJobs);
    }
    
    return jobs;
  } catch (error) {
    console.error('Error parsing Greenhouse HTML:', error);
    return [];
  }
}

/**
 * Parse flexible HTML structure
 * @param {string} html - Page HTML content
 * @param {string} company - Company name
 * @returns {Array} Array of job information
 */
function parseFlexibleHTML(html, company) {
  try {
    const jobs = [];
    
    // Look for job titles with links
    const jobLinkPatterns = [
      /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi,
      /<[^>]*(?:opening-title|job-title|position-title)[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>[\s\S]*?<\/[^>]*>/gi
    ];
    
    for (const pattern of jobLinkPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1] || match[2];
        const title = match[2] || match[3];
        
        if (title && title.trim().length > 3 && title.trim().length < 100) {
          const cleanTitle = title.trim();
          // Skip generic titles
          if (!cleanTitle.toLowerCase().includes('jobs at') && 
              !cleanTitle.toLowerCase().includes('careers') &&
              !cleanTitle.toLowerCase().includes('open positions')) {
            
            // Clean up URL
            let cleanUrl = url ? url.trim() : '#';
            if (cleanUrl && !cleanUrl.startsWith('http')) {
              cleanUrl = cleanUrl.startsWith('/') ? 
                `https://boards.greenhouse.io${cleanUrl}` : 
                `https://boards.greenhouse.io/${cleanUrl}`;
            }
            
            jobs.push({
              title: cleanTitle,
              company: company,
              location: 'Remote/Hybrid',
              department: 'Engineering',
              type: 'Full-time',
              url: cleanUrl,
              source: 'Greenhouse Flexible'
            });
          }
        }
      }
    }
    
    // Fallback: look for titles without links
    if (jobs.length === 0) {
      const titlePatterns = [
        /<[^>]*(?:opening-title|job-title|position-title)[^>]*>([^<]+)<\/[^>]*>/gi,
        /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi
      ];
      
      for (const pattern of titlePatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const title = match[1].trim();
          if (title && title.length > 3 && title.length < 100) {
            // Skip generic titles
            if (!title.toLowerCase().includes('jobs at') && 
                !title.toLowerCase().includes('careers') &&
                !title.toLowerCase().includes('open positions')) {
              jobs.push({
                title: title,
                company: company,
                location: 'Remote/Hybrid',
                department: 'Engineering',
                type: 'Full-time',
                url: '#',
                source: 'Greenhouse Flexible'
              });
            }
          }
        }
      }
    }
    
    return jobs;
  } catch (error) {
    console.error('Error in flexible HTML parsing:', error);
    return [];
  }
}

/**
 * Parse individual job container
 * @param {string} container - Job container HTML
 * @param {string} company - Company name
 * @returns {Object|null} Job object or null
 */
function parseJobContainer(container, company) {
  try {
    // Extract title and URL together (most reliable)
    const titleUrlRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi;
    const titleUrlMatch = titleUrlRegex.exec(container);
    
    let title, url;
    if (titleUrlMatch) {
      url = titleUrlMatch[1].trim();
      title = titleUrlMatch[2].trim();
    } else {
      // Fallback: extract title separately
      const titleRegex = /<[^>]*(?:opening-title|job-title|position-title)[^>]*>([^<]+)<\/[^>]*>/gi;
      const titleMatch = titleRegex.exec(container);
      title = titleMatch ? titleMatch[1].trim() : null;
      url = '#';
    }
    
    if (!title || title.length < 3) {
      return null;
    }
    
    // Extract location
    const locationRegex = /<[^>]*(?:location|office)[^>]*>([^<]+)<\/[^>]*>/gi;
    const locationMatch = locationRegex.exec(container);
    const location = locationMatch ? locationMatch[1].trim() : 'Remote/Hybrid';
    
    // Extract department
    const deptRegex = /<[^>]*(?:department|team)[^>]*>([^<]+)<\/[^>]*>/gi;
    const deptMatch = deptRegex.exec(container);
    const department = deptMatch ? deptMatch[1].trim() : 'Engineering';
    
    // Clean up URL
    let cleanUrl = url;
    if (cleanUrl && cleanUrl !== '#') {
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = cleanUrl.startsWith('/') ? 
          `https://boards.greenhouse.io${cleanUrl}` : 
          `https://boards.greenhouse.io/${cleanUrl}`;
      }
    }
    
    return {
      title: title,
      company: company,
      location: location,
      department: department,
      type: 'Full-time',
      url: cleanUrl,
      source: 'Greenhouse HTML'
    };
  } catch (error) {
    console.error('Error parsing job container:', error);
    return null;
  }
}

/**
 * Parse job array from JSON
 * @param {Array} jobArray - Array of job objects
 * @param {string} company - Company name
 * @returns {Array} Array of job information
 */
function parseJobArray(jobArray, company) {
  try {
    const jobs = [];
    
    for (const job of jobArray) {
      if (job && typeof job === 'object') {
        jobs.push({
          title: job.title || job.name || job.position || 'Unknown Position',
          company: company,
          location: job.location || job.office || job.city || 'Remote/Hybrid',
          department: job.department || job.team || job.org || 'Engineering',
          type: job.type || job.employment_type || 'Full-time',
          url: job.url || job.link || job.apply_url || '#',
          source: 'Greenhouse JSON',
          description: job.description || job.summary || '',
          posted_date: job.posted_date || job.created_at || '',
          remote: job.remote || job.remote_ok || false
        });
      }
    }
    
    return jobs;
  } catch (error) {
    console.error('Error parsing job array:', error);
    return [];
  }
}

/**
 * Generic parsing fallback
 * @param {string} html - Page HTML content
 * @param {string} company - Company name
 * @returns {Array} Array of job information
 */
function parseGreenhouseGeneric(html, company) {
  try {
    const jobs = [];
    
    // Generic title extraction
    const titleRegex = /<[^>]*(?:title|heading|job[^>]*title)[^>]*>([^<]+)<\/[^>]*>/gi;
    const titles = [];
    let titleMatch;
    while ((titleMatch = titleRegex.exec(html)) !== null) {
      const title = titleMatch[1].trim();
      if (title && title.length > 3 && title.length < 100) {
        titles.push(title);
      }
    }
    
    // Generic location extraction
    const locationRegex = /<[^>]*(?:location|office)[^>]*>([^<]+)<\/[^>]*>/gi;
    const locations = [];
    let locationMatch;
    while ((locationMatch = locationRegex.exec(html)) !== null) {
      const location = locationMatch[1].trim();
      if (location && location.length > 2 && location.length < 50) {
        locations.push(location);
      }
    }
    
    // Create job objects
    for (let i = 0; i < titles.length; i++) {
      jobs.push({
        title: titles[i],
        company: company,
        location: locations[i] || 'Remote/Hybrid',
        department: 'Engineering',
        type: 'Full-time',
        url: '#',
        source: 'Greenhouse Generic'
      });
    }
    
    return jobs;
  } catch (error) {
    console.error('Error in generic parsing:', error);
    return [];
  }
}

/**
 * Search jobs by criteria
 * @param {Array} jobs - Array of job objects
 * @param {Object} criteria - Search criteria
 * @returns {Array} Filtered job array
 */
function searchGreenhouseJobs(jobs, criteria = {}) {
  try {
    let filteredJobs = [...jobs];
    
    // Search by title keyword
    if (criteria.title) {
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(criteria.title.toLowerCase())
      );
    }
    
    // Search by location
    if (criteria.location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(criteria.location.toLowerCase())
      );
    }
    
    // Search by department
    if (criteria.department) {
      filteredJobs = filteredJobs.filter(job => 
        job.department.toLowerCase().includes(criteria.department.toLowerCase())
      );
    }
    
    // Search by remote work
    if (criteria.remote !== undefined) {
      filteredJobs = filteredJobs.filter(job => 
        job.remote === criteria.remote || 
        job.location.toLowerCase().includes('remote')
      );
    }
    
    return filteredJobs;
  } catch (error) {
    console.error('Error searching jobs:', error);
    return jobs;
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseGreenhouseJobs,
    searchGreenhouseJobs
  };
}

// If in browser environment, add functions to global object
if (typeof window !== 'undefined') {
  window.parseGreenhouseJobs = parseGreenhouseJobs;
  window.searchGreenhouseJobs = searchGreenhouseJobs;
}

console.log('Optimized Greenhouse parser loaded');
