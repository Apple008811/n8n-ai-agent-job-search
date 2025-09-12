// Universal Job Parser - Handles multiple job board formats
// Supports: Greenhouse, Stripe, LinkedIn, Indeed, and more

/**
 * Universal job parser configuration
 * Each job board type has its own parsing rules
 */
const JOB_BOARD_CONFIGS = {
  'greenhouse': {
    name: 'Greenhouse',
    baseUrl: 'boards.greenhouse.io',
    selectors: {
      jobContainer: '.opening',
      title: '.opening-title a',
      location: '.location',
      department: '.department',
      type: '.job-type',
      url: '.opening-title a'
    },
    jsonPaths: ['jobs', 'openings', 'positions'],
    customParser: null
  },
  
  'stripe': {
    name: 'Stripe',
    baseUrl: 'stripe.com',
    selectors: {
      jobContainer: '.job-listing, [data-testid*="job"]',
      title: '.job-title, h2, h3',
      location: '.job-location, .location',
      department: '.job-department, .department',
      type: '.job-type, .type',
      url: 'a[href*="/jobs/"]'
    },
    jsonPaths: ['jobs', 'positions', 'openings'],
    customParser: 'parseStripeJobs'
  },
  
  'linkedin': {
    name: 'LinkedIn',
    baseUrl: 'linkedin.com',
    selectors: {
      jobContainer: '.jobs-search-results__list-item',
      title: '.jobs-search-results__list-item h3 a',
      location: '.jobs-search-results__list-item .job-result-card__location',
      department: '.jobs-search-results__list-item .job-result-card__department',
      type: '.jobs-search-results__list-item .job-result-card__employment-type',
      url: '.jobs-search-results__list-item h3 a'
    },
    jsonPaths: ['included', 'data'],
    customParser: null
  },
  
  'indeed': {
    name: 'Indeed',
    baseUrl: 'indeed.com',
    selectors: {
      jobContainer: '.jobsearch-SerpJobCard',
      title: '.jobsearch-SerpJobCard h2 a',
      location: '.jobsearch-SerpJobCard .location',
      department: '.jobsearch-SerpJobCard .company',
      type: '.jobsearch-SerpJobCard .jobsearch-SerpJobCard-footer',
      url: '.jobsearch-SerpJobCard h2 a'
    },
    jsonPaths: ['jobs', 'results'],
    customParser: null
  },
  
  'lever': {
    name: 'Lever',
    baseUrl: 'jobs.lever.co',
    selectors: {
      jobContainer: '.posting',
      title: '.posting-title a',
      location: '.posting-categories .sort-by-location',
      department: '.posting-categories .sort-by-team',
      type: '.posting-categories .sort-by-commitment',
      url: '.posting-title a'
    },
    jsonPaths: ['jobs', 'openings'],
    customParser: null
  }
};

/**
 * Detect job board type from URL
 * @param {string} url - Job board URL
 * @returns {string} Job board type
 */
function detectJobBoardType(url) {
  if (!url || typeof url !== 'string') {
    return 'unknown';
  }
  
  const urlLower = url.toLowerCase();
  
  for (const [type, config] of Object.entries(JOB_BOARD_CONFIGS)) {
    if (urlLower.includes(config.baseUrl)) {
      return type;
    }
  }
  
  return 'unknown';
}

/**
 * Parse jobs using universal parser
 * @param {string} html - Page HTML content
 * @param {string} url - Job board URL (for type detection)
 * @param {string} company - Company name
 * @returns {Array} Array of job information
 */
function parseJobs(html, url, company = 'Unknown') {
  try {
    console.log(`Starting universal job parsing for: ${company}`);
    
    if (!html || typeof html !== 'string') {
      console.log('Invalid HTML content');
      return [];
    }
    
    // Detect job board type
    const boardType = detectJobBoardType(url);
    console.log(`Detected job board type: ${boardType}`);
    
    if (boardType === 'unknown') {
      console.log('Unknown job board type, using generic parsing');
      return parseGenericJobs(html, company);
    }
    
    const config = JOB_BOARD_CONFIGS[boardType];
    
    // Try custom parser first if available
    if (config.customParser) {
      console.log(`Using custom parser: ${config.customParser}`);
      return parseWithCustomParser(html, config.customParser, company);
    }
    
    // Use standard parsing
    return parseWithConfig(html, config, company);
    
  } catch (error) {
    console.error('Error in universal job parsing:', error);
    return [];
  }
}

/**
 * Parse jobs using specific configuration
 * @param {string} html - Page HTML content
 * @param {Object} config - Job board configuration
 * @param {string} company - Company name
 * @returns {Array} Array of job information
 */
function parseWithConfig(html, config, company) {
  try {
    console.log(`Parsing with ${config.name} configuration`);
    
    const jobs = [];
    
    // Try JSON parsing first
    const jsonData = extractJSONData(html, config.jsonPaths);
    if (jsonData) {
      console.log('Found JSON data, parsing...');
      return parseJSONJobs(jsonData, config, company);
    }
    
    // Fallback to HTML parsing
    console.log('No JSON data found, parsing HTML...');
    return parseHTMLJobs(html, config, company);
    
  } catch (error) {
    console.error(`Error parsing with ${config.name} config:`, error);
    return [];
  }
}

/**
 * Extract JSON data from HTML
 * @param {string} html - Page HTML content
 * @param {Array} jsonPaths - Possible JSON paths
 * @returns {Object|null} Extracted JSON data
 */
function extractJSONData(html, jsonPaths) {
  try {
    // Look for script tags with JSON data
    const scriptRegex = /<script[^>]*>(?:[\s\S]*?)(\{[\s\S]*?\})[\s\S]*?<\/script>/gi;
    const matches = html.match(scriptRegex);
    
    if (matches) {
      for (const match of matches) {
        try {
          const jsonMatch = match.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            const cleanJson = jsonStr
              .replace(/^\s*window\.\w+\s*=\s*/, '')
              .replace(/;\s*$/, '');
            
            const data = JSON.parse(cleanJson);
            
            // Check if data contains any of the expected paths
            for (const path of jsonPaths) {
              if (data[path] && Array.isArray(data[path])) {
                console.log(`Found JSON data at path: ${path}`);
                return data;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting JSON data:', error);
    return null;
  }
}

/**
 * Parse jobs from JSON data
 * @param {Object} jsonData - Extracted JSON data
 * @param {Object} config - Job board configuration
 * @param {string} company - Company name
 * @returns {Array} Array of job information
 */
function parseJSONJobs(jsonData, config, company) {
  try {
    const jobs = [];
    
    // Find the job array in the JSON data
    let jobArray = null;
    for (const path of config.jsonPaths) {
      if (jsonData[path] && Array.isArray(jsonData[path])) {
        jobArray = jsonData[path];
        break;
      }
    }
    
    if (!jobArray) {
      console.log('No job array found in JSON data');
      return [];
    }
    
    console.log(`Found ${jobArray.length} jobs in JSON data`);
    
    for (const job of jobArray) {
      if (job && typeof job === 'object') {
        jobs.push({
          title: job.title || job.name || job.position || 'Unknown Position',
          company: company,
          location: job.location || job.office || job.city || 'Remote/Hybrid',
          department: job.department || job.team || job.org || 'Engineering',
          type: job.type || job.employment_type || 'Full-time',
          url: job.url || job.link || job.apply_url || '#',
          source: config.name,
          description: job.description || job.summary || '',
          posted_date: job.posted_date || job.created_at || '',
          remote: job.remote || job.remote_ok || false
        });
      }
    }
    
    return jobs;
    
  } catch (error) {
    console.error('Error parsing JSON jobs:', error);
    return [];
  }
}

/**
 * Parse jobs from HTML using selectors
 * @param {string} html - Page HTML content
 * @param {Object} config - Job board configuration
 * @param {string} company - Company name
 * @returns {Array} Array of job information
 */
function parseHTMLJobs(html, config, company) {
  try {
    const jobs = [];
    
    // Extract job titles
    const titleRegex = new RegExp(`<[^>]*(?:${config.selectors.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})[^>]*>([^<]+)<\/[^>]*>`, 'gi');
    const titles = [];
    let titleMatch;
    while ((titleMatch = titleRegex.exec(html)) !== null) {
      const title = titleMatch[1].trim();
      if (title && title.length > 3 && title.length < 100) {
        titles.push(title);
      }
    }
    
    // If no titles found with specific selector, try generic approach
    if (titles.length === 0) {
      const genericTitleRegex = /<[^>]*(?:title|heading|job[^>]*title)[^>]*>([^<]+)<\/[^>]*>/gi;
      let genericMatch;
      while ((genericMatch = genericTitleRegex.exec(html)) !== null) {
        const title = genericMatch[1].trim();
        if (title && title.length > 3 && title.length < 100) {
          titles.push(title);
        }
      }
    }
    
    // Extract locations
    const locationRegex = new RegExp(`<[^>]*(?:${config.selectors.location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})[^>]*>([^<]+)<\/[^>]*>`, 'gi');
    const locations = [];
    let locationMatch;
    while ((locationMatch = locationRegex.exec(html)) !== null) {
      const location = locationMatch[1].trim();
      if (location && location.length > 2 && location.length < 50) {
        locations.push(location);
      }
    }
    
    // Extract departments
    const deptRegex = new RegExp(`<[^>]*(?:${config.selectors.department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})[^>]*>([^<]+)<\/[^>]*>`, 'gi');
    const departments = [];
    let deptMatch;
    while ((deptMatch = deptRegex.exec(html)) !== null) {
      const dept = deptMatch[1].trim();
      if (dept && dept.length > 2 && dept.length < 50) {
        departments.push(dept);
      }
    }
    
    // Create job objects
    for (let i = 0; i < titles.length; i++) {
      jobs.push({
        title: titles[i],
        company: company,
        location: locations[i] || 'Remote/Hybrid',
        department: departments[i] || 'Engineering',
        type: 'Full-time',
        url: '#',
        source: config.name
      });
    }
    
    console.log(`Parsed ${jobs.length} jobs from HTML`);
    return jobs;
    
  } catch (error) {
    console.error('Error parsing HTML jobs:', error);
    return [];
  }
}

/**
 * Generic job parsing for unknown job board types
 * @param {string} html - Page HTML content
 * @param {string} company - Company name
 * @returns {Array} Array of job information
 */
function parseGenericJobs(html, company) {
  try {
    console.log('Using generic parsing for unknown job board type');
    
    const jobs = [];
    
    // Generic selectors that work for most job boards
    const genericSelectors = [
      'h1', 'h2', 'h3', 'h4',
      '.job-title', '.position-title', '.opening-title',
      '.job-name', '.position-name', '.title',
      'a[href*="job"]', 'a[href*="position"]', 'a[href*="career"]'
    ];
    
    for (const selector of genericSelectors) {
      const regex = new RegExp(`<[^>]*(?:${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})[^>]*>([^<]+)<\/[^>]*>`, 'gi');
      let match;
      while ((match = regex.exec(html)) !== null) {
        const title = match[1].trim();
        if (title && title.length > 3 && title.length < 100) {
          jobs.push({
            title: title,
            company: company,
            location: 'Remote/Hybrid',
            department: 'Engineering',
            type: 'Full-time',
            url: '#',
            source: 'Generic Parser'
          });
        }
      }
    }
    
    // Remove duplicates
    const uniqueJobs = [];
    const seenTitles = new Set();
    
    for (const job of jobs) {
      if (!seenTitles.has(job.title.toLowerCase())) {
        seenTitles.add(job.title.toLowerCase());
        uniqueJobs.push(job);
      }
    }
    
    console.log(`Generic parsing found ${uniqueJobs.length} unique jobs`);
    return uniqueJobs;
    
  } catch (error) {
    console.error('Error in generic parsing:', error);
    return [];
  }
}

/**
 * Parse jobs using custom parser
 * @param {string} html - Page HTML content
 * @param {string} parserName - Name of custom parser function
 * @param {string} company - Company name
 * @returns {Array} Array of job information
 */
function parseWithCustomParser(html, parserName, company) {
  try {
    // This would integrate with custom parsers like parseStripeJobs
    // For now, fall back to generic parsing
    console.log(`Custom parser ${parserName} not implemented, using generic parsing`);
    return parseGenericJobs(html, company);
  } catch (error) {
    console.error(`Error with custom parser ${parserName}:`, error);
    return parseGenericJobs(html, company);
  }
}

/**
 * Add new job board configuration
 * @param {string} type - Job board type identifier
 * @param {Object} config - Job board configuration
 */
function addJobBoardConfig(type, config) {
  JOB_BOARD_CONFIGS[type] = config;
  console.log(`Added job board configuration for: ${type}`);
}

/**
 * Get all supported job board types
 * @returns {Array} Array of supported job board types
 */
function getSupportedJobBoards() {
  return Object.keys(JOB_BOARD_CONFIGS);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseJobs,
    detectJobBoardType,
    addJobBoardConfig,
    getSupportedJobBoards,
    JOB_BOARD_CONFIGS
  };
}

// If in browser environment, add functions to global object
if (typeof window !== 'undefined') {
  window.parseJobs = parseJobs;
  window.detectJobBoardType = detectJobBoardType;
  window.addJobBoardConfig = addJobBoardConfig;
  window.getSupportedJobBoards = getSupportedJobBoards;
  window.JOB_BOARD_CONFIGS = JOB_BOARD_CONFIGS;
}

console.log('Universal job parser loaded');
