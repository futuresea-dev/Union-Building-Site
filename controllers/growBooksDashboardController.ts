import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();

export class GrowBooksDashboardController {

    //Grow Books Dashboard API
    public async getAllGrowBooks(req: Request, res: Response) {
        try {
            let { search = "", priceAndDateFilter, ageFilter, categoryFilter, priceRangeFilter } = req.body;
            let searchCondition = dbReader.Sequelize.Op.ne, searchData = null, ageCategoryCondition: any = {},
                categoryCondition: any = {}, priceRangeCondition: any = {};
            if (search) {
                searchCondition = dbReader.Sequelize.Op.like;
                searchData = "%" + search + "%";
            }
            if (ageFilter) {
                // 1 = kids, 2 = students, 3 = adults
                ageCategoryCondition = { age_category: ageFilter };
            }
            if (categoryFilter) {
                // Take book_category_id
                categoryCondition = { book_category_id: categoryFilter };
            }
            if (priceRangeFilter) {
                // priceRangeFilter => 1 = Under $20, 2 = Under $10, 3 = Free
                switch (priceRangeFilter) {
                    case 1:
                        priceRangeCondition = { book_price: { [dbReader.Sequelize.Op.lt]: 20 } };
                        break;
                    case 2:
                        priceRangeCondition = { book_price: { [dbReader.Sequelize.Op.lt]: 10 } };
                        break;
                    case 3:
                        priceRangeCondition = { book_price: { [dbReader.Sequelize.Op.eq]: 0 } };
                        break;
                    default:
                        break;
                }
            }
            let growBooks = await dbReader.growBooks.findAll({
                attributes: ['book_id', 'book_name', 'book_description', 'book_image', 'book_price', 'book_category_id',
                    'book_button_label', 'book_button_destination_link', 'book_status', 'sort_order', 'age_category', 'created_datetime'],
                include: [{
                    model: dbReader.growBooksAuthor,
                    attributes: ["author_name", "book_author_id"]
                }, {
                    model: dbReader.growBooksCategory,
                    attributes: ["category_name", "book_category_id"]
                }],
                where: dbReader.Sequelize.and({ is_deleted: 0, book_status: 1 }, ageCategoryCondition, categoryCondition, priceRangeCondition,
                    dbReader.Sequelize.or(
                        { book_name: { [searchCondition]: searchData } },
                        { '$grow_books_author.author_name$': { [searchCondition]: searchData } },
                        { '$grow_books_category.category_name$': { [searchCondition]: searchData } }
                    )),
                order: [['sort_order', "DESC"]]
            });
            growBooks = JSON.parse(JSON.stringify(growBooks));
            if (priceAndDateFilter) {
                // highToLow = 2, lowToHigh = 1, 3 = publicationDate
                switch (priceAndDateFilter) {
                    case 1:
                        growBooks = growBooks.sort((a: any, b: any) => {
                            return a.book_price - b.book_price
                        })
                        break;
                    case 2:
                        growBooks = growBooks.sort((a: any, b: any) => {
                            return b.book_price - a.book_price
                        })
                        break;
                    case 3:
                        growBooks = growBooks.sort((a: any, b: any) => {
                            return b.created_datetime - a.created_datetime
                        })
                        break;
                    default:
                        growBooks
                        break;
                }
            }
            new SuccessResponse(EC.success, {
                books: growBooks,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getGrowBookCategories(req: Request, res: Response) {
        try {
            let bookCategory = await dbReader.growBooksCategory.findAll({
                attributes: ["book_category_id", "category_name"],
                where: { is_deleted: 0, category_status: 1 }
            });
            bookCategory = JSON.parse(JSON.stringify(bookCategory));
            new SuccessResponse(EC.success, {
                bookCategoryData: bookCategory
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getTopFourGrowBooks(req: Request, res: Response) {
        try {
            let growBooks = await dbReader.growBooks.findAll({
                attributes: ['book_id', 'book_name', 'book_description', 'book_image', 'book_price',
                    'book_button_label', 'book_button_destination_link', 'book_status', 'sort_order', 'age_category'],
                include: [{
                    model: dbReader.growBooksAuthor,
                    attributes: ["author_name", "book_author_id"]
                }, {
                    model: dbReader.growBooksCategory,
                    attributes: ["category_name", "book_category_id"]
                }],
                where: { is_deleted: 0, book_status: 1 },
                limit: 4,
                order: [['sort_order', "DESC"]]
            });
            growBooks = JSON.parse(JSON.stringify(growBooks));
            new SuccessResponse(EC.success, {
                books: growBooks,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // public async getAllGrowBooksByCategory(req: Request, res: Response) {
    //     try {
    //         let { category_name = "" } = req.body;
    //         let searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
    //         if (category_name) {
    //             searchCondition = dbReader.Sequelize.Op.like;
    //             searchData = "%" + category_name + "%";
    //         }
    //         let growBooks = await dbReader.growBooks.findAll({
    //             attributes: ['book_id', 'book_name', 'book_description', 'book_image', 'book_price',
    //                 'book_button_label', 'book_button_destination_link', 'book_status', 'sort_order', 'age_category'],
    //             include: [{
    //                 model: dbReader.growBooksAuthor,
    //                 attributes: ["author_name", "book_author_id"]
    //             }, {
    //                 model: dbReader.growBooksCategory,
    //                 attributes: ["category_name", "book_category_id"]
    //             }],
    //             where: dbReader.Sequelize.and({ is_deleted: 0, book_status: 1 },
    //                 dbReader.Sequelize.or(
    //                     { '$grow_books_category.category_name$': { [searchCondition]: searchData } },
    //                 )),
    //             order: [['sort_order', "ASC"]]
    //         });
    //         growBooks = JSON.parse(JSON.stringify(growBooks));
    //         new SuccessResponse(EC.success, {
    //             books: growBooks,
    //         }).send(res);
    //     } catch (e: any) {
    //         ApiError.handle(new BadRequestError(e.message), res);
    //     }
    // }
}
