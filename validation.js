const Joi = require("@hapi/joi");

const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .min(4)
      .max(128)
      .required()
      .pattern(new RegExp("^[a-zA-Z0-9]+$"))
      .lowercase(),
    name: Joi.string().max(128).replace(/  +/g, " "),
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
    name: Joi.string().max(128).replace(/  +/g, " "),
    email: Joi.string().min(6).email().lowercase(),
    password: Joi.string().min(6).max(128),
  });
  return schema.validate(data);
};

const movieGroupValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(4).max(255).replace(/  +/g, " ").required(),
    description: Joi.string().max(1024).replace(/  +/g, " ").empty(''),
  });
  return schema.validate(data);
};

const editMovieGroupValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(4).max(255).replace(/  +/g, " "),
    description: Joi.string().max(1024).replace(/  +/g, " ").empty(''),
    detail: Joi.object({
      creator: Joi.array().items(Joi.string().max(255).replace(/  +/g, " ")),
      star: Joi.array().items(Joi.string().max(255).replace(/  +/g, " ")),
      tag: Joi.array().items(Joi.string().max(255).replace(/  +/g, " ")),
    }),
    price: Joi.number(),
    discount: Joi.number(),
    public: Joi.boolean(),
  });
  return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.editUserValidation = editUserValidation;
module.exports.movieGroupValidation = movieGroupValidation;
module.exports.editMovieGroupValidation = editMovieGroupValidation;
