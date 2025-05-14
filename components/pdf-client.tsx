"use client";

import React, { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

// Define a type for PDF.js global object
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PdfClientProps {
  file: File | null;
  onExtracted: (markdown: string) => void;
  onProcessingChange: (isProcessing: boolean) => void;
}

// Helper function to convert plain text to simple markdown
function convertToMarkdown(text: string): string {
  // Simple conversion - can be enhanced as needed
  const lines = text.split('\n').filter(line => line.trim() !== '');
  let markdown = '';
  let inList = false;

  for (const line of lines) {
    // Check if line could be a heading (all caps, short line)
    if (line.toUpperCase() === line && line.length < 50 && line.length > 3) {
      markdown += `\n## ${line}\n`;
    } 
    // Check if line could be a list item
    else if (line.trim().match(/^\d+\.\s/) || line.trim().match(/^[\-\*]\s/)) {
      markdown += `${line}\n`;
      inList = true;
    }
    // End of list
    else if (inList && line.trim() === '') {
      markdown += '\n';
      inList = false;
    }
    // Regular paragraph
    else {
      markdown += `${line}\n\n`;
    }
  }

  return markdown;
}

export default function PdfClient({ file, onExtracted, onProcessingChange }: PdfClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);

  // Function to safely load PDF.js and worker
  const loadPdfJs = async () => {
    // First, check if already loaded
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      setPdfJsLoaded(true);
      return true; // Already loaded
    }

    try {
      // Use the latest stable version for both the library and worker (v3.11.174)
      const PDF_VERSION = '3.11.174';
      
      // First load the main library
      const pdfScript = document.createElement('script');
      pdfScript.src = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_VERSION}/build/pdf.min.js`;
      pdfScript.async = true;
      
      // Wait for main script to load
      await new Promise((resolve, reject) => {
        pdfScript.onload = resolve;
        pdfScript.onerror = reject;
        document.head.appendChild(pdfScript);
      });
      
      // Then load the worker (needs to be done after main script)
      // This step is crucial - avoids the Object.defineProperty error
      if (window.pdfjsLib) {
        // Load the worker script
        const workerScript = document.createElement('script');
        workerScript.src = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_VERSION}/build/pdf.worker.min.js`;
        workerScript.async = true;
        
        await new Promise((resolve, reject) => {
          workerScript.onload = resolve;
          workerScript.onerror = reject;
          document.head.appendChild(workerScript);
        });
        
        // Set worker location
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_VERSION}/build/pdf.worker.min.js`;
        
        setPdfJsLoaded(true);
        return true;
      } else {
        console.error('PDF.js library failed to load properly');
        return false;
      }
    } catch (error) {
      console.error('Error loading PDF.js:', error);
      return false;
    }
  };

  // Load PDF.js when component mounts
  useEffect(() => {
    loadPdfJs();
  }, []);

  useEffect(() => {
    async function extractPdfContent() {
      if (!file) return;
      
      try {
        setIsLoading(true);
        onProcessingChange(true);
        
        // Make sure PDF.js is loaded before proceeding
        if (!pdfJsLoaded) {
          const loaded = await loadPdfJs();
          if (!loaded) {
            throw new Error('Failed to load PDF.js library');
          }
        }
        
        // Double-check that PDF.js is actually loaded
        if (typeof window === 'undefined' || !window.pdfjsLib) {
          throw new Error('PDF.js library not loaded');
        }
        
        // Validate file type
        if (file.type !== 'application/pdf') {
          throw new Error('Uploaded file is not a valid PDF document');
        }
        
        setIsLoading(true);
        onProcessingChange(true);
        
        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Load the PDF document
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        // Extract text from all pages
        let fullText = '';
        const numPages = pdf.numPages;
        
        for (let i = 1; i <= numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Make sure textContent.items exists and is an array before mapping
            if (textContent && Array.isArray(textContent.items)) {
              const pageText = textContent.items
                .map((item: any) => (item && typeof item.str === 'string') ? item.str : '')
                .join(' ');
              
              fullText += pageText + '\n\n';
            } else {
              console.warn(`Page ${i}: Invalid text content structure`, textContent);
              fullText += `[Could not extract text from page ${i}]\n\n`;
            }
          } catch (pageError) {
            console.warn(`Error extracting text from page ${i}:`, pageError);
            fullText += `[Error extracting page ${i}]\n\n`;
            // Continue with next page instead of failing completely
          }
        }
        
        // Convert to basic markdown
        const markdown = convertToMarkdown(fullText);
        onExtracted(markdown);
        
        toast({
          title: "Success",
          description: "PDF content extracted successfully.",
          duration: 3000,
        });
      } catch (error) {
        // Provide more detailed error information for debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error extracting PDF content:', { message: errorMessage, error });
        toast({
          title: "Error",
          description: `Failed to extract PDF content: ${errorMessage}`,
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
        onProcessingChange(false);
      }
    }

    if (file) {
      extractPdfContent();
    }
  }, [file, onExtracted, onProcessingChange, pdfJsLoaded]);


  // This component doesn't render any UI elements
  return null;
}
