"use client"

import { useState } from "react"
import { Edit2, ChevronDown, LucideVerified } from "lucide-react"
import Image from "next/image"

interface AccountPageProps {
	level?: string
}

export default function AccountPage({ level = "user" }: AccountPageProps) {
	const [isEditing, setIsEditing] = useState({
		personal: false,
		education: false,
		password: false,
		bank: false,
	})

	const [showPassword, setShowPassword] = useState({
		current: false,
		new: false,
		confirm: false,
	})

	const [formData, setFormData] = useState({
		firstName: "Timothy",
		lastName: "Daniels",
		username: "Tim",
		email: "hello@oversite.com",
		phoneNumber: "08123456789",
		countryCode: "+234",
		identityEducationQualification: "Bsc",
		identityVerificationMethod: "Adekunle",
		relationship: "Cousin",
		idNumber: "Id:",
		bankAccountName: "",
		bankAccountNumber: "",
		bankName: "",
		identityAddress: "22, Omotayo Ojo Street, Ikeja, Lagos, Nigeria",
		emergencyPhoneNumber: "08123456789",
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	})

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	const toggleEdit = (section: "personal" | "education" | "password" | "bank") => {
		setIsEditing((prev) => ({ ...prev, [section]: !prev[section] }))
	}

	const cancelEdit = (section: "personal" | "education" | "password" | "bank") => {
		setIsEditing((prev) => ({ ...prev, [section]: false }))
		// Here you would reset form data to original values
	}

	const saveChanges = (section: "personal" | "education" | "password" | "bank") => {
		setIsEditing((prev) => ({ ...prev, [section]: false }))
		// Here you would save the form data to your backend
	}

	const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
		setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
	}

	return (
		<div className=" min-h-screen bg-gray-50">
			<div className=" max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-8">
				{/* Personal Information Section */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<h2 className="text-[1.125rem] md:text-[1.313rem] font-medium text-[#212A3B]">Personal Information</h2>
					</div>

					<div className="relative p-6 bg-white rounded-lg shadow-sm">
						{/* Profile Photo */}
						<div className="flex justify-between mb-6 ">
							<div className="flex items-center gap-4">
								<div className="relative w-20 h-20 rounded-full overflow-hidde">
									<Image width={100} height={200} src="/prop-value-profile-img.jpg" alt="Profile" className="w-full h-full object-cover rounded-full" />
									<button className="absolute z-50  bottom-0 right-0 w-6 h-6 bg-white rounded-full border border-gray-300 flex items-center justify-center">
										<Edit2 className="w-3 h-3 text-gray-600" />
									</button>
								</div>
								{level !== "user" && <div className="flex gap-2 right-2 top-2 text-[#295547] min-h-6 w-[5.625rem] px-[0.125rem] items-center justify-center py-2 items-self-start bg-[#ECF4F1] rounded-lg text-sm text-medium shadow-sm shadow-[#448C7433]"><LucideVerified className="w-[1.2rem] h-[1.2rem] bg-[#295547] rounded-full text-[#fff]" />{level}</div>}
							</div>

							<div className="right-2 top-2 text-[#785109] h-6 w-[6.5rem] px-[0.125rem] flex items-center justify-center py-2 items-self-start bg-[#FFE5B6] rounded-lg text-sm text-medium"> Kyc pending</div>
						</div>

						{/* Form Fields */}
						<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">First Name</label>
								<input
									type="text"
									value={formData.firstName}
									onChange={(e) => handleInputChange("firstName", e.target.value)}
									disabled={!isEditing.personal}
									className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.personal ? "bg-white" : "bg-gray-50"
										} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
								/>
							</div>
							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Last Name</label>
								<input
									type="text"
									value={formData.lastName}
									onChange={(e) => handleInputChange("lastName", e.target.value)}
									disabled={!isEditing.personal}
									className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.personal ? "bg-white" : "bg-gray-50"
										} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
								/>
							</div>

							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Username</label>
								<input
									type="text"
									value={formData.username}
									onChange={(e) => handleInputChange("username", e.target.value)}
									disabled={!isEditing.personal}
									className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.personal ? "bg-white" : "bg-gray-50"
										} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
								/>
							</div>

							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Email</label>
								<input
									type="email"
									value={formData.email}
									onChange={(e) => handleInputChange("email", e.target.value)}
									disabled={!isEditing.personal}
									className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.personal ? "bg-white" : "bg-gray-50"
										} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
								/>
							</div>

							<div className="col-span-1 md:col-span-2">
								<label className="block text-sm font-medium text-[#474E5C]">Phone Number</label>
								<div className="flex gap-2">
									<div className="relative">
										<select
											value={formData.countryCode}
											onChange={(e) => handleInputChange("countryCode", e.target.value)}
											disabled={!isEditing.personal}
											className={`appearance-none px-3 py-2 pr-8 border border-gray-300 rounded-lg ${isEditing.personal ? "bg-white" : "bg-gray-50"
												} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
										>
											<option value="+234">+234</option>
											<option value="+1">+1</option>
											<option value="+44">+44</option>
										</select>
										<ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
									</div>
									<input
										type="tel"
										value={formData.phoneNumber}
										onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
										disabled={!isEditing.personal}
										className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg ${isEditing.personal ? "bg-white" : "bg-gray-50"
											} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
									/>
								</div>
							</div>
						</div>

						<div className="flex justify-end mt-6 gap-2">
							{isEditing.personal ? (
								<>
									<button
										onClick={() => cancelEdit("personal")}
										className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={() => saveChanges("personal")}
										className="px-4 py-2 text-sm text-white bg-[#448C74] rounded-lg hover:bg-[#357a63] transition-colors"
									>
										Save Changes
									</button>
								</>
							) : (
								<button
									onClick={() => toggleEdit("personal")}
									className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
								>
									<Edit2 className="w-4 h-4" />
									Edit
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Verify your Identity Contact Information Section */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<h2 className="text-[1.125rem] md:text-[1.313rem] font-medium text-[#212A3B]">Verify your Identity</h2>
					</div>
					<div className="p-6 bg-white rounded-lg shadow-sm">

						<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
							<div className="col-span-1 md:col-span-2 flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Address</label>
								<input
									type="text"
									value={formData.identityAddress}
									onChange={(e) => handleInputChange("identityAddress", e.target.value)}
									disabled={!isEditing.education}
									className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.education ? "bg-white" : "bg-gray-50"
										} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
								/>
							</div>

							<div className="col-span-1 md:col-span-2 flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Education qualification</label>
								<div className="flex gap-2">
									<div className="relative w-full">
										<select
											value={formData.identityEducationQualification}
											onChange={(e) => handleInputChange("identityEducationQualification", e.target.value)}
											disabled={!isEditing.education}
											className={`appearance-none  w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg ${isEditing.education ? "bg-white" : "bg-gray-50"
												} text-gray-900 focus:outline-none`}
										>
											<option value="bsc">Bsc</option>
											<option value="mba">MBA</option>
											<option value="phd">PhD</option>
										</select>
										<ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
									</div>
								</div>
							</div>

							<div className="col-span-1 md:col-span-2 flex flex-col gap-[0.375rem]">
								<div className="grid gap-4 grid-cols-1 md:grid-cols-2">

									<div className="flex flex-col gap-[0.375rem]">
										<label className="block text-sm font-medium text-[#474E5C]">Verification Method</label>
										<div className="relative w-full">
											<select
												value={formData.identityVerificationMethod}
												onChange={(e) => handleInputChange("identityVerificationMethod", e.target.value)}
												disabled={!isEditing.education}
												className={`appearance-none  w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg ${isEditing.education ? "bg-white" : "bg-gray-50"
													} text-gray-900 focus:outline-none`}
											>
												<option value="bsc">Driver's licence</option>
												<option value="mba">NIN</option>
												<option value="phd">NIN Card</option>
											</select>
											<ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
										</div>
									</div>
									<div className="flex flex-col gap-[0.375rem]">
										<label className="block text-sm font-medium text-[#474E5C]">ID Number</label>
										<input
											type="text"
											value={formData.idNumber}
											onChange={(e) => handleInputChange("idNumber", e.target.value)}
											disabled={!isEditing.education}
											className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.personal ? "bg-white" : "bg-gray-50"
												} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
										/>
									</div>
								</div>
							</div>


						</div>

						<div className="flex justify-end mt-6 gap-2">
							{isEditing.education ? (
								<>
									<button
										onClick={() => cancelEdit("education")}
										className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={() => saveChanges("education")}
										className="px-4 py-2 text-sm text-white bg-[#448C74] rounded-lg hover:bg-[#357a63] transition-colors"
									>
										Save Changes
									</button>
								</>
							) : (
								<button
									onClick={() => toggleEdit("education")}
									className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
								>
									<Edit2 className="w-4 h-4" />
									Edit
								</button>
							)}
						</div>
					</div>
				</div>
				{/* Bank details Section */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<h2 className="text-[1.125rem] md:text-[1.313rem] font-medium text-[#212A3B]">Bank Details</h2>
					</div>
					<div className="p-6 bg-white rounded-lg shadow-sm">

						<div className="grid gap-4 grid-cols-1 md:grid-cols-2">

							<div className="col-span-1 md:col-span-2 flex flex-col gap-[0.375rem]">
								<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
									<div className="flex flex-col gap-[0.375rem]">
										<label className="block text-sm font-medium text-[#474E5C]">Bank Name</label>
										<input
											type="text"
											value={formData.bankName}
											onChange={(e) => handleInputChange("bankName", e.target.value)}
											disabled={!isEditing.bank}
											className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.bank ? "bg-white" : "bg-gray-50"
												} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
										/>
									</div>
									<div className="flex flex-col gap-[0.375rem]">
										<label className="block text-sm font-medium text-[#474E5C]">Account Number</label>
										<input
											type="text"
											value={formData.bankAccountNumber}
											onChange={(e) => handleInputChange("bankAccountNumber", e.target.value)}
											disabled={!isEditing.bank}
											className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.bank ? "bg-white" : "bg-gray-50"
												} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
										/>
									</div>
								</div>
							</div>

							<div className="col-span-1 md:col-span-2 flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Account Name</label>
								<input
									type="text"
									value={formData.bankAccountName}
									onChange={(e) => handleInputChange("bankAccountName", e.target.value)}
									disabled={!isEditing.bank}
									className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.bank ? "bg-white" : "bg-gray-50"
										} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
								/>
							</div>
						</div>

						<div className="flex justify-end mt-6 gap-2">
							{isEditing.bank ? (
								<>
									<button
										onClick={() => cancelEdit("bank")}
										className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={() => saveChanges("bank")}
										className="px-4 py-2 text-sm text-white bg-[#448C74] rounded-lg hover:bg-[#357a63] transition-colors"
									>
										Save Changes
									</button>
								</>
							) : (
								<button
									onClick={() => toggleEdit("bank")}
									className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
								>
									<Edit2 className="w-4 h-4" />
									Edit
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Update Password Section */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<h2 className="text-[1.125rem] md:text-[1.313rem] font-medium text-[#212A3B]">Update Password</h2>
					</div>
					<div className="p-6  bg-white rounded-lg shadow-sm">
						<div className="space-y-4">
							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Current Password</label>
								<div className="relative">
									<input
										type={showPassword.current ? "text" : "password"}
										value={formData.currentPassword}
										onChange={(e) => handleInputChange("currentPassword", e.target.value)}
										placeholder="Password (min. 8 characters)"
										disabled={!isEditing.password}
										className={`w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg ${isEditing.password ? "bg-white" : "bg-gray-50"
											} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
									/>
									<button
										type="button"
										onClick={() => togglePasswordVisibility("current")}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#448C74] hover:text-[#357a63] transition-colors"
									>
										<span className="text-sm font-medium cursor-pointer">{showPassword.current ? "Hide" : "Show"}</span>
									</button>
								</div>
							</div>

							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">New Password</label>
								<div className="relative">
									<input
										type={showPassword.new ? "text" : "password"}
										value={formData.newPassword}
										onChange={(e) => handleInputChange("newPassword", e.target.value)}
										placeholder="Password (min. 8 characters)"
										disabled={!isEditing.password}
										className={`w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg ${isEditing.password ? "bg-white" : "bg-gray-50"
											} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
									/>
									<button
										type="button"
										onClick={() => togglePasswordVisibility("new")}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#448C74] hover:text-[#357a63] transition-colors"
									>
										<span className="text-sm font-medium cursor-pointer">{showPassword.new ? "Hide" : "Show"}</span>
									</button>
								</div>
							</div>

							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Confirm New Password</label>
								<div className="relative">
									<input
										type={showPassword.confirm ? "text" : "password"}
										value={formData.confirmPassword}
										onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
										placeholder="Password (min. 8 characters)"
										disabled={!isEditing.password}
										className={`w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg ${isEditing.password ? "bg-white" : "bg-gray-50"
											} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
									/>
									<button
										type="button"
										onClick={() => togglePasswordVisibility("confirm")}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#448C74] hover:text-[#357a63] transition-colors"
									>
										<span className="text-sm font-medium cursor-pointer">{showPassword.confirm ? "Hide" : "Show"}</span>
									</button>
								</div>
							</div>
						</div>

						<div className="flex justify-end mt-6 gap-2">
							{isEditing.password ? (
								<>
									<button
										onClick={() => cancelEdit("password")}
										className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={() => saveChanges("password")}
										className="px-4 py-2 text-sm text-white bg-[#448C74] rounded-lg hover:bg-[#357a63] transition-colors"
									>
										Save Changes
									</button>
								</>
							) : (
								<button
									onClick={() => toggleEdit("password")}
									className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
								>
									<Edit2 className="w-4 h-4" />
									Edit
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
