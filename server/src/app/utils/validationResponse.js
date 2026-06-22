/**
 * sendValidationError — תגובת 400 אחידה לשגיאות express-validator.
 * @param {import("express").Response} res
 * @param {import("express-validator").Result} errors
 */
function sendValidationError(res, errors) {
  return res.status(400).json({
    error: { code: "VALIDATION_ERROR", details: errors.array() },
  });
}

module.exports = { sendValidationError };
