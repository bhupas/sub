// Utility function to strip HTML tags and convert to plain text
function stripHtml(html) {
    // Return empty string if html is null or undefined
    if (!html) return '';
    
    // Create a temporary div element
    const tempDiv = document.createElement('div');
    
    // Set the HTML content
    tempDiv.innerHTML = html;
    
    // Convert bullet points to dashes for better readability
    const listItems = tempDiv.querySelectorAll('li');
    listItems.forEach(item => {
      item.textContent = '- ' + item.textContent;
    });
    
    // Add line breaks for paragraphs and lists
    const paragraphs = tempDiv.querySelectorAll('p, ul, ol');
    paragraphs.forEach(p => {
      if (p.nextElementSibling) {
        p.insertAdjacentText('beforeend', '\n\n');
      }
    });
    
    // Get the text content
    let text = tempDiv.textContent || '';
    
    // Clean up extra whitespace but preserve line breaks
    text = text.replace(/[ \t]+/g, ' ');
    
    // Handle line breaks better
    text = text.replace(/\n[ \t]+/g, '\n');
    
    // Replace multiple consecutive line breaks with just two
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text;
  }
  
  // Make the function available globally
  window.stripHtml = stripHtml;