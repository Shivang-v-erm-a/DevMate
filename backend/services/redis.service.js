// Mocked Redis client for local/dev environment
// import Redis from 'ioredis';

const redisClient = {
    get: async () => null,
    set: async () => null,
    del: async () => null,
    on: () => {},
};

export default redisClient;