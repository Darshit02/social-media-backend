const joi = require("joi");

const validateCreatePost = (data) => {
  const schema = joi.object({
    content: joi.string().required(),
  });
  return schema.validate(data);
};

const validateCreateComment = (data) => {
  const schema = joi.object({
    postId: joi.string().required(),
    content: joi.string().required(),
    userId: joi.string().required(),
  });
  return schema.validate(data);
};

module.exports = {
  validateCreatePost,
  validateCreateComment,
};
