import { User } from '@prisma/client';
import bcrypt from 'bcrypt';

export type IUser = User;

export async function comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, hashedPassword);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}
