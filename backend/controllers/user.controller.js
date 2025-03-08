import userModel from '../models/user.model.js';
import * as userService from '../services/user.service.js';
import { validationResult } from 'express-validator';
import redisClient from '../services/redis.service.js';

export const createUserController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ erros: errors.array() })
    }

    try {
        const user = await userService.createUser(req.body);
        const token = await user.generateJWT();
        delete user._doc.password; // Delete password from response at browser inspection
        res.status(201).send({ user, token });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}


export const loginController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                errors: 'Invalid credentials'
            })
        }
        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                errors: 'Invalid Credentials'
            })
        }
        delete user._doc.password;
        const token = await user.generateJWT();
        res.status(200).json({ user, token });
    }
    catch (err) {
        res.status(400).send(err.message);
    }
}

export const profileController = async (req, res) => {
    res.status(200).json({
        user: req.user
    })
}

export const logoutController = async (req, res) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(400).send({ error: 'No token found for logout' });
        }

        // Add token to Redis blacklist with expiration (safe across Redis versions)
        await redisClient.set(`blacklist_${token}`, 'true', 'EX', 3600); // Expires in 1 hour

        res.clearCookie('token');
        res.status(200).send({ message: 'Successfully logged out, token invalidated' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
};

export const getAllUsersController = async (req, res) => {
    try {

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const allUsers = await userService.getAllUsers({ userId: loggedInUser._id });

        return res.status(200).json({
            users: allUsers
        })

    } catch (err) {

        console.log(err)

        res.status(400).json({ error: err.message })

    }
}  