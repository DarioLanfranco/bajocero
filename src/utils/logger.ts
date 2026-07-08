export type LogLevel = 'info' | 'warn' | 'error';

export function log(module: string, level: LogLevel, message: string, ...rest: unknown[]): void {
  const prefix = `[${module}]`;

  switch (level) {
    case 'error':
      console.error(prefix, message, ...rest);
      break;
    case 'warn':
      console.warn(prefix, message, ...rest);
      break;
    default:
      console.log(prefix, message, ...rest);
  }
}
