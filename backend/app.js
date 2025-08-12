import express from 'express';
import morgan from 'morgan';
import './db/db.js';
import userRoutes from '../backend/routes/user.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();

// Updated CORS with your actual Vercel URL
app.use(cors({
  origin: [
    'https://dev-mate-vufn-shivangs-projects-a06d8dc8.vercel.app', // Your actual Vercel URL
    'https://dev-mate-vufn.vercel.app', // Alternative URL format
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add preflight handling
app.options('*', cors());

app.use(morgan('dev'))
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);

app.get('/', (req,res)=>{
    res.send('Hello World')
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

export default app;