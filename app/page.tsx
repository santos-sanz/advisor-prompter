"use client"

import type React from "react"
import { buildPrompt } from "@/lib/promptTemplate";
import dynamic from 'next/dynamic';

const PdfClient = dynamic(() => import('@/components/pdf-client'), { ssr: false });

import { useState, useRef, useEffect } from "react"
import { Inter } from "next/font/google"
import { CheckCircle, Upload, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { TallyScript } from "@/components/tally-script"

const inter = Inter({ subsets: ["latin"] })

export default function PromptBuilder() {
  // Theme toggle button fixed at top left
  const themeToggle = (
    <div className="fixed top-4 left-4 z-50">
      <ThemeToggle />
    </div>
  );
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
const [extractedExpanded, setExtractedExpanded] = useState(false)
const [outputLanguage, setOutputLanguage] = useState('en') // Default: English

  const handleNextStep = () => {
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
      if (pdfFile.type !== 'application/pdf') {
        toast({
          title: "Invalid file",
          description: "Please upload a PDF file.",
          duration: 3000,
        });
        return;
      }
      toast({
        title: "Processing",
        description: "Extracting content from PDF...",
        duration: 3000,
      });
      setFile(pdfFile);
      setExtractedMarkdown("");
      setExtractedExpanded(false);
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const pdfFile = e.dataTransfer.files[0]
      if (pdfFile.type !== 'application/pdf') {
        toast({
          title: "Invalid file",
          description: "Please upload a PDF file.",
          duration: 3000,
        });
        return;
      }
      toast({
        title: "Processing",
        description: "Extracting content from PDF...",
        duration: 3000,
      });
      setFile(pdfFile);
      setExtractedMarkdown("");
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
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(prompt)
        toast({
          title: "Prompt copied",
          description: "The prompt has been copied to your clipboard.",
          duration: 3000,
        })
        return
      }
      const textArea = document.createElement('textarea')
      textArea.value = prompt
      textArea.style.position = 'fixed'
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
    if (extractedMarkdown || step === 4) {
      const profileText = extractedMarkdown || (file ? `[Pending processing: ${file.name}]` : "[No CV uploaded]");
      const currentGoal = goal || "";
      setPrompt(buildPrompt(profileText, currentGoal, extraContext));
    }
  }, [step, extractedMarkdown, file, goal, extraContext])

  const handleExtracted = (markdown: string) => {
    setExtractedMarkdown(markdown);
    // No toast on successful extraction
  };

  const handleExtractionError = (error: Error) => {
    console.error("Error processing PDF:", error);
    toast({
      title: "Processing Error",
      description: error.message || "Could not extract content from PDF.",
      duration: 5000,
    });
  };

  return (
    <>
      <TallyScript />
      {themeToggle}
      <div className={`${inter.className} flex min-h-screen flex-col items-center justify-center bg-background px-1 py-4 sm:p-4`}>
        {/* Client-side only PDF extractor */}
        {file && (
          <PdfClient
            file={file}
            onExtracted={handleExtracted}
            onProcessingChange={setIsProcessing}
          />
        )}
        <div className="w-[92%] max-w-md mx-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-xl bg-white shadow-lg p-4 sm:p-6 md:p-8">
          <div className="mb-8 flex items-center justify-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-foreground">Career Prompt Builder</h1>
          </div>
          {step === 1 && (
            <div>
              <h2 className="mb-4 sm:mb-6 text-center text-lg sm:text-xl font-semibold text-foreground">Your details</h2>
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary">
                  <strong>Your privacy is important:</strong> Files are processed locally in your browser and never sent to a server.
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
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-4 sm:p-6 transition hover:border-primary"
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
                  <div className="mt-4 flex items-center text-success">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    File uploaded successfully
                  </div>
                )}
                {extractedMarkdown && (
  <div className="mt-4">
    <label
      className="block text-sm font-medium mb-2 text-foreground cursor-pointer select-none"
      onClick={() => setExtractedExpanded((v) => !v)}
      aria-expanded={extractedExpanded}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExtractedExpanded(v => !v) }}
      style={{ userSelect: 'none' }}
    >
      Extracted Markdown: <span className="ml-1 text-xs text-muted-foreground">[{extractedExpanded ? 'collapse' : 'expand'}]</span>
    </label>
    {extractedExpanded && (
      <pre
        className="bg-muted p-2 rounded text-xs whitespace-pre-wrap border border-border transition-all duration-200 max-h-60 overflow-auto"
      >
        {extractedMarkdown}
      </pre>
    )}
  </div>
)}
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={handlePrevStep} disabled>
                  Back
                </Button>
                <Button 
                  onClick={handleNextStep}
                  disabled={!file}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-6 text-center text-xl font-semibold text-foreground">What's your goal?</h2>
              <div className="mb-6 grid gap-4">
                {[
                  { id: "new-job", title: "Get a new job", desc: "Find opportunities in your field" },
                  { id: "grow", title: "Grow in current role", desc: "Advance your career path" },
                  { id: "learn", title: "Learn a new skill", desc: "Expand your capabilities" },
                ].map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setGoal(option.id)}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors duration-150 ${goal === option.id ? "border-primary bg-muted" : "border-border hover:border-primary/40"}`}
                  >
                    <h3 className="font-medium text-foreground">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.desc}</p>
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
    <h2 className="mb-6 text-center text-xl font-semibold text-foreground">Extra context</h2>
    <div className="mb-4">
      <label htmlFor="output-language" className="block text-sm font-medium mb-2 text-foreground">Output language</label>
      <select
        id="output-language"
        className="w-full rounded-lg border border-border p-2 text-foreground bg-background focus:border-primary focus:outline-none"
        value={outputLanguage}
        onChange={e => setOutputLanguage(e.target.value)}
      >
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="it">Italian</option>
        <option value="pt">Portuguese</option>
        <option value="zh">Chinese (Simplified)</option>
        <option value="ja">Japanese</option>
        <option value="ko">Korean</option>
        <option value="ru">Russian</option>
        <option value="ar">Arabic</option>
        <option value="hi">Hindi</option>
        <option value="tr">Turkish</option>
        <option value="pl">Polish</option>
        <option value="nl">Dutch</option>
        <option value="sv">Swedish</option>
        <option value="fi">Finnish</option>
        <option value="no">Norwegian</option>
        <option value="da">Danish</option>
        <option value="el">Greek</option>
        <option value="he">Hebrew</option>
        <option value="th">Thai</option>
        <option value="cs">Czech</option>
        <option value="hu">Hungarian</option>
        <option value="ro">Romanian</option>
        <option value="bg">Bulgarian</option>
        <option value="uk">Ukrainian</option>
        <option value="id">Indonesian</option>
        <option value="vi">Vietnamese</option>
        <option value="ms">Malay</option>
        <option value="fa">Persian</option>
        <option value="sr">Serbian</option>
        <option value="hr">Croatian</option>
        <option value="sk">Slovak</option>
        <option value="sl">Slovenian</option>
        <option value="lt">Lithuanian</option>
        <option value="lv">Latvian</option>
        <option value="et">Estonian</option>
        <option value="ta">Tamil</option>
        <option value="bn">Bengali</option>
        <option value="fil">Filipino</option>
        <option value="sw">Swahili</option>
        <option value="ca">Catalan</option>
        <option value="eu">Basque</option>
        <option value="gl">Galician</option>
        <option value="mt">Maltese</option>
      </select>
    </div>
    <div className="mb-2">
      <textarea
        ref={textareaRef}
        placeholder="Add any additional details about your situation, preferences, or specific questions you have..."
        className="w-full max-w-full resize-none rounded-lg border border-border p-2 sm:p-3 text-foreground focus:border-primary focus:outline-none box-border"
        value={extraContext}
        onChange={handleTextareaChange}
        rows={4}
        maxLength={500}
        style={{ overflowX: 'hidden' }}
      ></textarea>
      <div className="text-right text-xs text-muted-foreground">{extraContext.length}/500</div>
    </div>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={handlePrevStep} className="min-w-[80px] h-10">
                  Back
                </Button>
                <Button onClick={handleNextStep} className="min-w-[80px] h-10">Next</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="mb-6 text-center text-xl font-semibold text-foreground">Your personalized prompt</h2>
<div className="mb-4 text-center text-base text-muted-foreground">
  <strong>Tip:</strong> For the best results, copy and paste this prompt into a DeepResearch-capable AI tool such as <b>ChatGPT</b>, <b>Claude</b>, <b>Grok</b>, <b>Perplexity</b>, <b>Gemini</b>, or <b>Le Chat</b>.
</div>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-foreground">Generated Prompt</h3>
                  <button
                    type="button"
                    onClick={() => setPromptCollapsed(!promptCollapsed)}
                    className="text-xs text-primary hover:underline"
                  >
                    {promptCollapsed ? "Show prompt" : "Hide prompt"}
                  </button>
                </div>
                {!promptCollapsed && (
                  <div className="rounded-lg bg-muted border-border border p-4 mb-3">
                    <pre className="whitespace-pre-wrap text-sm">{prompt}</pre>
                  </div>
                )}
              </div>
              <div className="mb-6 flex flex-wrap gap-3 justify-center sm:justify-start">
                <Button onClick={copyPrompt} className="min-w-[120px] h-10">Copy prompt</Button>
                <Button variant="outline" onClick={downloadPrompt} className="min-w-[120px] h-10">
                  Download
                </Button>
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="updates"
                  checked={sendUpdates}
                  onChange={(e) => setSendUpdates(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="updates" className="ml-2 text-sm text-foreground">
                  Send me updates
                </label>
              </div>
              {sendUpdates && (
                <div className="mb-4">
                  <iframe 
                    src="https://tally.so/embed/wQXWD7?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1" 
                    loading="lazy" 
                    width="100%" 
                    height={120} 
                    frameBorder="0" 
                    title="Email - CPB"
                    style={{ margin: 0, border: 0 }}>
                  </iframe>
                </div>
              )}
              <div className="mt-6 text-center text-xs text-muted-foreground">
                Feedback?{" "}
                <a href="mailto:andres@theemptylab.com" className="text-primary">
                  andres@theemptylab.com
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
