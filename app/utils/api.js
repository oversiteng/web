// utils/api.js
import axios from 'axios'
import localforage from 'localforage';
if (typeof window !== 'undefined') {
	localforage.config({
		driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
		name: "oversite",
		storeName: "oversiteUserData",
		description: "oversite user data",
	});
	localforage.ready().then(() => {
		console.info(`Oversite is using ${localforage.driver()} for offline db`);
	}).catch((err) => {
		console.error(err);
	});
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const api = axios.create({
	baseURL: `${API_URL}`,
	withCredentials: false,
	headers: {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Credentials': "*"
	}
});



// Add a request interceptor to set the Authorization header dynamically
api.interceptors.request.use(async (config) => {
	const token = await localforage.getItem("UserToken");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
}, (error) => {
	return Promise.reject(error);
});


// api.interceptors.response.use(
// 	(response) => response,
// 	async error => {
// 		const originalRequest = error.config;
// 		if (error.response.status === 500) {
// 			if (!originalRequest._retryCount) {
// 				originalRequest._retryCount = 0;
// 			}
// 			if (originalRequest._retryCount < 3) {
// 				originalRequest._retryCount += 1;
// 				return new Promise((resolve) => {
// 					setTimeout(() => resolve(api(originalRequest)), 20000); // Retry after 20 seconds
// 				});
// 			}
// 		}
// 		return Promise.reject(error);
// 	}
// );


const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

export const create_account = async (data) => {
	if (USE_MOCK_API) {
		return {
			data: {
				message: 'Account created successfully (Mock Mode)',
				token: 'mock-jwt-token-12345',
				user: {
					id: 'mock-user-1',
					first_name: data?.first_name || 'Test',
					last_name: data?.last_name || 'User',
					email: data?.email || 'test@oversite.ng',
					account_level: data?.account_level || 'user',
				}
			},
			status: 200
		};
	}
	try {
		const response = await api.post('/auth/register', data);
		return { data: response.data, status: response.status };
	} catch (error) {
		if (error.code === "ERR_NETWORK") {
			throw { message: 'Network Error' };
		}
		console.log(error)
		throw { message: error?.response?.data?.message || 'Error occurred', status: error?.response?.status || 500 }
	}
};

export const login_account = async (data) => {
	if (USE_MOCK_API) {
		const emailOrUsername = (data?.username || data?.email || '').toLowerCase();
		let accountLevel = 'user';
		if (emailOrUsername.includes('admin')) {
			accountLevel = 'admin';
		} else if (emailOrUsername.includes('agent')) {
			accountLevel = 'agent';
		}

		return {
			data: {
				message: 'Login successful (Mock Mode)',
				token: 'mock-jwt-token-12345',
				user: {
					id: 'mock-user-1',
					first_name: accountLevel.charAt(0).toUpperCase() + accountLevel.slice(1),
					last_name: 'User',
					email: data?.username || 'test@oversite.ng',
					account_level: accountLevel,
				}
			},
			status: 200
		};
	}
	try {
		const response = await api.post('/auth/login', data);
		return { data: response.data, status: response.status };
	} catch (error) {
		if (error.code === "ERR_NETWORK") {
			throw { message: 'Network Error' };
		}
		throw { message: error?.response?.data?.message || 'Error occurred', status: error?.response?.status || 500 }
	}
};

export const send_verification_code_mail = async (data) => {
	if (USE_MOCK_API) {
		return { data: { message: 'Verification code sent (Mock Mode)' }, status: 200 };
	}
	try {
		const response = await api.post('/auth/email/send-code', data);
		return { data: response.data, status: response.status };
	} catch (error) {
		if (error.code === "ERR_NETWORK") {
			throw { message: 'Network Error', status: error?.response?.status || 500 };
		}
		console.log(error)
		throw { message: error?.response?.data?.message || 'Error occurred', status: error?.response?.status || 500 }
	}
};

export const verify_otp_code = async (data) => {
	if (USE_MOCK_API) {
		return { data: { message: 'OTP verified successfully (Mock Mode)' }, status: 200 };
	}
	try {
		const response = await api.post('/auth/email/verify-code', data);
		return { data: response.data, status: response.status };
	} catch (error) {
		if (error.code === "ERR_NETWORK") {
			throw { message: 'Network Error' };
		}
		console.log(error)
		throw { message: error?.response?.data?.message || 'Error occurred', status: error?.response?.status || 500 }
	}
};

export const forgot_password = async (data) => {
	if (USE_MOCK_API) {
		return { data: { message: 'Password reset code sent (Mock Mode)' }, status: 200 };
	}
	try {
		const response = await api.post('/auth/forgot-password', data);
		return { data: response.data, status: response.status };
	} catch (error) {
		if (error.code === "ERR_NETWORK") {
			throw { message: 'Network Error' };
		}
		console.log(error)
		throw { message: error?.response?.data?.message || 'Error occurred', status: error?.response?.status || 500 }
	}
};

export const reset_password = async (data) => {
	if (USE_MOCK_API) {
		return { data: { message: 'Password reset successful (Mock Mode)' }, status: 200 };
	}
	try {
		const response = await api.post('/auth/reset-password', data);
		return { data: response.data, status: response.status };
	} catch (error) {
		if (error.code === "ERR_NETWORK") {
			throw { message: 'Network Error' };
		}
		console.log(error)
		throw { message: error?.response?.data?.message || 'Error occurred', status: error?.response?.status || 500 }
	}
};

export const profile_img_update = async (data) => {
	if (USE_MOCK_API) {
		return { data: { message: 'Profile avatar updated (Mock Mode)' }, status: 200 };
	}
	try {
		const response = await axios.post(`${API_URL}/user/account/avatar-upload`, data, {
			headers: {
				Authorization: `Bearer ${await localforage.getItem("UserToken")}`
			},
			withCredentials: false,
		});
		return { data: response.data, status: response.status };
	} catch (error) {
		if (error.code === "ERR_NETWORK") {
			throw { message: 'Network Error' };
		}
		console.log(error)
		throw { message: error?.response?.data?.message || 'Error occurred', status: error?.response?.status || 500, errors: error?.response?.data?.errors }
	}
};

export const profile_update = async (data, type) => {
	if (USE_MOCK_API) {
		return { data: { message: 'Profile updated (Mock Mode)' }, status: 200 };
	}
	console.log(data)
	try {
		const response = await api.post(`/user/${type}/update`, data);
		return { data: response.data, status: response.status };
	} catch (error) {
		if (error.code === "ERR_NETWORK") {
			throw { message: 'Network Error' };
		}
		throw { message: error?.response?.data?.message || 'Error occurred', status: error?.response?.status || 500, errors: error?.response?.data?.errors }
	}
};

export const dashboard_data = async () => {
	if (USE_MOCK_API) {
		return {
			data: {
				data: {
					stats: { properties: 12, value: 45000000, pending: 3 },
					recentActivities: [],
					user: { id: 'mock-user-1', name: 'Test User', email: 'test@oversite.ng' }
				}
			},
			status: 200
		};
	}
	try {
		const response = await api.get('user/dashboard');
		return { data: response.data, status: response.status };
	} catch (error) {
		if (error.code === "ERR_NETWORK") {
			throw { message: 'Network Error' };
		}
		throw { message: error?.response?.data?.message || 'Error occurred', status: error?.response?.status || 500, errors: error?.response?.data?.errors }
	}
};



export const logout = async () => {
	try {
		await api.get('/auth/logout');
	} catch (error) {
		console.error('Logout error:', error);
	}
};

export const getProfile = async () => {
	try {
		const response = await api.get('/users/profile');
		return response.data;
	} catch (error) {
		throw error.response;
	}
};

export const updateProfile = async (profileData) => {
	try {
		const response = await api.put('/users/profile', profileData);
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};

export const deleteProfile = async () => {
	try {
		await api.delete('/users/profile');
	} catch (error) {
		throw error.response.data;
	}
};
export const getPotentialConnections = async (query) => {
	try {
		const response = await api.post(`/pairing/get-potential-connections`, query);
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const connectWithNetwork = async (userId) => {
	try {
		const response = await api.post('/pairing/connect', userId);
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const unConnectWithNetwork = async (userId) => {
	try {
		const response = await api.post('/pairing/unconnect', userId);
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const findMentors = async (menteeId) => {
	try {
		const response = await api.post('/pairing/find-compatible-mentors', { menteeId });
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const pairMentorWithMentee = async (userId) => {
	try {
		const response = await api.post('/pairing/pair', userId);
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const getFollowers = async (userId) => {
	try {
		const response = await api.post('/pairing/pair', userId);
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const getConnections = async () => {
	try {
		const response = await api.get('/pairing/connections');
		console.log(response)
		return response.data.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const createSync = async (data) => {
	try {
		const response = await api.post('/sync/createSync', data);
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const hostSession = async (data) => {
	try {
		const response = await api.post('/sync/create-session', data);
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const getSessions = async (id) => {
	try {
		const response = await api.get(`/sync/${id}/sessions`);
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const updateSync = async (data) => {
	try {
		const response = await api.put('/sync/updateSync', data);
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const getSync = async () => {
	try {
		const response = await api.get('/sync/getSync');
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const getRoadmaps = async () => {
	try {
		const response = await api.get('/sync/getSync');
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};
export const getRoadmapById = async (id) => {
	try {
		const response = await api.get(`/community/${id}/roadmap`);
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};

export const saveRoadmap = async (id, data) => {
	try {
		const response = await api.post(`/community/${id}/roadmap`, data);
		return response.data;
	} catch (error) {
		console.log(error)
		return
		throw error.response.data;
	}
};


export const updateRoadmap = async (id, roadmapId, data) => {
	try {
		const response = await api.put(`/community/${id}/${roadmapId}/roadmap`, data);
		return response.data;
	} catch (error) {
		throw error.response.data;
	}
};

export const initiateGoogleLogin = () => {
	window.location.href = `${API_URL}/api/auth/google`;
};

export default api;
