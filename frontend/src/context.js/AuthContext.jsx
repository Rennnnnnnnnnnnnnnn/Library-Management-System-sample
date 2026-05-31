import { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { setDarkMode } = useTheme();
    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userData');
        setDarkMode(false);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('userData');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// ✅ THIS IS WHAT YOU ARE MISSING
export const useAuth = () => {
    return useContext(AuthContext);
};