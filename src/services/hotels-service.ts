import { TicketStatus } from '@prisma/client';
import RedisClient from 'ioredis';
import { invalidDataError, notFoundError } from '@/errors';
import { cannotListHotelsError } from '@/errors/cannot-list-hotels-error';
import { enrollmentRepository, hotelRepository, ticketsRepository } from '@/repositories';

const redis = new RedisClient(process.env.REDIS_URL);

async function validateUserBooking(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw notFoundError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw notFoundError();

  const type = ticket.TicketType;

  if (ticket.status === TicketStatus.RESERVED || type.isRemote || !type.includesHotel) {
    throw cannotListHotelsError();
  }
}

async function getHotels(userId: number) {
  await validateUserBooking(userId);

  const cachedHotels = await redis.get('hotels');
  if (cachedHotels) {
    return JSON.parse(cachedHotels);
  }
  const hotels = await hotelRepository.findHotels();

  if (hotels.length === 0) throw notFoundError();

  await redis.set('hotels', JSON.stringify(hotels));

  return hotels;
}

async function getHotelsWithRooms(userId: number, hotelId: number) {
  await validateUserBooking(userId);

  if (!hotelId || isNaN(hotelId)) throw invalidDataError('hotelId');

  const hotelWithRooms = await hotelRepository.findRoomsByHotelId(hotelId);
  if (!hotelWithRooms) throw notFoundError();

  return hotelWithRooms;
}

export const hotelsService = {
  getHotels,
  getHotelsWithRooms,
};
