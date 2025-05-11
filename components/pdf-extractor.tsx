"use client";

import React, { useState } from 'react';
import { extractTextFromPdf, textToMarkdown } from '@/lib/pdfUtils';
import { Loader2 } from 'lucide-react';

interface PdfExtractorProps {
  onExtracted: (markdown: string) => void;
  onError: (error: Error) => void;
  onProcessingChange: (isProcessing: boolean) => void;
  file: File | null;
}

export function PdfExtractor({ file, onExtracted, onError, onProcessingChange }: PdfExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false);

  React.useEffect(() => {
    async function processFile() {
      if (!file) return;
      
      try {
        setIsExtracting(true);
        onProcessingChange(true);
        
        // Extract text from PDF using client-side processing
        const extractedText = await extractTextFromPdf(file);
        
        // Convert text to markdown format
        const markdown = textToMarkdown(extractedText);
        
        console.log('Extracted markdown, length:', markdown.length);
        onExtracted(markdown);
      } catch (err) {
        console.error("Error processing PDF:", err);
        onError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsExtracting(false);
        onProcessingChange(false);
      }
    }

    if (file) {
      processFile();
    }
  }, [file, onExtracted, onError, onProcessingChange]);

  // This component doesn't render anything visible
  return null;
}
