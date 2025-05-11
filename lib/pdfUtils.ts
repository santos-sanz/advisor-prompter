"use client";

// Only import PDF.js when in a browser environment
let pdfjsLib: any = null;

// Initialize PDF.js only in browser environment
async function initPdfLib() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!pdfjsLib) {
    // Dynamic import to ensure this only happens client-side
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
    pdfjsLib = pdfjs;
    
    // Set worker source
    const pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.entry');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }
  
  return pdfjsLib;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF extraction can only be done in a browser environment');
    }
    
    // Initialize the PDF library
    const pdfjs = await initPdfLib();
    if (!pdfjs) {
      throw new Error('Failed to initialize PDF.js');
    }
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Variable to hold all the text content
    let fullText = '';
    
    // Get the number of pages in the PDF
    const numPages = pdf.numPages;
    
    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// Convert raw text to basic markdown format
export function textToMarkdown(text: string): string {
  if (!text) return '';
  
  // Remove excessive whitespace
  let markdown = text.replace(/\n\s*\n/g, '\n\n');
  markdown = markdown.trim();
  
  // Split into lines for processing
  const lines = markdown.split('\n');
  const processedLines = lines.map(line => {
    // Clean the line
    line = line.trim();
    if (!line) return '';
    
    // Try to detect headings (all caps, short lines)
    if (line.length < 50 && line === line.toUpperCase() && 
        !line.match(/^[\d\s.,\-_!?;:'"`~@#$%^&*()\[\]{}|/<>+="]+$/)) {
      return `## ${line}`;
    }
    
    // Try to detect list items
    if (line.match(/^\s*[-•*]\s+/)) {
      return `- ${line.replace(/^\s*[-•*]\s+/, '')}`;
    }
    
    // Try to detect numbered lists
    if (line.match(/^\s*\d+[.):]\s+/)) {
      return `- ${line.replace(/^\s*\d+[.):]\s+/, '')}`;
    }
    
    return line;
  });
  
  return processedLines.join('\n');
}
