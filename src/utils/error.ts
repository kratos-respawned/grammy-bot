export const safeAwait = async <T>(promise: Promise<T>) => {
  try {
    const result = await promise;
    return { result };
  } catch (error) {
    return { error };
  }
};
