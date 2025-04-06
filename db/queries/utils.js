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
