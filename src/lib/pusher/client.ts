import Pusher from "pusher-js";

let pusherClient: Pusher | null = null;

export const getPusherClient = (): Pusher | null => {
  if (pusherClient) return pusherClient;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) return null;

  pusherClient = new Pusher(key, {
    cluster,
    forceTLS: true,
  });

  return pusherClient;
};
