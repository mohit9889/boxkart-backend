const addressService = require('./address.service');
const {
  createAddressSchema,
  updateAddressSchema
} = require('./address.validation');
const AppError = require('../../utils/AppError');

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await addressService.getAddresses(req.user.id);
    res.status(200).json({ status: 'success', data: { addresses } });
  } catch (error) {
    next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const validatedData = createAddressSchema.parse(req.body);
    const address = await addressService.createAddress(
      req.user.id,
      validatedData
    );
    res.status(201).json({ status: 'success', data: { address } });
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

const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    await addressService.deleteAddress(req.user.id, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateAddressSchema.parse(req.body);
    await addressService.updateAddress(req.user.id, id, validatedData);
    res.status(200).json({ status: 'success' });
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

module.exports = {
  getAddresses,
  createAddress,
  deleteAddress,
  updateAddress
};
