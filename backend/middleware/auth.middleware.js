import jwt from 'jsonwebtoken';
import redisClient from '../services/redis.service.js';

export const authUser = async (req, res, next) => {
    try {
        let token;

        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
         
     

        if (!token) {
            return res.status(401).send({ error: 'Unauthorized User - No Token Provided' });
        }

        // Check if token exists in Redis blacklist
       
        const isBlacklisted = await redisClient.get(`blacklist_${token}`);
        
        if (isBlacklisted) {
            return res.status(401).send({ error: 'Unauthorized User - Token Blacklisted' });
        }
        

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.log(err);
        
        res.status(401).send({ error: 'Unauthorized User - Invalid Token' });
        
    }
};