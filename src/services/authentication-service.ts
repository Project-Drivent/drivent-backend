import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dayjs from 'dayjs';
import { invalidCredentialsError } from '@/errors';
import { authenticationRepository, userRepository } from '@/repositories';
import { exclude } from '@/utils/prisma-utils';

async function signIn(params: SignInParams): Promise<SignInResult> {
  const { email, password } = params;

  const user = await getUserOrFail(email);

  await validatePasswordOrFail(password, user.password);

  const token = await createSession(user.id);

  return {
    user: exclude(user, 'password'),
    token,
  };
}

async function getUserOrFail(email: string): Promise<GetUserOrFailResult> {
  const user = await userRepository.findByEmail(email, { id: true, email: true, password: true });
  if (!user) throw invalidCredentialsError();

  return user;
}

async function createSession(userId: number) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  await authenticationRepository.createSession({
    token,
    userId,
  });

  return token;
}

async function validatePasswordOrFail(password: string, userPassword: string) {
  const isPasswordValid = await bcrypt.compare(password, userPassword);
  if (!isPasswordValid) throw invalidCredentialsError();
}

async function findOrCreateUser(email: string) {
  const userExists = await userRepository.findByEmail(email, { id: true, email: true, password: true });
  if (!userExists) {
    const newUser = await userRepository.create({
      email: email,
      password: bcrypt.hashSync(dayjs().toISOString(), 12),
    });
    return newUser;
  }
  return userExists;
}

async function fetchUserEmail(token: string) {
  const GITHUB_EMAILS_ENDPOINT = 'https://api.github.com/user/emails';
  const response = await axios.get(GITHUB_EMAILS_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const email = response.data[0] ? response.data[0].email : null;

  return email;
}

async function signInGithub(code: string): Promise<SignInResult> {
  const response = await axios.post(`https://github.com/login/oauth/access_token`, {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    code,
  });

  const tokenGithub = response.data.split('&')[0].split('=')[1];
  const email = await fetchUserEmail(tokenGithub);
  console.log('user', email);

  const user = await findOrCreateUser(email);

  const token = await createSession(user.id);

  return {
    user: exclude(user, 'password'),
    token,
  };
}

export type SignInParams = Pick<User, 'email' | 'password'>;

type SignInResult = {
  user: Pick<User, 'id' | 'email'>;
  token: string;
};

type GetUserOrFailResult = Pick<User, 'id' | 'email' | 'password'>;

export const authenticationService = {
  signIn,
  signInGithub,
};
