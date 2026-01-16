export const errorResponse = (message, status) => {
  return new Response(JSON.stringify({ error: message }), {
    status: status,
    headers: { "Content-Type": "application/json" },
  });
};

export const successResponse = (data) => {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * API Response
 *
 * @param {boolean} success - Indicates whether the query was successful.
 * @param {any} data - The data returned by the query.
 * @param {string} message - A message describing the outcome of the query.
 * @returns {object} - A formatted response object.
 */
export const APIResponse = (success, data, message) => {
  return {
    success,
    data,
    message,
    dataType: typeof data,
  };
};
