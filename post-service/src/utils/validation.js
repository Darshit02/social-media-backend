const joi = require("joi");

const validateCreatePost = (data) => {
  const schema = joi.object({
    content: joi.string().required(),
  });
  return schema.validate(data);
};

module.exports = {
  validateCreatePost,
};
