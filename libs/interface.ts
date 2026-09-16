export interface LayoutContextType {
	user: {
		id: string;
		first_name: string;
		last_name: string;
		username: string;
		email: string;
		phone_number: string;
		photo_url?: string | null;
		countryCode: string;
		subscription_type: string;
		account_level: string;
		profilePicture: string;
	};
	userToken: string | null;
	// setUserProfileData: (data: LayoutContextType["user"]) => void;
	updateUserData: (data: { user: LayoutContextType["user"]; message?: string, token?: string }, force?: boolean) => Promise<{ user: LayoutContextType["user"], status: string, message: string }>;
	logoutUserProfile: () => void;
	dashboard: Record<any, any>;
	// fetchUserDashboardData: () => Promise<void>;
	// setUserDashboardData: (data: Record<any, any>) => void;
	// getProfile: () => Promise<LayoutContextType["user"] | null>;
	// getMenteoUserData: (key: string) => Promise<any>;
	// setMenteoUserData: (data: any, key: string) => Promise<void>;
}

export interface User {
	id: string
	fullname: string
	username: string
	phone: string
	joinedAt: string
	email?: string
	status?: "active" | "suspended"
}
export interface Property {
	id: string
	name: string
	type: string
	buildingType: string
	dateCreated: string
	status?: "assigned" | "pending"
}
export interface Manager {
	id: string
	name: string
	email: string
	username: string
}
export interface Ad {
	id: string
	title: string
	description: string
	websiteUrl?: string
	imageUrl?: string
	status: "active" | "archived"
	createdAt: Date
}

export interface NavigationItem {
	id: string
	label: string
	icon: string
	href: string
	badge?: number
}


export interface Message {
	id: string
	subject: string
	content: string
	recipients: Recipient[]
	scheduledFor?: Date
	sentAt?: Date
	status: "draft" | "scheduled" | "sent"
	createdAt: Date
}

export interface Recipient {
	id: string
	type: "broadcast" | "user"
	label: string
	value: string
}

export interface ScheduleOption {
	id: string
	label: string
	date: string
	time: string
}



export interface UserProfileData {
	firstName: string
	lastName: string
	username: string
	email: string
	phoneNumber: string
	role: string
	bankName: string
	accountNumber: string
	accountName: string
	address: string
	educationQualification: string
	verificationMethod: string
	kycAccountName: string
	status: string
	kycStatus: "Pending" | "Approved" | "Rejected"
	avatar: string
}
