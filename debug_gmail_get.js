// debug_gmail_get.js - Debug Gmail (Get) node output structure

const items = $input.all();
const results = [];

console.log('=== DEBUG: Gmail (Get) Node Output Structure ===');
console.log('Total items received:', items.length);

if (items.length > 0) {
  const firstItem = items[0];
  console.log('First item structure:');
  console.log('Top level keys:', Object.keys(firstItem));
  
  if (firstItem.json) {
    console.log('First item json keys:', Object.keys(firstItem.json));
    
    // Check for raw field
    if (firstItem.json.raw) {
      console.log('Raw field exists, length:', firstItem.json.raw.length);
      console.log('Raw field type:', typeof firstItem.json.raw);
      console.log('Raw field first 100 chars:', firstItem.json.raw.substring(0, 100));
    } else {
      console.log('Raw field does NOT exist');
    }
    
    // Check for payload
    if (firstItem.json.payload) {
      console.log('Payload exists:', !!firstItem.json.payload);
      console.log('Payload keys:', Object.keys(firstItem.json.payload));
      
      if (firstItem.json.payload.parts) {
        console.log('Payload parts count:', firstItem.json.payload.parts.length);
        firstItem.json.payload.parts.forEach((part, i) => {
          console.log(`Part ${i}:`, {
            mimeType: part.mimeType,
            hasBody: !!part.body,
            hasData: !!(part.body && part.body.data)
          });
        });
      }
    } else {
      console.log('Payload does NOT exist');
    }
    
    // Check other fields
    console.log('Email ID:', firstItem.json.id);
    console.log('Snippet:', firstItem.json.snippet ? firstItem.json.snippet.substring(0, 100) : 'none');
    console.log('Size estimate:', firstItem.json.sizeEstimate);
  }
}

// Create summary for each item
for (const item of items) {
  const summary = {
    emailId: item.json.id || 'unknown',
    hasRaw: !!(item.json.raw),
    hasPayload: !!(item.json.payload),
    rawLength: item.json.raw ? item.json.raw.length : 0,
    payloadPartsCount: item.json.payload && item.json.payload.parts ? item.json.payload.parts.length : 0,
    sizeEstimate: item.json.sizeEstimate || 0,
    snippet: item.json.snippet ? item.json.snippet.substring(0, 50) + '...' : 'none'
  };
  
  results.push(summary);
}

console.log('=== DEBUG: Summary ===');
results.forEach((result, i) => {
  console.log(`Item ${i + 1}:`, result);
});

// Return results for n8n
return results.map(result => ({ json: result }));
