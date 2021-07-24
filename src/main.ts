import * as dotenv from "dotenv";

dotenv.config()

import TwitterApi, { ETwitterStreamEvent } from 'twitter-api-v2';

const client = new TwitterApi(
  {
    appKey: process.env.TWITTER_ACCESS_TOKEN,
    appSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    accessToken: process.env.TWITTER_CONSUMER_KEY,
    accessSecret: process.env.TWITTER_CONSUMER_SECRET,
  }
);

(async () => {

  const me = await client.currentUser()

  const trackList = ['#tailwind', '#tailwindcss', '#tailwindui', '#headlessui']

  const stream = await client.v1.filterStream({
    track: trackList,
  });

  stream.autoReconnect = true

  stream.autoReconnectRetries = 10

  console.log('Starting stream');

  // Awaits for a tweet
  stream.on(
    // Emitted when Node.js {response} emits a 'error' event (contains its payload).
    ETwitterStreamEvent.ConnectionError,
    err => console.log('Connection error!', err),
  );

  stream.on(
    // Emitted when Node.js {response} is closed by remote or using .close().
    ETwitterStreamEvent.ConnectionClosed,
    () => console.log('Connection has been closed.'),
  );

  stream.on(
    // Emitted when a Twitter payload (a tweet or not, given the endpoint).
    ETwitterStreamEvent.Data,
    async eventData => {
      console.log('Twitter has sent something:', eventData)

      const { user, id_str } = eventData;

      if (me.id_str !== user.id_str) {
        await client.v2.follow(me.id_str, user.id_str).catch(err => console.log(err))
        await client.v2.post(`users/${me.id_str}/retweets`, { tweet_id: id_str }).catch(err => console.log(err))
        await client.v2.like(me.id_str, id_str).catch(err => console.log(err))
      }
    },
  );

  stream.on(
    // Emitted when a Twitter sent a signal to maintain connection active
    ETwitterStreamEvent.DataKeepAlive,
    () => console.log('Twitter has a keep-alive packet.'),
  );
})();
