const { recommendSchema } = require('./box-engine.validation');
const { recommendBoxes } = require('./box-engine.service');
const AppError = require('../../utils/AppError');

const recommend = async (req, res, next) => {
  try {
    const validatedData = recommendSchema.parse(req.body);

    const recommendations = await recommendBoxes(validatedData);

    res.status(200).json({
      success: true,
      data: recommendations,
      meta: {
        totalFound: recommendations.length
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return next(
        new AppError('Validation failed', {
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: error.errors
        })
      );
    }
    next(error);
  }
};

module.exports = { recommend };
