const RateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('service-claire/services/redis');

const limiter = new RateLimit({
  windowMs: /* 1 second */ 1000,
  max: 1000, // 1000 requests per second
  delayMs: 0,
  store: new RedisStore({
    expiry: /* 1 minute */ 60,
    client: redis,
    prefix: 'rl-suggestions:',
  }),
});

module.exports = limiter;
