'use strict';

const Joi = require('joi');

module.exports = {
  register(req, res, next) {
    const schema = Joi.object({
      firstName: Joi.string().required(),
      familyName: Joi.string().required(),
      email: Joi.string().email().required(),
      //confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
      password: Joi.string()
        .min(8)
        .max(30)
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/
        )
        .required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res
        .status(422)
        .send({ message: `${error.details.map((x) => x.message + ',')}` });
    } else {
      req.body = value;
      next();
    }
  },
};
