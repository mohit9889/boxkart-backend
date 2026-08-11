const { recommendSchema } = require('./box-engine.validation');
const { recommendBoxes } = require('./box-engine.service');

const recommend = async (req, res) => {
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
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    console.error('Box Finder error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

module.exports = { recommend };
