import { IUser } from '../models/User.js'; // Import the IUser interface

declare global {
  namespace Express {
    interface User extends IUser {} // Extend Express.User with IUser
    interface Request {
      user?: IUser; // Add a user property to Express.Request
    }
  }
}
