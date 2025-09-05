// Add ReadableDate Node for n8n Workflow
// Merges Gmail Get Full Message output with readableDate and emailTime fields
// Place this node between Gmail (Get Full Message) and Job Parser

// Add readableDate to Gmail Get Full Message output
const items = $input.all();

return items.map(item => {
  // Debug: Log all available fields
  console.log('Available fields:', Object.keys(item.json));
  console.log('Full item data:', item.json);
  
  // Try different possible timestamp field names
  let timestamp = null;
  let timestampSource = 'None';
  
  // Check for internalDate first
  if (item.json.internalDate) {
    timestamp = item.json.internalDate;
    timestampSource = 'internalDate';
  }
  // Check for date field
  else if (item.json.date) {
    timestamp = item.json.date;
    timestampSource = 'date';
  }
  // Check for timestamp field
  else if (item.json.timestamp) {
    timestamp = item.json.timestamp;
    timestampSource = 'timestamp';
  }
  // Check for receivedTime field
  else if (item.json.receivedTime) {
    timestamp = item.json.receivedTime;
    timestampSource = 'receivedTime';
  }
  // If no timestamp found, use current time
  else {
    timestamp = Date.now();
    timestampSource = 'Current System Time (Fallback)';
    console.warn('No timestamp field found, using current time');
  }
  
  console.log(`Timestamp source: ${timestampSource}, Value: ${timestamp}`);
  
  // Create date object from timestamp
  let date;
  if (timestampSource === 'date' && typeof timestamp === 'string') {
    // If it's a date string, parse it directly
    date = new Date(timestamp);
  } else {
    // If it's a number, treat it as Unix timestamp
    date = new Date(parseInt(timestamp));
  }
  
  // Validate date and provide fallback
  if (isNaN(date.getTime())) {
    console.warn(`Invalid timestamp: ${timestamp} from ${timestampSource}`);
    return {
      json: {
        ...item.json,
        readableDate: 'Invalid Date',
        emailTime: 'Invalid Date',
        error: `Invalid timestamp: ${timestamp} from ${timestampSource}`,
        availableFields: Object.keys(item.json),
        timestampSource: timestampSource,
        timestampValue: timestamp
      }
    };
  }
  
  return {
    json: {
      ...item.json, // Preserve all Gmail data
      readableDate: date.toLocaleString(),
      emailTime: date.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestampSource: timestampSource,
      timestampValue: timestamp,
      availableFields: Object.keys(item.json)
    }
  };
});
