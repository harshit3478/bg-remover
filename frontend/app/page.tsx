"use client"

import { useState, useRef, type ChangeEvent, type DragEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Upload, ImageIcon, RefreshCw, Download } from "lucide-react"
import Image from "next/image"

// Update the API URL to use the environment variable or fallback to the backend service name in Docker
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://backend:5001/api"

export default function Home() {
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null)
  const [bgImage, setBgImage] = useState<File | null>(null)
  const [bgImagePreview, setBgImagePreview] = useState<string | null>(null)
  const [backgroundOption, setBackgroundOption] = useState<"remove" | "change">("remove")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ original: string; processed: string } | null>(null)

  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const bgImageInputRef = useRef<HTMLInputElement>(null)

  const handleMainImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setMainImage(file)
      setMainImagePreview(URL.createObjectURL(file))
    }
  }

  const handleBgImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBgImage(file)
      setBgImagePreview(URL.createObjectURL(file))
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, type: "main" | "bg") => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]

      if (type === "main") {
        setMainImage(file)
        setMainImagePreview(URL.createObjectURL(file))
      } else {
        setBgImage(file)
        setBgImagePreview(URL.createObjectURL(file))
      }
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const simulateProgress = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 90) {
          clearInterval(interval)
          return prevProgress
        }
        return prevProgress + Math.random() * 10
      })
    }, 300)
    return interval
  }

  const processImage = async () => {
    if (!mainImage) return

    setIsProcessing(true)
    const progressInterval = simulateProgress()

    try {
      const formData = new FormData()
      formData.append("image", mainImage)

      if (backgroundOption === "change" && bgImage) {
        formData.append("background", bgImage)
      }

      const response = await fetch(`${API_URL}/remove-background`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setProgress(100)
        setResult({
          original: `${API_URL}/original/${data.original_filename}`,
          processed: `${API_URL}/processed/${data.filename}`,
        })
      } else {
        console.error("Error:", data.error)
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred while processing the image")
    } finally {
      clearInterval(progressInterval)
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setMainImage(null)
    setMainImagePreview(null)
    setBgImage(null)
    setBgImagePreview(null)
    setBackgroundOption("remove")
    setResult(null)
    setProgress(0)
  }

  const downloadImage = () => {
    if (!result) return
    
    // Create a temporary link element
    const link = document.createElement('a')
    link.href = result.processed
    link.download = "processed-image.png" // Explicitly set .png extension
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Background Remover Tool</h1>
        <p className="text-gray-600">Remove or change the background of your images with one click</p>
      </div>

      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Image Upload */}
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  mainImagePreview
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary hover:bg-primary/5"
                }`}
                onClick={() => mainImageInputRef.current?.click()}
                onDrop={(e) => handleDrop(e, "main")}
                onDragOver={handleDragOver}
              >
                <input
                  ref={mainImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMainImageChange}
                />

                {mainImagePreview ? (
                  <div className="relative w-full h-64">
                    <Image src={mainImagePreview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Drag and drop your image here or click to browse</p>
                  </div>
                )}
              </div>
            </div>

            {/* Background Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Background Options</h3>
              <RadioGroup
                value={backgroundOption}
                onValueChange={(value) => setBackgroundOption(value as "remove" | "change")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remove" id="remove" />
                  <Label htmlFor="remove">Remove Background</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="change" id="change" />
                  <Label htmlFor="change">Change Background</Label>
                </div>
              </RadioGroup>

              {backgroundOption === "change" && (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    bgImagePreview
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary hover:bg-primary/5"
                  }`}
                  onClick={() => bgImageInputRef.current?.click()}
                  onDrop={(e) => handleDrop(e, "bg")}
                  onDragOver={handleDragOver}
                >
                  <input
                    ref={bgImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBgImageChange}
                  />

                  {bgImagePreview ? (
                    <div className="relative w-full h-48">
                      <Image
                        src={bgImagePreview || "/placeholder.svg"}
                        alt="Background Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4">
                      <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Drag and drop your background image here or click to browse
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Process Button */}
            <Button
              className="w-full"
              onClick={processImage}
              disabled={!mainImage || (backgroundOption === "change" && !bgImage) || isProcessing}
            >
              {isProcessing ? "Processing..." : "Process Image"}
            </Button>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center text-gray-500">
                  {progress < 100 ? "Processing your image..." : "Almost done!"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Original Image</h3>
                <div className="border rounded-lg p-2 bg-gray-50">
                  <div className="relative w-full h-64">
                    <Image src={result.original || "/placeholder.svg"} alt="Original" fill className="object-contain" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Processed Image</h3>
                <div className="border rounded-lg p-2 bg-[#f5f5f5] bg-grid-small-gray/25">
                  <div className="relative w-full h-64">
                    <Image
                      src={result.processed || "/placeholder.svg"}
                      alt="Processed"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={downloadImage} variant="default">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Process New Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

