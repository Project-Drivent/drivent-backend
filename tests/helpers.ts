import * as jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import RedisClient from 'ioredis';
import { createUser } from './factories';
import { createSession } from './factories/sessions-factory';
import { prisma } from '@/config';

const redis = new RedisClient();

export async function cleanCache(): Promise<void> {
  await redis.flushall();
}
export async function cleanDb() {
  await prisma.address.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.ticketType.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.hotel.deleteMany({});
  await prisma.user.deleteMany({});
}

export async function generateValidToken(user?: User) {
  const incomingUser = user || (await createUser());
  const token = jwt.sign({ userId: incomingUser.id }, process.env.JWT_SECRET);

  await createSession(token);

  return token;
}
