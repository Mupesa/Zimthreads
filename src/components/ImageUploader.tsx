import React, { useState, useRef } from "react"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import { CheckIcon, CloseIcon } from "@/components/Icons"

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
  helperText?: string
  compact?: boolean
}

export default function ImageUploader({
  value,
  onChange,
  folder = "zimthreads/products",
  label = "Product Image",
  helperText = "PNG, JPG, WEBP, or SVG up to 10MB",
  compact = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<"upload" | "url">("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0])
    }
  }

  const processFile = async (file: File) => {
    // 1. Validation
    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please select a valid image file (PNG, JPG, WEBP, or SVG).",
      )
      return
    }

    const MAX_SIZE_MB = 10
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(
        `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is ${MAX_SIZE_MB}MB.`,
      )
      return
    }

    setErrorMessage(null)
    setIsUploading(true)
    setUploadProgress(
      `Uploading ${file.name} (${(file.size / 1024).toFixed(0)} KB)...`,
    )

    try {
      const result = await uploadImageToCloudinary(file, { folder })
      // Use the auto-optimized CDN URL
      onChange(result.cdnUrl || result.secure_url)
      setUploadProgress("")
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          "Failed to upload image to Cloudinary. Please try again.",
      )
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCopyUrl = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard fallback
    }
  }

  const handleClear = () => {
    onChange("")
    setErrorMessage(null)
  }

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
          {label}
        </label>
        <div className="flex items-center gap-1 bg-[#111827] p-0.5 border border-[#374151]">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
              mode === "upload"
                ? "bg-[#4a5c2d] text-white"
                : "text-[#9ca3af] hover:text-white"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
              mode === "url"
                ? "bg-[#4a5c2d] text-white"
                : "text-[#9ca3af] hover:text-white"
            }`}
          >
            Direct URL
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <div>
          <input
            type="url"
            placeholder="https://res.cloudinary.com/..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#111827] border border-[#374151] px-3 py-2 text-white placeholder-[#6b7280] focus:border-[#86a84e] outline-none transition-colors"
          />
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#86a84e] bg-[#4a5c2d]/20 scale-[0.99]"
                : "border-[#374151] bg-[#111827]/80 hover:border-[#6b7280] hover:bg-[#111827]"
            } ${compact ? "py-3" : "py-5"}`}
          >
            {isUploading ? (
              <div className="space-y-2 py-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#86a84e] border-t-transparent animate-spin" />
                <div className="text-[11px] font-bold text-[#86a84e] uppercase tracking-wider">
                  Uploading to Cloudinary CDN
                </div>
                <div className="text-[10px] text-[#9ca3af] truncate max-w-xs mx-auto">
                  {uploadProgress}
                </div>
                <div className="w-48 h-1 bg-[#1f2937] rounded-full mx-auto overflow-hidden">
                  <div className="w-full h-full bg-[#86a84e] animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#1f2937] border border-[#374151] flex items-center justify-center text-[#86a84e]">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-white">
                  Drop image here or{" "}
                  <span className="text-[#86a84e] underline">browse</span>
                </div>
                <div className="text-[9px] text-[#6b7280] uppercase tracking-widest">
                  {helperText}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-2 bg-red-950/60 border border-red-800 text-red-300 text-[10px] flex items-center justify-between gap-2">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Image Preview Card */}
      {value && (
        <div className="p-2.5 bg-[#111827] border border-[#374151] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-12 h-12 bg-black border border-[#374151] shrink-0 overflow-hidden flex items-center justify-center">
              <img
                src={value}
                alt="Upload preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback broken image styling
                  ;(e.target as HTMLElement).style.display = "none"
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  {value.includes("cloudinary.com")
                    ? "Cloudinary CDN"
                    : "Active Image"}
                </span>
              </div>
              <div className="text-[9px] text-[#9ca3af] truncate max-w-[200px] sm:max-w-xs font-mono">
                {value}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyUrl}
              className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors border ${
                copied
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                  : "bg-[#1f2937] border-[#374151] text-[#9ca3af] hover:text-white hover:border-[#6b7280]"
              }`}
              title="Copy URL to clipboard"
            >
              {copied ? "Copied!" : "Copy URL"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 bg-[#1f2937] border border-[#374151] text-[#9ca3af] hover:text-red-400 hover:border-red-900 transition-colors"
              title="Remove image"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
