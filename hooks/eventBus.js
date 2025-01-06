const subscribers = new Map();

export const eventBus = {
  subscribe: (event, callback) => {
    if (!subscribers.has(event)) {
      subscribers.set(event, new Set());
    }
    subscribers.get(event).add(callback);
    return () => subscribers.get(event).delete(callback);
  },

  publish: (event, data) => {
    if (subscribers.has(event)) {
      subscribers.get(event).forEach((callback) => callback(data));
    }
  },
};
