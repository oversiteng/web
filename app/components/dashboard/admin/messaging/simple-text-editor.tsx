"use client"

interface SimpleTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SimpleTextEditor({ value, onChange, placeholder = "Start typing..." }: SimpleTextEditorProps) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[300px] p-4 outline-none resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
      />
    </div>
  )
}
