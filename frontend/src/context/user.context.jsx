import React, { createContext, useState, useEffect } from 'react';
import axios from '../config/axios.js';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUserToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get('/users/profile');
        setUser(response.data.user || response.data);
      } catch (err) {
        console.log('Token invalid or expired', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    verifyUserToken();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};