import { prisma } from '@/config';

async function findHotels() {
  return prisma.hotel.findMany({
    include: {
      Rooms: true,
    },
  });
}
async function findRoomsByHotelId(hotelId: number) {
  return prisma.hotel.findFirst({
    where: {
      id: hotelId,
    },
    include: {
      Rooms: true,
    },
  });
}

export const hotelRepository = {
  findHotels,
  findRoomsByHotelId,
};
