// test_current_state.js - Test current HTTP Request connection before making changes

const items = $input.all();
const results = [];

console.log('=== TEST: Current HTTP Request Connection State ===');
console.log('Total items received:', items.length);

if (items.length > 0) {
  const firstItem = items[0];
  console.log('First item structure:');
  console.log('Keys:', Object.keys(firstItem));
  
  if (firstItem.json) {
    console.log('First item json keys:', Object.keys(firstItem.json));
    
    // Check what data we actually have
    if (firstItem.json.id) {
      console.log('Email ID:', firstItem.json.id);
    }
    
    if (firstItem.json.snippet) {
      console.log('Snippet:', firstItem.json.snippet.substring(0, 100));
    }
    
    if (firstItem.json.payload) {
      console.log('Payload exists:', !!firstItem.json.payload);
      console.log('Payload keys:', Object.keys(firstItem.json.payload));
      
      if (firstItem.json.payload.parts) {
        console.log('Payload parts count:', firstItem.json.payload.parts.length);
      }
    }
    
    if (firstItem.json.raw) {
      console.log('Raw field exists, length:', firstItem.json.raw.length);
    }
    
    // Check for time converter fields
    if (firstItem.json.readableDate) {
      console.log('Readable date:', firstItem.json.readableDate);
    }
    
    if (firstItem.json.emailTime) {
      console.log('Email time:', firstItem.json.emailTime);
    }
  }
}

// For each item, create a summary
for (const item of items) {
  const summary = {
    emailId: item.json.id || 'unknown',
    hasPayload: !!(item.json.payload),
    hasRaw: !!(item.json.raw),
    hasSnippet: !!(item.json.snippet),
    hasTimeFields: !!(item.json.readableDate && item.json.emailTime),
    payloadPartsCount: item.json.payload && item.json.payload.parts ? item.json.payload.parts.length : 0,
    rawLength: item.json.raw ? item.json.raw.length : 0,
    snippet: item.json.snippet ? item.json.snippet.substring(0, 50) + '...' : 'none'
  };
  
  results.push(summary);
}

console.log('=== TEST: Summary ===');
results.forEach((result, i) => {
  console.log(`Item ${i + 1}:`, result);
});

// Return results for n8n
return results.map(result => ({ json: result }));
