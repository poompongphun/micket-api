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
    name: Joi.string().max(128).replace(/  +/g, " ").empty(""),
    description: Joi.string().max(1024).replace(/  +/g, " ").empty(""),
    // email: Joi.string().min(6).email().lowercase(),
  });
  return schema.validate(data);
};

const editUserPasswordValidation = (data) => {
  const schema = Joi.object({
    password: Joi.string(),
    newPassword: Joi.string().min(6).max(128),
  });
  return schema.validate(data);
};

const editUserEmailValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).required().email().lowercase(),
  });
  return schema.validate(data);
};

const movieGroupValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(4).max(255).replace(/  +/g, " ").required(),
    description: Joi.string().max(5000).replace(/  +/g, " ").empty(""),
  });
  return schema.validate(data);
};

const editMovieGroupValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(4).max(255).replace(/  +/g, " "),
    description: Joi.string().max(5000).replace(/  +/g, " ").empty(""),
    detail: Joi.object({
      creator: Joi.array().items(Joi.string().max(255).replace(/  +/g, " ")),
      star: Joi.array().items(Joi.string().max(255).replace(/  +/g, " ")),
      tag: Joi.array().items(Joi.string().max(255).replace(/  +/g, " ")),
    }),
    // poster: Joi.object({
    //   x: Joi.string().empty(""),
    //   y: Joi.string().empty(""),
    // }),
    discount: Joi.number().precision(2).max(100),
    public: Joi.boolean(),
  });
  return schema.validate(data);
};

const movieValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(4).max(255).replace(/  +/g, " "),
    price: Joi.number().precision(2),
    public: Joi.boolean(),
  });
  return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.editUserValidation = editUserValidation;
module.exports.editUserPasswordValidation = editUserPasswordValidation;
module.exports.editUserEmailValidation = editUserEmailValidation;
module.exports.movieGroupValidation = movieGroupValidation;
module.exports.editMovieGroupValidation = editMovieGroupValidation;
module.exports.movieValidation = movieValidation;
