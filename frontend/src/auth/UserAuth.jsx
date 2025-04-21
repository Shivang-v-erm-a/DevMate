import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios.js'

const UserAuth = ({ children }) => {
  const { user, setUser } = useContext(UserContext)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      navigate('/login')
      return
    }

    // Always fetch the latest user profile when the component mounts
    const verifyUser = async () => {
      try {
        const response = await axios.get('/users/profile')
        setUser(response.data.user || response.data)
        setLoading(false)
      } catch (error) {
        console.error('Authentication error:', error)
        localStorage.removeItem('token')
        navigate('/login')
      }
    }
    
    verifyUser()
  }, [navigate, setUser])

  if (loading) {
    return <div>Loading...</div>
  }

  return <>{children}</>
}

export default UserAuth