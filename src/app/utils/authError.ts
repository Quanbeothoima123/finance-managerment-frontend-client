export function getApiErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra.') {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
