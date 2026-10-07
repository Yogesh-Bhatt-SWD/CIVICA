/**
 * Calculates a gravity score for a report based on:
 * - Severity (1–5) weighted at 10x
 * - Upvotes weighted at 2x
 * - Days elapsed since creation weighted at 0.5x (time urgency)
 *
 * @param {Object} report - Mongoose Report document
 * @returns {number} - Rounded gravity score
 */
const calculateGravityScore = (report) => {
  const daysElapsed = (Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const score = (report.severity * 10) + (report.upvotes * 2) + (daysElapsed * 0.5);
  return Math.round(score * 10) / 10;
};

module.exports = { calculateGravityScore };
