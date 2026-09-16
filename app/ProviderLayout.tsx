"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import localforage from "localforage";
import { LayoutContextType } from "../libs/interface";
import { dashboard_data, logout as apiLogout } from "./utils/api";

if (typeof window !== "undefined") {
	localforage.config({
		driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
		name: "oversite",
		storeName: "oversiteUserData",
		description: "oversite user data",
	});
	// Initialize localforage
	localforage.ready().then(() => {
		console.info(`Oversite is using ${localforage.driver()} for offline db`);
	}).catch((err) => {
		console.error(err);
	});
}
const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
	const [userProfileData, setUserProfileData] = useState<LayoutContextType["user"]>({} as LayoutContextType["user"]);
	const [userDashboardData, setUserDashboardData] = useState<Record<any, any>>({});
	const [userToken, setUserToken] = useState<string | null>(null);
	const router = useRouter();
	const pathname = usePathname();
	const pathnames = ["/", "/signup", "/create-account", "/login", "/faq", "/about", "/terms", "/privacy", "/reset", "/onboarding", "/verify-otp", "/forgot-password"];

	const updateUserData = useCallback(async (data: { user: LayoutContextType["user"], message?: string, token?: string }, partial_data: boolean = false) => {
		const UserProfileData = data;
		if (!partial_data) {
			await localforage.removeItem("UserProfileData");
			if (UserProfileData.user) {
				if (UserProfileData?.token) {
					await localforage.setItem("UserToken", UserProfileData?.token);
					setUserToken(UserProfileData.token)
				}
				setUserProfileData(UserProfileData.user);
				await localforage.setItem("UserProfileData", UserProfileData.user);
			}
		}
		else {
			const currentData: object | null = await localforage.getItem("UserProfileData");
			if (UserProfileData) {
				if (UserProfileData?.token) {
					await localforage.setItem("UserToken", UserProfileData?.token);
					setUserToken(UserProfileData.token)
				}
				setUserProfileData({ ...currentData, ...UserProfileData.user });
				await localforage.setItem("UserProfileData", { ...currentData, ...UserProfileData });
			}
		}
		return {
			status: "success",
			user: UserProfileData.user,
			message: UserProfileData.message ?? "",
			token: UserProfileData.token
		};
	}, []);

	const fetchUserDashboardData = useCallback(async () => {
		const { data: dashboarddatas, status } = await dashboard_data()
		if (status === 200) {
			const dashboardData = await localforage.setItem("UserDashboardData", dashboarddatas.data);
			setUserDashboardData(dashboardData as Record<any, any>);
		}
		if (status == 401) {
			logout()
		}
	}, []);

	const logout = async () => {
		await apiLogout();
		await localforage.clear();
		setUserProfileData({} as LayoutContextType["user"]);
		setUserToken("");
		setUserDashboardData({});
		router.push("/login");
	}

	const checkAuthenticated = async () => {
		const profile_data = (await localforage.getItem("UserProfileData") as LayoutContextType["user"] || null) || {};
		const token = (await localforage.getItem("UserToken") as string | null);
		setUserProfileData(profile_data!);
		const authPages = ["/login", "/signup", "/create-account", "/reset", "/onboarding", "/verify-otp", "/forgot-password"];

		if (token && profile_data?.id && authPages.includes(pathname)) {
			const accountLevel = profile_data?.account_level || "user";
			router.push(`/${accountLevel}/dashboard`);
		} else if (!token && !profile_data?.id && !pathnames.includes(pathname)) {
			router.push("/login");
		}
	};

	useEffect(() => {
		const runAsync = async () => {
			await checkAuthenticated();
			fetchUserDashboardData();
		};
		runAsync();
	}, [pathname]);

	return (
		<LayoutContext.Provider value={{
			user: userProfileData,
			userToken,
			updateUserData,
			dashboard: userDashboardData,
			logoutUserProfile: logout,
		}}>
			{children}
		</LayoutContext.Provider>
	);
}

export function useLayoutContext() {
	const context = useContext(LayoutContext);
	if (!context) throw new Error("useLayoutContext must be used within a LayoutProvider");
	return context;
}
