
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Use environment variable in production

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
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token, user: { email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: 'admin' | 'user' };
    req.user = { _id: decoded.id, email: '', password: '', role: decoded.role } as IUser;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
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
