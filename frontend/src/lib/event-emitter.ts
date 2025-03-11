type Event<T extends Record<string, any>> = {
  [K in keyof T]?: {
    subscribers: ((payload: T[K]) => void)[];
    queue: T[K][];
  };
};

const events: Event<any> = {};

const EventEmitter = <T extends Record<string, any>>() => {
  const emit = <K extends keyof T>(event: K, data: T[K]) => {
    if (!events[event]) {
      events[event] = { subscribers: [], queue: [] };
    }

    if (events[event].subscribers.length > 0) {
      events[event].subscribers.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error('Error in subscriber:', err);
        }
      });
    } else {
      events[event].queue.push(data); // Queue the data if no subscribers
    }
  };

  const on = <K extends keyof T>(
    event: K,
    callback: (payload: T[K]) => void
  ) => {
    if (!events[event]) {
      events[event] = { subscribers: [], queue: [] };
    }
    events[event].subscribers.push(callback);

    // Process any queued events for this event type
    // (often times we would not receive events because components aren't being rendered yet)
    // This is useful so we don't have to be passing props down from a main parent component
    // and end up encapsulating all the logic as an annoying giant blob of text.
    // Would love to know what would be best in this case :thinking:
    // maybe multiple contexts with different kinds of listeners mounted from the start? idk
    events[event].queue.forEach((data) => callback(data));
    events[event].queue = [];
  };

  return { emit, on };
};

export default EventEmitter;
