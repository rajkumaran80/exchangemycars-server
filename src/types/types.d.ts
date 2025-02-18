import { IUser } from '../models/User'; // Import the IUser interface

declare global {
  namespace Express {
    interface User extends IUser {} // Extend Express.User with IUser
    interface Request {
      user?: User; // Add a user property to Express.Request
    }
  }
}