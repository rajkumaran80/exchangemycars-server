import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const userRoutes = express.Router();
// // User Registration
// router.post('/register', async (req, res) => {
//   const { name, email, password } = req.body;
//   try {
//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }
//     // Hash the password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
//     // Create a new user
//     const newUser = new User({
//       name,
//       email,
//       password: hashedPassword,
//     });
//     await newUser.save();
//     // Generate a JWT token
//     const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET!, {
//       expiresIn: '1h',
//     });
//     res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
//   } catch (error) {
//     console.error('Error during registration:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
// // User Login
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     // Check if user exists
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }
//     // Validate password
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }
//     // Generate a JWT token
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
//       expiresIn: '1h',
//     });
//     res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
//   } catch (error) {
//     console.error('Error during login:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
export { userRoutes };
