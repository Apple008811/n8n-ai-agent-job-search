// job_parser.js - Parses Gmail (Get Many) output to extract job details from LinkedIn job alerts

const items = $input.all();
const results = [];

for (const item of items) {
  const emailId = item.json.id;
  const emailSubject = item.json.snippet;
  const emailInternalDate = item.json.internalDate;
  
  // Handle missing time converter fields gracefully
  let emailReadableDate = item.json.readableDate;
  let emailTime = item.json.emailTime;
  
  // If time converter fields are missing, create them from internalDate
  if (!emailReadableDate && emailInternalDate) {
    const date = new Date(parseInt(emailInternalDate));
    emailReadableDate = date.toLocaleString();
    emailTime = date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  try {
    // Extract HTML content from Gmail (Get) node output
    let htmlContent = '';
    
    // Check if we have html field directly (Gmail (Get) node format)
    if (item.json.html) {
      htmlContent = item.json.html;
    }
    // Check if we have raw data (base64 encoded)
    else if (item.json.raw) {
      htmlContent = Buffer.from(item.json.raw, 'base64').toString('utf8');
    }
    // Fallback to payload.parts if available
    else if (item.json.payload && item.json.payload.parts) {
      for (const part of item.json.payload.parts) {
        if (part.mimeType === 'text/html' && part.body && part.body.data) {
          htmlContent = Buffer.from(part.body.data, 'base64').toString('utf8');
          break;
        }
      }
    }

    if (!htmlContent) {
      console.warn(`Email ID ${emailId}: No HTML content found in html, raw data, or payload.`);
      results.push({ 
        emailId, 
        error: "No HTML content found in html, raw data, or payload",
        emailSubject,
        emailReadableDate,
        emailTime
      });
      continue;
    }


    // Parse HTML to extract job details
    const jobDetails = [];

    // Updated regex patterns for LinkedIn job alerts
    // Pattern 1: Standard LinkedIn job links (linkedin.com/comm/jobs/view/)
    const jobLinkRegex1 = /<a[^>]*href=["'](https:\/\/www\.linkedin\.com\/comm\/jobs\/view\/[^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    
    // Pattern 2: Alternative LinkedIn job links (linkedin.com/jobs/view/)
    const jobLinkRegex2 = /<a[^>]*href=["'](https:\/\/www\.linkedin\.com\/jobs\/view\/[^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    
    // Pattern 3: Look for job titles in strong tags or other elements near LinkedIn links
    const jobTitleRegex = /<strong[^>]*>([^<]+)<\/strong>[\s\S]*?<a[^>]*href=["'](https:\/\/www\.linkedin\.com\/comm\/jobs\/view\/[^"']+)["'][^>]*>/gi;

    let jobMatch;
    let foundJobs = new Set(); // To avoid duplicates

    // Try pattern 1 first (most common in LinkedIn job alerts)
    while ((jobMatch = jobLinkRegex1.exec(htmlContent)) !== null) {
      const link = jobMatch[1];
      const title = jobMatch[2].replace(/<[^>]*>/g, '').trim();

      if (title && link && !foundJobs.has(link)) {
        foundJobs.add(link);
        
        // Extract work type from context
        let workType = 'Unknown';
        const contextAroundJob = htmlContent.substring(
          Math.max(0, jobMatch.index - 300),
          Math.min(htmlContent.length, jobMatch.index + jobMatch[0].length + 300)
        );

        if (/remote/i.test(contextAroundJob)) {
          workType = 'Remote';
        } else if (/hybrid/i.test(contextAroundJob)) {
          workType = 'Hybrid';
        } else if (/onsite|in-office/i.test(contextAroundJob)) {
          workType = 'Onsite';
        }

        // Extract salary if present
        let salary = '';
        const salaryMatch = contextAroundJob.match(/\$[\d,]+(?:K|k|\d{3})/g);
        if (salaryMatch && salaryMatch.length > 0) {
          salary = salaryMatch[0];
        }

        jobDetails.push({
          jobTitle: title,
          jobLink: link,
          workType: workType,
          salary: salary
        });
      }
    }

    // Try pattern 2 if pattern 1 didn't find anything
    if (jobDetails.length === 0) {
      while ((jobMatch = jobLinkRegex2.exec(htmlContent)) !== null) {
        const link = jobMatch[1];
        const title = jobMatch[2].replace(/<[^>]*>/g, '').trim();

        if (title && link && !foundJobs.has(link)) {
          foundJobs.add(link);
          jobDetails.push({
            jobTitle: title,
            jobLink: link,
            workType: 'Unknown',
            salary: ''
          });
        }
      }
    }

    // Try pattern 3 for job titles in strong tags
    if (jobDetails.length === 0) {
      while ((jobMatch = jobTitleRegex.exec(htmlContent)) !== null) {
        const title = jobMatch[1].trim();
        const link = jobMatch[2];

        if (title && link && !foundJobs.has(link)) {
          foundJobs.add(link);
          jobDetails.push({
            jobTitle: title,
            jobLink: link,
            workType: 'Unknown',
            salary: ''
          });
        }
      }
    }

    // If no specific job links found, log for debugging
    if (jobDetails.length === 0) {
        console.warn(`Email ID ${emailId}: No specific job links found.`);
        results.push({
            emailId,
            error: "No specific job links found",
            emailSubject,
            emailReadableDate,
            emailTime,
            htmlSnippet: htmlContent.substring(0, 1000) // Show HTML snippet for debugging
        });
    } else {
        // Add original email metadata to each job detail
        jobDetails.forEach(job => {
          results.push({
            ...job,
            emailId: emailId,
            emailSubject: emailSubject,
            internalDate: emailInternalDate,
            readableDate: emailReadableDate,
            emailTime: emailTime,
            extractedAt: new Date().toISOString()
          });
        });
    }

  } catch (error) {
    console.error(`Email ID ${emailId}: Error processing email: ${error.message}`);
    results.push({ 
      emailId, 
      error: `Processing error: ${error.message}`,
      emailSubject,
      emailReadableDate,
      emailTime
    });
  }
}

// Wrap results in json format for n8n
return results.map(result => ({ json: result }));