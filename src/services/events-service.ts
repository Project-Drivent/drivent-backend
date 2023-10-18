import { Event } from '@prisma/client';
import dayjs from 'dayjs';
import { notFoundError } from '@/errors';
import { eventRepository } from '@/repositories';
import { exclude } from '@/utils/prisma-utils';
import redis from '@/config/redis';

async function getFirstEvent(): Promise<GetFirstEventResult> {
  const cachedEvent = await redis.get('firstEvent');
  if (cachedEvent) {
    return JSON.parse(cachedEvent);
  }

  const event = await eventRepository.findFirst();
  if (!event) throw notFoundError();

  const eventInfo = exclude(event, 'createdAt', 'updatedAt');
  await redis.set('firstEvent', JSON.stringify(eventInfo));
  return eventInfo;
}

export type GetFirstEventResult = Omit<Event, 'createdAt' | 'updatedAt'>;

async function isCurrentEventActive(): Promise<boolean> {
  const event = await eventRepository.findFirst();
  if (!event) return false;

  const now = dayjs();
  const eventStartsAt = dayjs(event.startsAt);
  const eventEndsAt = dayjs(event.endsAt);

  return now.isAfter(eventStartsAt) && now.isBefore(eventEndsAt);
}

export const eventsService = {
  getFirstEvent,
  isCurrentEventActive,
};
