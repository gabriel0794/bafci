import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 1) {
      return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }
    next();
  });
};

export const staffAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 2 && req.user.role !== 1) {
      return res.status(403).json({ msg: 'Access denied. Staff or Admins only.' });
    }
    next();
  });
};
