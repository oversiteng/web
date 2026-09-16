"use client"

import { useState } from "react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  ImageIcon,
  List,
  ListOrdered,
  AlignLeft,
  Undo,
  Redo,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder = "Start typing..." }: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false)

  const formatButtons = [
    { icon: Bold, command: "bold", title: "Bold" },
    { icon: Italic, command: "italic", title: "Italic" },
    { icon: Underline, command: "underline", title: "Underline" },
    { icon: Strikethrough, command: "strikethrough", title: "Strikethrough" },
    { icon: Link, command: "link", title: "Insert Link" },
    { icon: ImageIcon, command: "image", title: "Insert Image" },
    { icon: List, command: "bulletList", title: "Bullet List" },
    { icon: ListOrdered, command: "orderedList", title: "Numbered List" },
    { icon: AlignLeft, command: "align", title: "Align Text" },
  ]

  const historyButtons = [
    { icon: Undo, command: "undo", title: "Undo" },
    { icon: Redo, command: "redo", title: "Redo" },
  ]

  const handleFormat = (command: string) => {
    document.execCommand(command, false)
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 mr-4">
            {formatButtons.map((button) => {
              const Icon = button.icon
              return (
                <button
                  key={button.command}
                  type="button"
                  onClick={() => handleFormat(button.command)}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title={button.title}
                >
                  <Icon className="w-4 h-4 text-gray-600" />
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-1">
            {historyButtons.map((button) => {
              const Icon = button.icon
              return (
                <button
                  key={button.command}
                  type="button"
                  onClick={() => handleFormat(button.command)}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title={button.title}
                >
                  <Icon className="w-4 h-4 text-gray-600" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        contentEditable
        className={`min-h-[300px] p-4 outline-none ${!value && !isFocused ? "text-gray-400" : "text-gray-900"}`}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false)
          onChange(e.currentTarget.textContent || "")
        }}
        onInput={(e) => onChange(e.currentTarget.textContent || "")}
        suppressContentEditableWarning={true}
      >
        {!value && !isFocused && placeholder}
      </div>
    </div>
  )
}
