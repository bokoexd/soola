import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Get JWT secret with better error handling
const getJwtSecret = (): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in environment variables!');
    return 'fallback_jwt_secret_for_development_only';
  }
  return jwtSecret.replace(/[;'"]/g, '').trim();
};

const JWT_SECRET = getJwtSecret();

// Log JWT secret availability (not the actual value)
console.log('JWT_SECRET availability check:', JWT_SECRET ? 'Available' : 'Missing');

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userCount = await User.countDocuments();
    let assignedRole = 'user';
    if (userCount === 0) {
      assignedRole = 'admin'; // First user is always an admin
    } else if (role === 'admin' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Only admins can create other admin users' });
    } else if (role) {
      assignedRole = role; // Use provided role if not admin creation by non-admin
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      role: assignedRole,
    });

    await user.save();

    res.status(201).json({ message: `${assignedRole} user registered successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    console.log('Login attempt for:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Login rejected: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login rejected: User not found -', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login rejected: Invalid password for', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if JWT_SECRET is available
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not available. Cannot generate token.');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      console.log('Login successful for:', email, 'with role:', user.role);
      
      // Return user info without password and with token
      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          email: user.email,
          role: user.role
        }
      });
    } catch (jwtError) {
      console.error('JWT Sign error:', jwtError);
      return res.status(500).json({ message: 'Error generating authentication token' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error instanceof Error ? error.message : String(error) });
  }
};

export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('Access denied: No token provided');
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: 'admin' | 'user' };
      req.user = { _id: decoded.id, email: '', password: '', role: decoded.role } as IUser;
      next();
    } catch (jwtError) {
      console.error('JWT Verify error:', jwtError);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    console.error('Authorization middleware error:', error);
    res.status(500).json({ message: 'Authorization process failed', error: error instanceof Error ? error.message : String(error) });
  }
};

export const authorize = (...roles: ('admin' | 'user')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role ${req.user?.role} is not authorized to access this route` });
    }
    next();
  };
};
