// middleware/notFound.js
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Not Found - ${req.originalUrl}`,
  });
};
export default notFound;