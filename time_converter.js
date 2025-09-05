// Time Converter for Gmail Email Processing
// Converts Unix timestamps to readable date formats for n8n workflow

// Convert Unix timestamp to readable format
const items = $input.all();

return items.map(item => {
  const timestamp = item.json.internalDate;
  const date = new Date(parseInt(timestamp));
  
  return {
    json: {
      ...item.json,
      readableDate: date.toLocaleString(),
      emailTime: date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: timestamp
    }
  };
});
