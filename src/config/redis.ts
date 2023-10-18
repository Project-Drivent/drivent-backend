import { createClient } from 'redis';

export const DEFAULT_EXP = 30; // seconds

const redis = createClient({
  url: process.env.REDIS_URL,
});

(async () => {
  await redis.connect();
})();

export default redis;
