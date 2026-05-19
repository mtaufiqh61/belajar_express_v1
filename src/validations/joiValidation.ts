import Joi from "joi";

export const schemaRegisterUser = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.min': 'Name must be at least 3 characters long.',
    'string.empty': 'Name is required.'
  }),
  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: { allow: ['com', 'icloud', 'net', 'org', 'edu'] }
  }).required().messages({
    'string.email': 'Email must be a valid email address with allowed domains (com, icloud, net, org, edu).',
    'string.empty': 'Email is required.'
  }),
  password: Joi.string()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])[A-Za-z\\d\\S]{8,30}$'))
    .required()
    .messages({
      'string.pattern.base': 'Password must be 8-30 characters, include uppercase, lowercase, number, and special character.',
      'string.empty': 'Password is required.'
    })
});

export const schemaLoginUser = Joi.object({
    email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'icloud', 'net', 'org'] }
    }).required().messages({
        'string.email': 'Email must be a valid email address with allowed domains (com, icloud, net, org).',
        'string.empty': 'Email is required.'
    }),
    password: Joi.string()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])[A-Za-z\\d\\S]{8,30}$'))
    .required()
    .messages({
        'string.pattern.base': 'Password must be 8-30 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.',
        'string.empty': 'Password is required.'
    })
});

export const schemaRefreshToken = Joi.object({
    refreshToken: Joi.string().required().messages({
        'string.empty': 'Refresh token is required.'
    })
});

export const schemaCreateProduct = Joi.object({
    name: Joi.string().min(3).required().messages({
        'string.min': 'Name must be at least 3 characters long.',
        'string.empty': 'Name is required.'
    }),
    price: Joi.number().positive().required().messages({
        'number.positive': 'Price must be a positive number.',
        'number.empty': 'Price is required.'
    }),
    description: Joi.string().min(20).required().messages({
        'string.min': 'Description must be at least 20 characters long.',
        'string.empty': 'Description is required.'
    })
});