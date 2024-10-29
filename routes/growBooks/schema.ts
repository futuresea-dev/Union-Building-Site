import Joi from 'joi';
import { join } from 'lodash';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    listAllGrowBooks: Joi.object().keys({
        orders: Joi.string().required()
    }),
    saveGrowBook: Joi.object().keys({
        book_id: Joi.number().optional().allow(null, 0),
        book_name: Joi.string().required(),
        book_image: Joi.string().required(),
        book_price: Joi.number().required(),
        age_category: Joi.number().required(),
        book_author_id: Joi.number().required(),
        book_category_id: Joi.number().required(),
        book_description: Joi.string().optional().allow(null, ''),
        book_button_label: Joi.string().optional().allow(null, ''),
        book_button_destination_link: Joi.string().optional().allow(null, ''),
        book_status: Joi.number().optional().allow(null, 1)
    }),
    deleteGrowBook: Joi.object().keys({
        book_id: Joi.number().required()
    }),
    updateGrowBookStatus: Joi.object().keys({
        book_id: Joi.number().required(),
        book_status: Joi.number().required()
    }),
    saveGrowBooksCategory: Joi.object().keys({
        book_category_id: Joi.number().optional().allow(null, 0),
        category_name: Joi.string().required(),
        category_description: Joi.string().optional().allow(null, ''),
        category_status: Joi.number().optional().allow(null, 1),
    }),
    listAllGrowBooksCategories: Joi.object().keys({
        orders: Joi.string().required(),
    }),
    deleteGrowBookCategory: Joi.object().keys({
        book_category_id: Joi.number().required(),
    }),
    updateGrowBookCategoryStatus: Joi.object().keys({
        book_category_id: Joi.number().required(),
        category_status: Joi.number().required()
    }),
    saveGrowBooksAuthor: Joi.object().keys({
        book_author_id: Joi.number().optional().allow(null, 0),
        author_name: Joi.string().required(),
        author_description: Joi.string().optional().allow(null, ''),
        author_image: Joi.string().optional().allow(null, ''),
        author_status: Joi.number().optional().allow(null, 1)
    }),
    listAllGrowBooksAuthors: Joi.object().keys({
        orders: Joi.string().required(),
    }),
    deleteGrowBookAuthor: Joi.object().keys({
        book_author_id: Joi.number().required(),
    }),
    updateGrowBookAuthorStatus: Joi.object().keys({
        book_author_id: Joi.number().required(),
        author_status: Joi.number().required()
    }),
};
