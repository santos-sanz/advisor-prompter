"use client"

import type React from "react"
import { buildPrompt } from "@/lib/promptTemplate";
// Import the component using dynamic import for client-only code
import dynamic from 'next/dynamic';

// Use dynamic import with ssr: false to ensure client-only rendering
const PdfClient = dynamic(() => import('@/components/pdf-client'), { ssr: false });

import { useState, useRef, useEffect } from "react"
import { Inter } from "next/font/google"
import { CheckCircle, Upload, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

const inter = Inter({ subsets: ["latin"] })

export default function PromptBuilder() {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [goal, setGoal] = useState("")
  const [extraContext, setExtraContext] = useState("")
  const [prompt, setPrompt] = useState("")
  const [sendUpdates, setSendUpdates] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [extractedMarkdown, setExtractedMarkdown] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [promptCollapsed, setPromptCollapsed] = useState(true)

  const handleNextStep = () => {
    // Validate current step requirements before proceeding
    if (step === 1 && !file) {
      toast({
        title: "Missing information",
        description: "Please upload a file first.",
        duration: 3000,
      });
      return;
    }
    
    setFadeOut(true)
    setTimeout(() => {
      setStep(step + 1)
      setFadeOut(false)
    }, 250)
  }

  const handlePrevStep = () => {
    setFadeOut(true)
    setTimeout(() => {
      setStep(step - 1)
      setFadeOut(false)
    }, 250)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const pdfFile = e.target.files[0]
      
      // Validate file type
      if (pdfFile.type !== 'application/pdf') {
        toast({
          title: "Invalid file",
          description: "Please upload a PDF file.",
          duration: 3000,
        });
        return;
      }
      
      // Show loading toast
      toast({
        title: "Processing",
        description: "Extracting content from PDF...",
        duration: 3000,
      });
      
      // Set file immediately - this will trigger PDF extraction via the PdfExtractor component
      setFile(pdfFile);
      setExtractedMarkdown(""); // Clear previous markdown
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const pdfFile = e.dataTransfer.files[0]
      
      // Validate file type
      if (pdfFile.type !== 'application/pdf') {
        toast({
          title: "Invalid file",
          description: "Please upload a PDF file.",
          duration: 3000,
        });
        return;
      }
      
      // Show loading toast
      toast({
        title: "Processing",
        description: "Extracting content from PDF...",
        duration: 3000,
      });
      
      // Set file immediately - this will trigger PDF extraction via the PdfExtractor component
      setFile(pdfFile);
      setExtractedMarkdown(""); // Clear previous markdown
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExtraContext(e.target.value)
    adjustTextareaHeight()
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const copyPrompt = async () => {
    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(prompt)
        toast({
          title: "Prompt copied",
          description: "The prompt has been copied to your clipboard.",
          duration: 3000,
        })
        return
      }
      
      // Fallback to using a temporary textarea element
      const textArea = document.createElement('textarea')
      textArea.value = prompt
      textArea.style.position = 'fixed'  // Avoid scrolling to bottom
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        toast({
          title: "Prompt copied",
          description: "The prompt has been copied to your clipboard.",
          duration: 3000,
        })
      } else {
        throw new Error('Failed to copy')
      }
    } catch (error) {
      // Provide more detailed error information for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Copy failed:', { message: errorMessage, stack: error instanceof Error ? error.stack : null });
      toast({
        title: "Copy failed",
        description: "Please select and copy the text manually (Ctrl+C/Cmd+C).",
        duration: 5000,
      })
    }
  }

  const downloadPrompt = () => {
    const blob = new Blob([prompt], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "generated_prompt.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    // Update prompt in two scenarios:
    // 1. When we have extractedMarkdown and need to prepare for navigation
    // 2. When we reach step 4 (final prompt view)
    if (extractedMarkdown || step === 4) {
      const profileText = extractedMarkdown || (file ? `[Pending processing: ${file.name}]` : "[No CV uploaded]");
      const currentGoal = goal || ""; // Use empty string if goal not selected yet
      setPrompt(buildPrompt(profileText, currentGoal, extraContext));
    }
  }, [step, extractedMarkdown, file, goal, extraContext])

  // Handle PDF extraction results
  const handleExtracted = (markdown: string) => {
    setExtractedMarkdown(markdown);
    toast({
      title: "Success",
      description: "PDF content extracted. You can proceed to the next step.",
      duration: 3000,
    });
  };

  // Handle PDF extraction errors
  const handleExtractionError = (error: Error) => {
    console.error("Error processing PDF:", error);
    toast({
      title: "Processing Error",
      description: error.message || "Could not extract content from PDF.",
      duration: 5000,
    });
  };

  return (
    <div className={`${inter.className} flex min-h-screen flex-col items-center justify-center bg-background p-4`}>
      {/* Client-side only PDF extractor */}
      {file && (
        <PdfClient
          file={file}
          onExtracted={handleExtracted}
          onProcessingChange={setIsProcessing}
        />
      )}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-xl rounded-lg bg-card p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-[#1f1f1f]">
          Advisor Prompter
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          Follow the steps to build your personalized prompt.
        </p>
        <div
          className={`transition-opacity duration-250 ${fadeOut ? "opacity-0" : "opacity-100"}`}
        >
          {step === 1 && (
            <div>
              <h2 className="mb-6 text-center text-xl font-semibold text-[#1f1f1f]">Your details</h2>
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary">
                  <strong>Your privacy is important:</strong> Files are sent securely to our server for processing and are not permanently stored.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1f1f1f]">CV Upload</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf"
                />
                <div
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  onDrop={!isProcessing ? handleDrop : undefined}
                  onDragOver={!isProcessing ? handleDragOver : undefined}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center ${isProcessing ? 'bg-gray-50 border-gray-300' : 'border-[#e5e7eb] cursor-pointer hover:border-[#4f46e5]'}`}
                  style={{ minHeight: 120 }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
                      <span>Processing {file?.name}...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="mb-2 h-8 w-8" />
                      <span>{file ? file.name : "Drag & drop or click to upload your CV (PDF)"}</span>
                    </>
                  )}
                </div>
                {file && !isProcessing && (
                  <div className="mt-4 flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    File uploaded successfully
                  </div>
                )}
                {extractedMarkdown && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2 text-[#1f1f1f]">Extracted Markdown:</label>
                    <pre className="bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap max-h-60 overflow-auto border border-gray-200">{extractedMarkdown}</pre>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={handlePrevStep} disabled>
                  Back
                </Button>
                <Button 
                  onClick={() => {
                    console.log('Next button clicked, file:', file?.name);
                    handleNextStep();
                  }} 
                  disabled={!file}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-6 text-center text-xl font-semibold text-[#1f1f1f]">What's your goal?</h2>
              <div className="mb-6 grid gap-4">
                {[
                  { id: "new-job", title: "Get a new job", desc: "Find opportunities in your field" },
                  { id: "grow", title: "Grow in current role", desc: "Advance your career path" },
                  { id: "learn", title: "Learn a new skill", desc: "Expand your capabilities" },
                ].map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setGoal(option.id)}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors duration-150 ${goal === option.id ? "border-[#4f46e5] bg-[#f0f0ff]" : "border-[#e5e7eb] hover:border-[#c5c6cc]"}`}
                  >
                    <h3 className="font-medium text-[#1f1f1f]">{option.title}</h3>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevStep}>
                  Back
                </Button>
                <Button onClick={handleNextStep} disabled={!goal}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-6 text-center text-xl font-semibold text-[#1f1f1f]">Extra context</h2>
              <div className="mb-2">
                <textarea
                  ref={textareaRef}
                  placeholder="Add any additional details about your situation, preferences, or specific questions you have..."
                  className="w-full resize-none rounded-lg border border-[#e5e7eb] p-3 text-[#1f1f1f] focus:border-[#4f46e5] focus:outline-none"
                  value={extraContext}
                  onChange={handleTextareaChange}
                  rows={4}
                  maxLength={500}
                ></textarea>
                <div className="text-right text-xs text-gray-500">{extraContext.length}/500</div>
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={handlePrevStep}>
                  Back
                </Button>
                <Button onClick={handleNextStep}>Next</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="mb-6 text-center text-xl font-semibold text-[#1f1f1f]">Your personalized prompt</h2>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-[#1f1f1f]">Generated Prompt</h3>
                  <button
                    onClick={() => setPromptCollapsed(!promptCollapsed)}
                    className="text-xs text-[#4f46e5] hover:underline"
                  >
                    {promptCollapsed ? "Show prompt" : "Hide prompt"}
                  </button>
                </div>
                {!promptCollapsed && (
                  <div className="rounded-lg bg-muted border p-4 mb-3">
                    <pre className="whitespace-pre-wrap text-sm">{prompt}</pre>
                  </div>
                )}
              </div>
              <div className="mb-6 flex gap-3">
                <Button onClick={copyPrompt}>Copy prompt</Button>
                <Button variant="outline" onClick={downloadPrompt}>
                  Download
                </Button>
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="updates"
                  checked={sendUpdates}
                  onChange={(e) => setSendUpdates(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#4f46e5] focus:ring-[#4f46e5]"
                />
                <label htmlFor="updates" className="ml-2 text-sm text-[#1f1f1f]">
                  Send me updates
                </label>
              </div>
              {sendUpdates && (
                <div className="mb-4 text-sm text-gray-500">
                  You'll receive updates about new features and improvements.
                </div>
              )}
              <div className="mt-6 text-center text-xs text-gray-500">
                Feedback?{" "}
                <a href="mailto:feedback@example.com" className="text-[#4f46e5]">
                  feedback@example.com
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
