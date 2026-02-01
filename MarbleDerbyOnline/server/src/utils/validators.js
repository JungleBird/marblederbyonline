const { EMAIL_REGEX } = require("../config/constants");

/**
 * Validates an email address format.
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid, false otherwise
 */
exports.isValidEmail = (email) => {
  return email && EMAIL_REGEX.test(email);
};

/**
 * Sanitizes error messages to avoid exposing implementation details.
 * Returns generic messages for authentication failures.
 *
 * @param {string} errorType - Type of error (e.g., 'verification')
 * @returns {string} Safe error message for client
 */
exports.getSafeErrorMessage = (errorType) => {
  const messages = {
    verification: "Invalid or expired verification code.",
    auth: "Authentication failed. Please try again.",
    notFound: "Resource not found.",
  };
  return messages[errorType] || "An error occurred. Please try again.";
};
