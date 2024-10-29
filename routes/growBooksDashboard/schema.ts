import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    getAllGrowBooks: Joi.object().keys({
        search: Joi.string().optional().allow(null, ''),
        priceAndDateFilter: Joi.number().optional().allow(null, ''),
        ageFilter: Joi.number().optional().allow(null, ''),
        categoryFilter: Joi.number().optional().allow(null, ''),
        priceRangeFilter: Joi.number().optional().allow(null, ''),
    }),
    getAllGrowBooksByCategory: Joi.object().keys({
        category_name: Joi.string().optional().allow(null, ''),
    }),
};
