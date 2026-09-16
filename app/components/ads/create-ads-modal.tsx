"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Ad } from "@/libs/interface"

interface CreateAdModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (ad: Omit<Ad, "id" | "createdAt">) => void
  editingAd?: Ad | null
}

export function CreateAdModal({ isOpen, onClose, onSubmit, editingAd }: CreateAdModalProps) {
  const [title, setTitle] = useState(editingAd?.title || "")
  const [websiteUrl, setWebsiteUrl] = useState(editingAd?.websiteUrl || "")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    onSubmit({
      title: title.trim(),
      description: "Create a marketing campaign to attract more customers.",
      websiteUrl: websiteUrl.trim() || undefined,
      imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined,
      status: "active",
    })

    // Reset form
    setTitle("")
    setWebsiteUrl("")
    setImageFile(null)
    onClose()
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        setImageFile(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type.startsWith("image/")) {
        setImageFile(file)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{editingAd ? "Edit ad" : "Create new ad"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ad Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Ads Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a short title"
              className="w-full"
              required
            />
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium text-gray-700">
              Ad Website URL (optional)
            </Label>
            <Input
              id="url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="Website URL"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            {!imageFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload image
                  </Button>
                  <p className="text-sm text-gray-500">or Drag image here</p>
                  <p className="text-xs text-gray-400 italic">(Recommended banner size 1130×250)</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div
                  className="rounded-xl p-6 text-white min-h-[200px] flex flex-col justify-between relative overflow-hidden"
                  style={{
                    backgroundImage: `url(${URL.createObjectURL(imageFile)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 rounded-xl"></div>

                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-3">{title.trim() || "Do more for your Brand!"}</h3>
                    <p className="text-white/90 text-sm leading-relaxed">
                      Create a marketing campaign to attract more customers.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors z-10"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8" disabled={!title.trim()}>
              {editingAd ? "Save Changes" : "Publish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
