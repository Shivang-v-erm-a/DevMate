import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user.context.jsx';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  function submitHandler(e) {
    e.preventDefault();
    setIsLoading(true);

    axios.post('/users/login', {
      email,
      password
    }).then((res) => {
      console.log(res.data);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      navigate('/');
    }).catch((err) => {
      console.log(err.response.data);
    }).finally(() => {
      setIsLoading(false);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md mx-auto p-8 ">
        <div className="relative flex flex-col items-center justify-center p-12">
          <div className="absolute top-0 left-0 w-full h-full opacity-80 z-0"></div>
          
          {/* Enhanced glowing orbs with better positioning */}
          <div className="absolute w-60 h-60 bg-purple-500 rounded-full blur-3xl opacity-40 animate-pulse -left-40 -top-30"></div>
          <div className="absolute w-60 h-60 bg-blue-500 rounded-full blur-3xl opacity-40 animate-pulse -right-30 -bottom-30"></div>
          
           
          <motion.div
            className="w-full rounded-2xl border border-gray-800 bg-black bg-opacity-80 p-8 backdrop-blur-sm z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl text-white text-center font-['Montserrat',sans-serif] tracking-wide mb-8" style={{marginTop: 20}}>Welcome Back</h2>
            
            <div className="" style={{padding: 30}}>
            <form onSubmit={submitHandler} className="space-y-8">
              <div className="m-8" >
                <label htmlFor="email" className="text-base font-medium text-gray-300 font-['Poppins',sans-serif] tracking-wide">
                  Email
                </label>
                   
                    <div className="relative" style={{marginBottom: 20}}>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-['Inter',sans-serif]"
                    placeholder="Enter your email"
                    style={{padding: 5}}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-base font-medium text-gray-300 font-['Poppins',sans-serif] tracking-wide">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-purple-500 hover:text-purple-400 font-['Inter',sans-serif]">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative" style={{marginBottom: 20}}>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 mt-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-['Inter',sans-serif]"
                    style={{padding: 5}}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
              
              <motion.button
                style={{padding: 5}}
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 mt-8 bg-gradient-to-tr from-purple-500 to-blue-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 text-lg font-['Poppins',sans-serif] tracking-wide cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </motion.button>
            </form>
            
            {/* <div className="mt-10" style={{marginTop: 20}}>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-black text-gray-500 text-base font-['Inter',sans-serif]">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <motion.button
                  className="flex justify-center items-center p-10 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors duration-300 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{padding: 3}}
                >
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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
            
            <p className="mt-8 text-center text-base text-gray-500 font-['Inter',sans-serif]" style={{marginTop: 10}}>
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-500 hover:text-purple-400 font-medium">
                Sign up
              </Link>
            </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;