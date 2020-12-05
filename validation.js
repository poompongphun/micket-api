const Joi = require("@hapi/joi");

const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .min(4)
      .max(128)
      .required()
      .pattern(new RegExp("^[a-zA-Z0-9]+$"))
      .lowercase(),
    name: Joi.string().min(4).max(128).required().replace( /  +/g, ' ' ),
    email: Joi.string().min(6).required().email().lowercase(),
    password: Joi.string().min(6).max(128).required(),
  });
  return schema.validate(data);
};

const editUserValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .min(4)
      .max(128)
      .pattern(new RegExp("^[a-zA-Z0-9]+$"))
      .lowercase(),
    name: Joi.string().min(4).max(128).replace( /  +/g, ' ' ),
    email: Joi.string().min(6).email().lowercase(),
    password: Joi.string().min(6).max(128),
  });
  return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.editUserValidation = editUserValidation;
