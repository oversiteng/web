"use client"

import { useEffect, useState } from "react"
import { Edit2, ChevronDown, LucideVerified } from "lucide-react"
import { profile_img_update, profile_update } from "@/app/utils/api"
import { useLayoutContext } from "@/app/ProviderLayout"
import Image from "next/image"

interface AccountPageProps {
	level?: string
}

export default function AccountPage({ level = "user" }: AccountPageProps) {

	const { userToken, user, logoutUserProfile, updateUserData } = useLayoutContext()

	const [isEditing, setIsEditing] = useState({
		personal: false,
		emergency: false,
		password: false,
	})

	const [showPassword, setShowPassword] = useState({
		current: false,
		new: false,
		confirm: false,
	})

	type FormDataType = {
		first_name: string,
		last_name: string,
		username: string,
		avatar: string | File,
		email: string,
		phone: string,
		countryCode: string,
		emergency_first_name: string,
		emergency_last_name: string,
		relationship: string,
		emergency_email: string,
		emergency_address: string,
		emergency_phone: string,
		emergency_country_code: string,
		password: string,
		new_password: string,
		new_password_confirmation: string,
		avatarPreview?: string
	}
	const [formData, setFormData] = useState<FormDataType>({
		first_name: user.first_name,
		last_name: user.last_name,
		username: user.username,
		avatar: "/prop-value-profile-img.jpg",
		email: user?.email || "Enter Email",
		phone: user?.phone_number,
		countryCode: "+234",
		emergency_first_name: "Adeyemi",
		emergency_last_name: "Adekunle",
		relationship: "Cousin",
		emergency_email: "Enter Address",
		emergency_address: "22, Omotayo Ojo Street, Ikeja, Lagos, Nigeria",
		emergency_phone: "08123456789",
		emergency_country_code: "+234",
		password: "",
		new_password: "",
		new_password_confirmation: "",
	})
	const [successMsg, setSuccessMsg] = useState("")
	const [errorMsg, setErrorMsg] = useState("")

	const showFormSubmissionMsg = ({ msg, status, successCallback, errorCallback }: { msg: string, status: number, successCallback?: () => void, errorCallback?: () => void }) => {
		if (status == 200) {
			setSuccessMsg(msg)
			successCallback?.()
		}
		if (status !== 200) {
			setErrorMsg(msg)
			errorCallback?.()
		}
		setTimeout(() => {
			setSuccessMsg("")
			setErrorMsg("")
			if (status == 401) { logoutUserProfile() }
		}, 3000)
	}

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	const toggleEdit = (section: "personal" | "emergency" | "password") => {
		setIsEditing((prev) => ({ ...prev, [section]: !prev[section] }))
	}

	const cancelEdit = (section: "personal" | "emergency" | "password") => {
		setIsEditing((prev) => ({ ...prev, [section]: false }))
		// Here you would reset form data to original values
	}

	const saveChanges = async (section: "personal" | "emergency" | "password") => {
		try {
			if (section === "personal") {
				if (formData.avatar !== user?.photo_url) {
					console.log(userToken, formData.avatar)
					profile_img_update({
						avatar: formData.avatar
					})
				}

				if (formData.first_name !== user?.first_name || formData.last_name !== user?.last_name || formData.username !== user?.username || formData.email !== user?.email || formData.phone !== user?.phone_number) {
					console.log(userToken, formData.avatar)
					const { data, status } = await profile_update({
						first_name: formData.first_name,
						last_name: formData.last_name,
						username: formData.username,
						email: formData.email,
						phone: formData.phone,
					}, "account")

					showFormSubmissionMsg({
						msg: data.message, status, successCallback: () => updateUserData({
							user: {
								...user,
								first_name: formData.first_name,
								last_name: formData.last_name,
								username: formData.username,
								email: formData.email,
								phone_number: formData.phone,
							},
						}, true)
					})
				}
			}
			if (section === "emergency") {

				if (formData.emergency_first_name || formData.emergency_last_name || formData.relationship || formData.emergency_email || formData.emergency_address) {
					console.log(userToken, formData.avatar)
					const { data, status } = await profile_update({
						first_name: formData.emergency_first_name,
						last_name: formData.emergency_last_name,
						relationship: formData.relationship,
						email: formData.emergency_email,
						phone_number: formData.emergency_phone,
						address: formData.emergency_address,
					}, "contact")
					if (status == 200) {
						showFormSubmissionMsg({ msg: data.message, status })
					}
					if (status == 401) { logoutUserProfile() }

				}
			}
			if (section === "password") {
				// Here you would handle personal or emergency contact updates
				const { data, status } = await profile_update({
					password: formData.password,
					new_password: formData.new_password,
					new_password_confirmation: formData.new_password_confirmation,
				}, "password")
				showFormSubmissionMsg({ msg: data.message, status })
			}
		}
		catch (err: any) {
			console.log(err)
			showFormSubmissionMsg({ msg: err?.message, status: err?.status })
		}
		finally {
			setIsEditing((prev) => ({ ...prev, [section]: false }))
		}
	}

	const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
		setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
	}

	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			first_name: user?.first_name || "",
			last_name: user?.last_name || "",
			username: user?.username || "",
			email: user?.email || "Enter Email",
			phone: user?.phone_number || "",
			avatar: typeof user?.photo_url === "string" ? user.photo_url : "/prop-value-profile-img.jpg"
		}))
	}, [user])

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="relative max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-8">
				{successMsg && <div className="sticky bg-[#448C74] px-4 py-2 z-20 rounded-lg md:right-6 right-4 -top-2"> {successMsg}</div>
				}
				{errorMsg && <div className="sticky bg-[#FC3B3B] px-4 py-2 z-20 rounded-lg md:right-6 right-4 -top-2"> {errorMsg}</div>
				}
				{/* Personal Information Section */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<h2 className="text-[1.125rem] md:text-[1.313rem] font-medium text-[#212A3B]">Personal Information</h2>
					</div>

					<div className="p-6 bg-white rounded-lg shadow-sm">
						{/* Profile Photo */}
						<div className="flex justify-start mb-6 items-center gap-4">
							<div className="relative">
								<div className="w-20 h-20 rounded-full overflow-hidden">
									{isEditing.personal ? (
										formData.avatarPreview ? (
											<Image
												width={100}
												height={100}
												src={formData.avatarPreview}
												alt="Preview"
												className="w-20 h-20 rounded-full object-cover"
											/>
										) : (
											<div className="w-20 h-20 rounded-full bg-gray-100" />
										)
									) : (
										<Image
											width={100}
											height={100}
											src={user?.photo_url || "/prop-value-profile-img.jpg"}
											alt="Profile"
											className="w-20 h-20 rounded-full object-cover"
										/>
									)}
									<input
										type="file"
										accept="image/*"
										id="profileImg"
										className="absolute inset-0 opacity-0 cursor-pointer"
										disabled={!isEditing.personal}
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) {
												const blob = new Blob([file], { type: file.type });
												setFormData((prev) => ({ ...prev, avatar: blob as File }));
												const reader = new FileReader();
												reader.onloadend = () => {
													if (reader.result) {
														// Optionally show preview
														setFormData((prev) => ({
															...prev,
															avatarPreview: reader.result as string,
														}));
													}
												};
												reader.readAsDataURL(file);
											}
										}}
									/>
								</div>
								<button
									className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full border border-gray-300 flex items-center justify-center"
									disabled={!isEditing.personal}
								>
									<label
										className="w-full h-full cursor-pointer flex items-center justify-center" htmlFor="profileImg"
									>
										<Edit2 className="w-3 h-3 text-gray-600" />
									</label>
								</button>
							</div>
							{level !== "user" && <div className="flex gap-2 right-2 top-2 text-[#295547] min-h-6 w-[5.625rem] px-[0.125rem] items-center justify-center py-2 items-self-start bg-[#ECF4F1] rounded-lg text-sm text-medium shadow-sm shadow-[#448C7433]"><LucideVerified className="w-[1.2rem] h-[1.2rem] bg-[#295547] rounded-full text-[#fff]" />{level}</div>}
						</div>

						{/* Form Fields */}
						<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">First Name</label>
								<input
									type="text"
									value={formData.first_name}
									onChange={(e) => handleInputChange("first_name", e.target.value)}
									disabled={!isEditing.personal}
									className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.personal ? "bg-white" : "bg-gray-50"
										} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
								/>
							</div>
							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Last Name</label>
								<input
									type="text"
									value={formData.last_name}
									onChange={(e) => handleInputChange("last_name", e.target.value)}
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
										value={formData.phone}
										onChange={(e) => handleInputChange("phone", e.target.value)}
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

				{/* Emergency Contact Information Section */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<h2 className="text-[1.125rem] md:text-[1.313rem] font-medium text-[#212A3B]">Emergency Contact Information</h2>
					</div>
					<div className="p-6 bg-white rounded-lg shadow-sm">

						<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">First Name</label>
								<input
									type="text"
									value={formData.emergency_first_name}
									onChange={(e) => handleInputChange("emergency_first_name", e.target.value)}
									disabled={!isEditing.emergency}
									className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.emergency ? "bg-white" : "bg-gray-50"
										} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
								/>
							</div>

							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Last Name</label>
								<input
									type="text"
									value={formData.emergency_last_name}
									onChange={(e) => handleInputChange("emergency_last_name", e.target.value)}
									disabled={!isEditing.emergency}
									className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.emergency ? "bg-white" : "bg-gray-50"
										} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
								/>
							</div>

							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Relationship</label>
								<input
									type="text"
									value={formData.relationship}
									onChange={(e) => handleInputChange("relationship", e.target.value)}
									disabled={!isEditing.emergency}
									className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.emergency ? "bg-white" : "bg-gray-50"
										} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
								/>
							</div>

							<div className="flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Email</label>
								<input
									type="email"
									value={formData.emergency_email}
									onChange={(e) => handleInputChange("emergency_email", e.target.value)}
									disabled={!isEditing.emergency}
									className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.emergency ? "bg-white" : "bg-gray-50"
										} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
									placeholder={isEditing.emergency ? "Enter email address" : ""}
								/>
							</div>

							<div className="col-span-1 md:col-span-2 flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Address</label>
								<input
									type="text"
									value={formData.emergency_address}
									onChange={(e) => handleInputChange("emergency_address", e.target.value)}
									disabled={!isEditing.emergency}
									className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${isEditing.emergency ? "bg-white" : "bg-gray-50"
										} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
								/>
							</div>

							<div className="col-span-1 md:col-span-2 flex flex-col gap-[0.375rem]">
								<label className="block text-sm font-medium text-[#474E5C]">Phone Number</label>
								<div className="flex gap-2">
									<div className="relative">
										<select
											value={formData.emergency_country_code}
											onChange={(e) => handleInputChange("emergency_country_code", e.target.value)}
											disabled={!isEditing.emergency}
											className={`appearance-none px-3 py-2 pr-8 border border-gray-300 rounded-lg ${isEditing.emergency ? "bg-white" : "bg-gray-50"
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
										value={formData.emergency_phone}
										onChange={(e) => handleInputChange("emergency_phone", e.target.value)}
										disabled={!isEditing.emergency}
										className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg ${isEditing.emergency ? "bg-white" : "bg-gray-50"
											} text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent`}
									/>
								</div>
							</div>
						</div>

						<div className="flex justify-end mt-6 gap-2">
							{isEditing.emergency ? (
								<>
									<button
										onClick={() => cancelEdit("emergency")}
										className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={() => saveChanges("emergency")}
										className="px-4 py-2 text-sm text-white bg-[#448C74] rounded-lg hover:bg-[#357a63] transition-colors"
									>
										Save Changes
									</button>
								</>
							) : (
								<button
									onClick={() => toggleEdit("emergency")}
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
										value={formData.password}
										onChange={(e) => handleInputChange("password", e.target.value)}
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
										value={formData.new_password}
										onChange={(e) => handleInputChange("new_password", e.target.value)}
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
										value={formData.new_password_confirmation}
										onChange={(e) => handleInputChange("new_password_confirmation", e.target.value)}
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
