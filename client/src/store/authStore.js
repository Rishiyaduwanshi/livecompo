import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4040/api/v1';

const useAuthStore = create(
  persist(
    
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      // Hydration setter
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      // Configure axios interceptor
      setupAxiosInterceptor: () => {
        // Clear existing interceptors first
        axios.interceptors.request.clear();
        axios.interceptors.response.clear();
        
        // Set default axios config for credentials
        axios.defaults.withCredentials = true;
        
        axios.interceptors.request.use(
          (config) => {
            // Ensure withCredentials is set for all requests
            config.withCredentials = true;
            console.log('Axios request interceptor:', { 
              url: config.url, 
              withCredentials: config.withCredentials,
              authMethod: 'httpOnly cookie'
            });
            
            return config;
          },
          (error) => Promise.reject(error)
        );

        axios.interceptors.response.use(
          (response) => response,
          async (error) => {
            console.log('Axios response error:', {
              status: error.response?.status,
              url: error.config?.url,
              message: error.response?.data?.message
            });
            
            if (error.response?.status === 401) {
              console.log('401 error - logging out');
              get().logout();
            }
            return Promise.reject(error);
          }
        );
      },

      // Login action
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        console.log('Login attempt:', { email, apiUrl: `${API_BASE_URL}/auth/login` });
        
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password,
          }, {
            withCredentials: true  // Include cookies in request
          });

          console.log('Login response:', response.data);
          
          // Since token comes in httpOnly cookie, no need to extract token
          // Just get user data and set authenticated state
          const { user } = response.data.data;
          console.log('Setting auth state:', { 
            user: user.name || user.email,
            authMethod: 'httpOnly cookie'
          });
          
          set({
            user,
            token: null, // No token in localStorage since it's httpOnly cookie
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Setup axios interceptor to include credentials
          get().setupAxiosInterceptor();
          console.log('Axios interceptor setup complete after login');

          return { success: true };
        } catch (error) {
          console.error('Login error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method
          });
          
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // Check authentication status - not needed with httpOnly cookies
      checkAuth: async () => {
        // With httpOnly cookies, auth is handled automatically by server
        // Just return current state without making API call
        const currentState = get();
        if (currentState.isAuthenticated) {
          return { success: true, user: currentState.user };
        }
        return { success: false };
      },

      // Register action
      register: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            email,
            password,
          }, {
            withCredentials: true  // Include cookies in request
          });

          const { user } = response.data.data;
          set({
            user,
            token: null, // No token in localStorage since it's httpOnly cookie
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Setup axios interceptor after registration
          get().setupAxiosInterceptor();

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Registration failed';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // Logout action
      logout: async () => {
        try {
          await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
            withCredentials: true  // Include cookies in logout request
          });
        } catch (error) {
          console.error('Logout error:', error);
        }
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Get user profile
      getProfile: async () => {
        if (!get().isAuthenticated) return;
        
        try {
          const response = await axios.get(`${API_BASE_URL}/users/profile`, {
            withCredentials: true  // Include cookies in profile request
          });
          set({ user: response.data.data });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        // Only use localStorage on client side
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // No token in localStorage since it's httpOnly cookie
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;
