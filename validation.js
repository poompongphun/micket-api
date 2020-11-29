const Joi = require("@hapi/joi");

const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(4).max(128).required().pattern(new RegExp('^[a-zA-Z0-9]+$')),
    name: Joi.string().min(4).max(128).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).max(128).required(),
  });
  return schema.validate(data);
};


module.exports.registerValidation = registerValidation;
