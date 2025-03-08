import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context.jsx';
import axios from '../config/axios';
import { motion } from 'framer-motion';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { setUser } = useContext(UserContext);
    const navigate = useNavigate();

    function submitHandler(e) {
        e.preventDefault();
        axios.post('/users/register', { email, password })
            .then((res) => {
                console.log(res.data);
                localStorage.setItem('token', res.data.token);
                setUser(res.data.user);
                navigate('/');
            })
            .catch((err) => {
                console.log(err.response.data);
            });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
            <motion.div
                className="bg-gray-800 p-10 rounded-2xl shadow-xl w-full max-w-lg border border-gray-700"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-3xl font-semibold text-white mb-6 text-center">Create an Account</h2>
                <form onSubmit={submitHandler} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 mb-2" htmlFor="email">Email</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out placeholder-gray-400"
                            placeholder="Enter your email"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2" htmlFor="password">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out placeholder-gray-400"
                            placeholder="Enter your password"
                        />
                    </div>
                    <motion.button
                        type="submit"
                        className="w-full p-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-lg shadow-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Sign Up
                    </motion.button>
                </form>
                <p className="text-gray-400 mt-4 text-center">
                    Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
