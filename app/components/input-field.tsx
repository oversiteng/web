import type React from "react"
import { forwardRef } from "react"

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string
	error?: string
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
	({ label, error, className = "", ...props }, ref) => {
		return (
			<div className="flex flex-col gap-[0.375rem]">
				<label className="block text-sm font-medium text-gray-700">{label}</label>
				<input
					ref={ref}
					className={`w-full text-black max-h-[2.75rem] px-3 py-3 md:py-4 rounded-lg focus:outline-none placeholder-[#A4A8AF] font-normal text-sm md:text-base ${error ? "border-2 border-[#FC3B3B] focus:border-[#FC3B3B]" : "border border-[#D0D5DD] focus:border-green-500"
						} ${className}`}
					{...props}
				/>
				{error && <p className="text-[#FC3B3B] text-sm">{error}</p>}
			</div>
		)
	},
)

InputField.displayName = "InputField"
