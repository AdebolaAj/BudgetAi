export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    if (process.env.NODE_ENV !== 'production') {
      return error.message;
    }
  }

  return fallback;
}
