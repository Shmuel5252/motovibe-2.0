/**
 * extractApiErrorMessage — שולף הודעת שגיאה מתשובת axios/השרת.
 * @param {*} error
 * @param {string} fallbackMsg
 * @returns {string}
 */
export function extractApiErrorMessage(error, fallbackMsg) {
  return error?.response?.data?.error?.message || fallbackMsg;
}
