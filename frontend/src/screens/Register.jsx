import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context.jsx';
import axios from '../config/axios';
import { motion } from 'framer-motion';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { setUser } = useContext(UserContext);
    const navigate = useNavigate();

    function submitHandler(e) {
        e.preventDefault();
        setIsLoading(true);

        axios.post('/users/register', { email, password, name })
            .then((res) => {
                console.log(res.data);
                localStorage.setItem('token', res.data.token);
                setUser(res.data.user);
                navigate('/');
            })
            .catch((err) => {
                console.log(err.response.data);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-4">
            <div className="w-full max-w-2xl mx-auto p-8">
                <div className="relative flex flex-col items-center justify-center w-full h-full">
                    <div className="absolute top-0 left-0 w-full h-full bg-black opacity-80 z-0"></div>

                    {/* Enhanced glowing orbs with better positioning */}
                    <div className="absolute w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-40 animate-pulse -left-40 -top-40"></div>
                    <div className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-40 animate-pulse -right-40 -bottom-40"></div>

                    <motion.div
                        className="w-full rounded-2xl border border-gray-800 bg-black bg-opacity-80 p-12 backdrop-blur-sm z-10"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ padding: 30 }}
                    >
                        <h2 style={{marginTop:-10}} className="text-3xl text-white text-center font-['Montserrat',sans-serif] tracking-wide">Create Your Account</h2>

                        <form onSubmit={submitHandler} className="">
                            <div className="space-y-5" style={{ marginTop: 20 }}>
                                <label htmlFor="name" className="text-base font-medium text-gray-300 font-['Poppins',sans-serif] tracking-wide">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-4 mt-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-['Inter',sans-serif]"
                                        placeholder="Enter your full name"
                                        style={{padding: 3}}
                                    />
                                </div>
                            </div>

                            <div className="a space-y-5" style={{ marginTop: 20 }}>
                                <label htmlFor="email" className="text-base font-normal text-gray-300 font-['Poppins',sans-serif] tracking-wide">
                                    Email
                                </label>
                                <div className="relative">
                                    <input
                                        style={{padding: 3}}
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-4 mt-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-['Inter',sans-serif]"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="b space-y-5" style={{ marginTop: 20}}>
                                <label htmlFor="password" className="text-base font-medium text-gray-300 font-['Poppins',sans-serif] tracking-wide">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        style={{padding: 3}}
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-4 mt-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-['Inter',sans-serif]"
                                        placeholder="Create a password"
                                        required
                                    />
                                </div>
                                <p className="text-sm text-gray-500 mt-3 ml-1 font-['Inter',sans-serif]">
                                    Password must be at least 8 characters long
                                </p>
                            </div>

                            <motion.button
                                style={{marginTop: 20, padding:3}}
                                type="submit"
                                disabled={isLoading}
                                className="cursor-pointer w-full py-4 px-6 mt-8 bg-gradient-to-tr from-purple-500 to-blue-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 text-lg font-['Poppins',sans-serif] tracking-wide"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating account...
                                    </span>
                                ) : (
                                    "Create Account"
                                )}
                            </motion.button>
                        </form>

                        {/* <div className="mt-12" style={{ marginTop: 20 }}>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-800"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-black text-gray-500 text-base font-['Inter',sans-serif]">Or continue with</span>
                                </div>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-6">
                                <motion.button
                                    className="flex justify-center items-center py-3 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors duration-300 cursor-pointer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{padding:3}}
                                >
                                    <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                </motion.button>
                                <motion.button
                                    className="flex justify-center items-center py-3 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors duration-300 cursor-pointer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.477 2 2 6.477 2 12C2 16.991 5.552 21.128 10.338 21.879V14.89H7.898V12H10.338V9.797C10.338 7.291 11.893 5.907 14.136 5.907C15.192 5.907 16.303 6.102 16.303 6.102V8.467H15.095C13.937 8.467 13.524 9.218 13.524 9.98V12H16.207L15.739 14.89H13.524V21.879C18.31 21.129 21.862 16.99 21.862 12C21.862 6.477 17.384 2 11.862 2H12Z"></path>
                                    </svg>
                                </motion.button>
                            </div>
                        </div> */}

                        <div className="mt-10 text-center text-sm text-gray-500 font-['Inter',sans-serif]" style={{ marginTop: 20 }}>
                            By creating an account, you agree to our{' '}
                            <a href="#" className="text-purple-500 hover:text-purple-400">
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="#" className="text-purple-500 hover:text-purple-400">
                                Privacy Policy
                            </a>
                        </div>

                        <p className="mt-10 text-center text-base text-gray-500 font-['Inter',sans-serif]">
                            Already have an account?{' '}
                            <Link to="/login" className="text-purple-500 hover:text-purple-400 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Register;