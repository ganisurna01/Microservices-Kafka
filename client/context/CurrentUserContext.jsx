'use client'; // Context must be a Client Component

import { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const CurrentUserContext = createContext();

// Custom hook to use the context
export const useCurrentUser = () => useContext(CurrentUserContext);

// Context Provider component
const CurrentUserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Fetch the current user on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/users/currentuser', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.currentUser);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false); // Set loading to false after fetch completes
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <CurrentUserContext.Provider value={{ currentUser, setCurrentUser, loading: isLoading }}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export default CurrentUserProvider;