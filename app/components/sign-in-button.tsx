"use client"

interface SignInButtonProps {
	label: string
	isLoadingText?: string
	isLoading?: boolean
	disabled?: boolean
	onClick?: () => void
}

export function SignInButton({ isLoading = false, isLoadingText, disabled, onClick, label }: SignInButtonProps) {
	return (
		<button
			type="submit"
			onClick={onClick}
			disabled={isLoading ?? disabled}
			className="w-full bg-[#448C74] hover:bg-[#448c74db] disabled:bg-[#55a98d] text-white font-medium py-[0.625rem] rounded-lg transition-colors focus:outline-none text-sm md:text-base h-[2.75rem]"
		>
			{isLoading ? isLoadingText : label}
		</button>
	)
}
