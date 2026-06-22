import Joi from "joi"

export const updateMyProfileValidator = Joi.object({

       contact : Joi.object({
              email : Joi.string().email() ,
              phone: Joi.string()
                       .pattern(/^[0-9]{10}$/)
                       .messages({
                                  "string.pattern.base": "Phone number must be exactly 10 digits."
                                })
       })
       .min(1)
       .required() 

});

