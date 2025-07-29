import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4040/api/v1';

const useSessionStore = create(
  persist(
    (set, get) => ({
      // Current session data
      currentSession: null,
      sessions: [],
      chatMessages: [],
      isLoading: false,
      error: null,
      
      // Generated component data
      generatedComponent: {
        jsx: '',
        css: '',
        lastModified: null,
      },
      
      // UI state
      selectedElement: null,
      propertyPanelOpen: false,
      autoSave: true,
      lastSaved: null,

      // Session management
      createSession: async (sessionName) => {
        set({ isLoading: true, error: null });
        try {
          console.log('Creating session with name:', sessionName);
          console.log('API URL:', `${API_BASE_URL}/chat`);
          
          // Create session by sending initial prompt (no sessionId to create new session)
          const response = await axios.post(`${API_BASE_URL}/chat`, {
            prompt: sessionName || 'New Component Session',
          }, {
            withCredentials: true
          });

          console.log('Create session response:', response.data);

          const newSession = {
            _id: response.data.data.sessionId,
            name: sessionName || 'New Component Session',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Add the initial AI response to chat messages
          const initialMessage = {
            role: 'assistant',
            content: response.data.data.reply,
            timestamp: new Date().toISOString(),
          };

          set({
            currentSession: newSession,
            chatMessages: [initialMessage],
            generatedComponent: response.data.data.component || { jsx: '', css: '', lastModified: null },
            isLoading: false,
          });

          await get().fetchSessions(); // Refresh sessions list
          return { success: true, session: newSession };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to create session';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      loadSession: async (sessionId) => {
        console.log('sessionStore: loadSession called with ID:', sessionId);
        set({ isLoading: true, error: null });
        try {
          console.log('sessionStore: Making API call to load session');
          const response = await axios.get(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
            withCredentials: true
          });
          const session = response.data.data;
          
          console.log('sessionStore: Session loaded successfully', {
            sessionId: session._id,
            name: session.name,
            messagesCount: session.messages?.length,
            hasComponent: !!session.generatedComponent
          });

          set({
            currentSession: session,
            chatMessages: session.messages || [],
            generatedComponent: {
              jsx: session.generatedComponent?.jsx || '',
              css: session.generatedComponent?.css || '',
              lastModified: session.updatedAt,
            },
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          console.error('sessionStore: loadSession error:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            sessionId
          });
          const errorMessage = error.response?.data?.message || 'Failed to load session';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      fetchSessions: async () => {
        try {
          console.log('fetchSessions: Making API call to', `${API_BASE_URL}/chat/sessions`);
          const response = await axios.get(`${API_BASE_URL}/chat/sessions`, {
            withCredentials: true
          });
          console.log('fetchSessions: Response received', {
            data: response.data,
            sessionsCount: response.data.data?.length
          });
          set({ sessions: response.data.data });
        } catch (error) {
          console.error('Failed to fetch sessions:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            url: error.config?.url
          });
        }
      },

      deleteSession: async (sessionId) => {
        try {
          await axios.delete(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
            withCredentials: true
          });
          
          // Update local state
          const updatedSessions = get().sessions.filter(s => s._id !== sessionId);
          set({ sessions: updatedSessions });
          
          // If deleting current session, clear it
          if (get().currentSession?._id === sessionId) {
            set({
              currentSession: null,
              chatMessages: [],
              generatedComponent: { jsx: '', css: '', lastModified: null },
            });
          }

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to delete session';
          return { success: false, error: errorMessage };
        }
      },

      // Chat functionality
      sendMessage: async (prompt, isElementSpecific = false, targetElement = null) => {
        console.log('sendMessage called with:', {
          prompt,
          hasCurrentSession: !!get().currentSession,
          currentSessionId: get().currentSession?._id,
          sessionFromLocalStorage: JSON.parse(localStorage.getItem('session-storage') || '{}')
        });

        const userMessage = {
          role: 'user',
          content: prompt,
          timestamp: new Date().toISOString(),
        };

        // Add user message immediately
        set(state => ({
          chatMessages: [...state.chatMessages, userMessage],
          isLoading: true,
        }));

        try {
          // Prepare request data - if no currentSession, don't send sessionId (will create new session)
          const requestData = {
            prompt,
          };
          
          // Only add sessionId if we have an active session
          if (get().currentSession) {
            requestData.sessionId = get().currentSession._id;
            console.log('Sending message to existing session:', requestData.sessionId);
          } else {
            console.log('Creating new session - no sessionId sent');
          }

          const response = await axios.post(`${API_BASE_URL}/chat`, requestData, {
            withCredentials: true
          });

          console.log('Chat response received:', {
            hasSessionId: !!response.data.data.sessionId,
            sessionId: response.data.data.sessionId,
            reply: response.data.data.reply?.substring(0, 100) + '...'
          });

          // If this was a new session creation, update currentSession
          if (!get().currentSession && response.data.data.sessionId) {
            console.log('Creating new session with ID:', response.data.data.sessionId);
            const newSession = {
              _id: response.data.data.sessionId,
              name: prompt.slice(0, 30) + '...',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            set({ currentSession: newSession });
            // Refresh sessions list
            await get().fetchSessions();
          }

          const assistantMessage = {
            role: 'assistant',
            content: response.data.data.reply || response.data.data.component?.description || 'Component generated successfully',
            timestamp: new Date().toISOString(),
          };

          // Get component data directly from server response (no need to extract)
          const componentData = response.data.data.component;
          
          set(state => ({
            chatMessages: [...state.chatMessages, assistantMessage],
            generatedComponent: {
              jsx: componentData?.jsx || state.generatedComponent.jsx,
              css: componentData?.css || state.generatedComponent.css,
              lastModified: new Date().toISOString(),
            },
            isLoading: false,
            lastSaved: new Date().toISOString(),
          }));

          console.log('Message sent successfully:', {
            reply: response.data.data.reply,
            hasComponent: !!componentData,
            componentName: componentData?.componentName
          });

          // Auto-save if enabled
          if (get().autoSave) {
            await get().saveSession();
          }

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          console.error('sendMessage error:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            currentSessionId: get().currentSession?._id
          });
          
          // If session not found and we have a currentSession, clear it and try again
          if (error.response?.status === 404 && error.response?.data?.message?.includes('Session not found')) {
            console.log('Session not found on server, clearing local session and creating new one');
            set({ 
              currentSession: null,
              chatMessages: [],
              generatedComponent: { jsx: '', css: '', lastModified: null }
            });
            
            // Recursively call sendMessage without session to create a new one
            console.log('Retrying with new session...');
            return await get().sendMessage(prompt, isElementSpecific, targetElement);
          }
          
          const errorMessage = error.response?.data?.message || 'Failed to send message';
          throw new Error(errorMessage);
        }
      },

      // Component management
      updateComponent: (jsx, css) => {
        set({
          generatedComponent: {
            jsx: jsx || get().generatedComponent.jsx,
            css: css || get().generatedComponent.css,
            lastModified: new Date().toISOString(),
          },
        });

        // Auto-save if enabled
        if (get().autoSave) {
          setTimeout(() => get().saveSession(), 1000); // Debounced save
        }
      },

      saveSession: async () => {
        const { currentSession, generatedComponent } = get();
        if (!currentSession) return;

        try {
          // Component is auto-saved on server during chat, no manual save needed
          console.log('Auto-save: Component already saved on server during chat interaction');
          set({ lastSaved: new Date().toISOString() });
        } catch (error) {
          console.error('Save session error:', error);
        }
      },

      // UI state management
      selectElement: (element) => {
        set({ selectedElement: element, propertyPanelOpen: !!element });
      },

      closePropertyPanel: () => {
        set({ selectedElement: null, propertyPanelOpen: false });
      },

      toggleAutoSave: () => {
        set(state => ({ autoSave: !state.autoSave }));
      },

      // Export functionality
      exportComponent: () => {
        const { generatedComponent } = get();
        return {
          jsx: generatedComponent.jsx,
          css: generatedComponent.css,
          timestamp: new Date().toISOString(),
        };
      },

      // Clear current session
      clearSession: () => {
        set({
          currentSession: null,
          chatMessages: [],
          generatedComponent: { jsx: '', css: '', lastModified: null },
          selectedElement: null,
          propertyPanelOpen: false,
        });
      },

      // Force clear localStorage (for debugging)
      clearLocalStorage: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('session-storage');
          localStorage.removeItem('auth-storage');
          window.location.reload();
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'session-storage',
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
        currentSession: state.currentSession,
        autoSave: state.autoSave,
      }),
    }
  )
);

// Helper function to extract JSX and CSS from AI response
function extractCodeFromResponse(response) {
  const jsx = extractCodeBlock(response, 'jsx') || extractCodeBlock(response, 'javascript');
  const css = extractCodeBlock(response, 'css');
  
  // Use the JSX directly for preview
  const cleanedJsx = jsx || '';
  
  return { jsx: cleanedJsx, css };
}

function extractCodeBlock(text, language) {
  const regex = new RegExp(`\`\`\`${language}\\s*\\n([\\s\\S]*?)\\n\`\`\``, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

export default useSessionStore;
