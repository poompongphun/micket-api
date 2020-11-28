const Joi = require("@hapi/joi");

const createUserValidation = data => {
  const schema = Joi.object({
    username: Joi.string().min(4).required(),
    name: Joi.string().min(4).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

module.exports.createUserValidation = createUserValidation