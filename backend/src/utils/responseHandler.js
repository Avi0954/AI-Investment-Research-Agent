export const successResponse = (res, statusCode, data = null, message = null) => {
  const response = { success: true };
  if (message) response.message = message;
  if (data) response.data = data;
  
  return res.status(statusCode).json(response);
};

export const errorResponse = (res, statusCode, code, message) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};
