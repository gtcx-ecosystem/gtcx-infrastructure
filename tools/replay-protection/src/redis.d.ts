declare module 'redis' {
  export interface RedisClientOptions {
    url?: string;
    socket?: { tls?: boolean; reconnectStrategy?: (retries: number) => number | false };
  }
  export interface RedisClientType {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isOpen: boolean;
    set(
      key: string,
      value: string,
      options?: { NX?: boolean; PX?: number }
    ): Promise<string | null>;
    get(key: string): Promise<string | null>;
    del(...keys: string[]): Promise<number>;
    exists(...keys: string[]): Promise<number>;
    ping(): Promise<string>;
    on(event: string, listener: (...args: any[]) => void): void;
  }
  export function createClient(options?: RedisClientOptions): RedisClientType;
}
