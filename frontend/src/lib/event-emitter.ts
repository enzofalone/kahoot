interface Event<T = any> {
  subscribers: ((data: T) => void)[];
}

export interface EventStartGame {
  sleep: number;
}

export interface EventPrompt {
  prompt: string;
  answerBank: string[];
  sleep: number;
}

export default class EventEmitter {
  events: Record<string, Event> = {};

  emit<T>(eventName: string, data: T) {
    if (!this.events[eventName]) {
      throw new Error('Event does not exist');
    }

    this.events[eventName].subscribers.forEach((fn, i) => {
      try {
        fn(data);
      } catch (err) {
        console.log('subscriber is gone, deleting', i);
        this.events[eventName].subscribers.slice(i, 1);
      }
    });
  }

  on<T>(eventName: string, fn: (data: T) => void) {
    const e = this.events[eventName];
    if (!e) {
      return (this.events[eventName] = { subscribers: [fn] });
    }
    return e.subscribers.push(fn);
  }
}
