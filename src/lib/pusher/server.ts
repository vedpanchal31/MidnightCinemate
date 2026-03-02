import Pusher from "pusher";

let pusherClient: Pusher | null = null;

export const getPusherServer = (): Pusher | null => {
  if (pusherClient) return pusherClient;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    return null;
  }

  pusherClient = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherClient;
};
