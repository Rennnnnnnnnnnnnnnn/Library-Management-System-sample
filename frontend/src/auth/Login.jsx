import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context.js/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

function Login() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showColdStartMessage, setShowColdStartMessage] = useState(false);

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    useEffect(() => {
        let timer;

        if (loading) {
            timer = setTimeout(() => {
                setShowColdStartMessage(true);
            }, 3000);
        } else {
            setShowColdStartMessage(false);
        }

        return () => clearTimeout(timer);
    }, [loading]);

    const fillCredentials = () => {
        setName('admin');
        setPassword('password');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/api/auth/login', {
                name,
                password,
            });

            const data = res.data;

            login(data.userData);

            setTimeout(() => {
                navigate('/home');
            }, 1000);

        } catch (err) {
            const apiError = err.response?.data?.error;

            setError(
                typeof apiError === 'string'
                    ? apiError
                    : apiError?.message || err.message
            );

            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white to-green-600">
            <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md">

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <LoadingSpinner />

                        {showColdStartMessage && (
                            <div className="mt-6 text-center text-sm text-gray-600">
                                Please wait a couple more seconds.
                                <br />
                                The backend is waking up from a cold start.
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-semibold text-center text-green-700 mb-6">
                            ACTS Library
                        </h2>

                        {error && (
                            <p className="text-red-500 text-sm text-center mb-4">
                                {error}
                            </p>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="form-input-style"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="form-input-style"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-2/3 mx-auto bg-green-600 text-white py-2 rounded hover:bg-green-700 transition flex justify-center hover:cursor-pointer"
                            >
                                Login
                            </button>
                        </form>
                    </>
                )}

            </div>

            {!loading && (
                <>
                    <span className='text-white mt-20'>
                        With this being just a sample and in order to view the whole system, I've added this :
                    </span>

                    <span
                        className='text-white mt-5 animate-bounceFade cursor-pointer select-none'
                        onClick={fillCredentials}
                    >
                        Click to fill login credentials
                    </span>
                </>
            )}
        </div >
    );
}

export default Login;