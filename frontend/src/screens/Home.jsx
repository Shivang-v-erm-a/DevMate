import React, { useContext, useState, useEffect, useRef } from 'react';
import { UserContext } from '../context/user.context.jsx';
import axios from "../config/axios";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
    const { user } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projects, setProjects] = useState([]);

    const navigate = useNavigate();

    function createProject(e) {
        e.preventDefault();
        console.log({ projectName });

        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                console.log(res);
                setIsModalOpen(false);
                // Refresh projects after creation
                fetchProjects();
                setProjectName('');
            })
            .catch((error) => {
                console.log(error);
            });
    }

    const fetchProjects = () => {
        axios.get('/projects/all').then((res) => {
            setProjects(res.data.projects);
        }).catch(err => {
            console.log(err);
        });
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return (
        <main className="min-h-screen bg-black p-8">
            <div className="relative w-full max-w-6xl mx-auto" style={{padding: 20}}>
                {/* Background effects similar to login page */}
                {/* <div className="absolute w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse left-30 top-30"></div>
                <div className="absolute w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse right-0 bottom-0"></div>
                <div className="absolute w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse -right-20 -bottom-20"></div>
                 */}

                <motion.h1 
                    className="text-5xl font-bold text-white mb-12 font-['Montserrat',sans-serif] tracking-wide"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{marginBottom: 20}}

                >
                    Your Projects
                </motion.h1>
                
                <div className="projects grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    <CardWrapper>
                        <motion.button
                            onClick={() => setIsModalOpen(true)}
                            className="h-full w-full flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 text-center"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-3">
                                <i className="ri-add-line text-xl text-white"></i>
                            </div>
                            <h2 className="text-lg font-semibold text-white font-['Poppins',sans-serif]">New Project</h2>
                        </motion.button>
                    </CardWrapper>

                    {projects.map((project) => (
                        <CardWrapper key={project._id}>
                            <motion.div
                                onClick={() => {
                                    navigate(`/project`, {
                                        state: { project }
                                    });
                                }}
                                className="h-full w-full flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 cursor-pointer text-center"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <h2 className="text-lg font-semibold text-white mb-3 font-['Poppins',sans-serif]">
                                    {project.name}
                                </h2>
                                
                                <div className="flex items-center gap-1 text-gray-400 font-['Inter',sans-serif] text-sm">
                                    <i className="ri-user-line"></i>
                                    <p>
                                        <span className="mr-1">Collaborators:</span>
                                        <span className="text-white">{project.users.length}</span>
                                    </p>
                                </div>
                            </motion.div>
                        </CardWrapper>
                    ))}
                </div>
            </div>

            {/* Modal with styling similar to login form */}
            {isModalOpen && (
                <motion.div 
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div 
                        className="w-full max-w-md rounded-2xl border border-gray-800 bg-black bg-opacity-80 p-8 backdrop-blur-sm"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{padding: 15}}
                    >
                        <h2 className="text-2xl text-white font-['Montserrat',sans-serif] tracking-wide mb-6" style={{marginBottom:10}}>Create New Project</h2>
                        <form onSubmit={createProject} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-base font-medium text-gray-300 font-['Poppins',sans-serif] tracking-wide">
                                    Project Name
                                </label>
                                <div className="relative">
                                    <input
                                        style={{padding: 3}}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        value={projectName}
                                        type="text" 
                                        className="w-full px-4 py-4 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-['Inter',sans-serif]"
                                        placeholder="Enter project name" 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4 mt-8" style={{marginTop: 20}}>
                                <motion.button 
                                    style={{padding: 3, marginRight: 10}}
                                    type="button" 
                                    className="cursor-pointer px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-all duration-300 font-['Inter',sans-serif]"
                                    onClick={() => setIsModalOpen(false)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button 
                                    style={{padding: 3}}
                                    type="submit" 
                                    className="cursor-pointer px-6 py-3 bg-gradient-to-tr from-purple-500 to-blue-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 font-['Poppins',sans-serif]"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Create Project
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </main>
    );
};

// 3D Card effect component
const CardWrapper = ({ children }) => {
    const cardRef = useRef(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [mouseLeave, setMouseLeave] = useState(true);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        
        // Calculate mouse position relative to the card
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate rotation values
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Lower intensity for subtle effect
        const rotateYValue = ((mouseX - centerX) / centerX) * 5;
        const rotateXValue = ((centerY - mouseY) / centerY) * 5;
        
        setRotateX(rotateXValue);
        setRotateY(rotateYValue);
        setMouseLeave(false);
    };

    const handleMouseLeave = () => {
        setMouseLeave(true);
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <motion.div
            ref={cardRef}
            className="relative h-40 w-full bg-transparent rounded-xl perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: mouseLeave
                    ? 'none'
                    : `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transition: mouseLeave ? 'all 0.5s ease' : 'none',
                transformStyle: 'preserve-3d',
            }}
        >
            <div 
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{
                    transform: 'translateZ(20px)',
                }}
            />
            <div 
                className="h-full w-full"
                style={{
                    transform: 'translateZ(20px)',
                    transformStyle: 'preserve-3d',
                }}
            >
                {children}
            </div>
        </motion.div>
    );
};

export default Home;