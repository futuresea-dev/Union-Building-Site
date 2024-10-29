import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();

export class GrowBooksController {

    //Grow Books API
    public async listAllGrowBooks(req: Request, res: Response) {
        try {
            let { orders } = req.body;
            // orders = "ASC" or "DESC"
            let growBooks = await dbReader.growBooks.findAll({
                attributes: ['book_id', 'book_name', 'book_description', 'book_image', 'book_price', 'book_button_label',
                'book_button_destination_link', 'book_status', 'sort_order', 'age_category'],
                include: [{
                    required: true,
                    model: dbReader.growBooksAuthor,
                    attributes: ["author_name", "book_author_id"]
                }, {
                    required: true,
                    model: dbReader.growBooksCategory,
                    attributes: ["category_name", "book_category_id"]
                }],
                where: { is_deleted: 0 },
                order: [['sort_order', orders]]
            });
            growBooks = JSON.parse(JSON.stringify(growBooks));
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                books: growBooks,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async saveGrowBook(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let { book_id = 0, book_name, book_image, book_price, book_description, age_category = 0,
                book_button_label, book_button_destination_link, book_status, book_author_id, book_category_id } = req.body;

            if (book_id) {
                await dbWriter.growBooks.update({
                    book_name: book_name,
                    book_description: book_description,
                    age_category: age_category,
                    book_image: book_image,
                    book_price: book_price,
                    book_button_label: book_button_label,
                    book_button_destination_link: book_button_destination_link,
                    book_author_id: book_author_id,
                    book_category_id: book_category_id,
                    book_status: book_status,
                    updated_by: user_id,
                }, {
                    where: { book_id: book_id }
                });
            } else {
                let sort_order = 0;
                let sortOrderData = await dbReader.growBooks.findAll({
                    attributes: [[dbReader.Sequelize.fn("MAX", dbReader.Sequelize.col("sort_order")), "sort_order"]],
                    where: { is_deleted: 0 }
                });
                if (sortOrderData.length) {
                    sortOrderData = JSON.parse(JSON.stringify(sortOrderData));
                    sort_order = sortOrderData[0].sort_order;
                    sort_order = sort_order + 1;
                }
                await dbWriter.growBooks.create({
                    book_name: book_name,
                    book_description: book_description,
                    age_category: age_category,
                    book_image: book_image,
                    book_price: book_price,
                    book_button_label: book_button_label,
                    book_button_destination_link: book_button_destination_link,
                    book_author_id: book_author_id,
                    book_category_id: book_category_id,
                    book_status: book_status,
                    sort_order: sort_order,
                    created_by: user_id,
                });
            }
            new SuccessResponse("Book saved successfully.", {
                //@ts-ignore
                token: req.token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteGrowBook(req: Request, res: Response) {
        try {
            let { book_id } = req.body;
            if (book_id) {
                await dbWriter.growBooks.update({
                    is_deleted: 1
                }, {
                    where: { book_id: book_id }
                });
            }
            new SuccessResponse("Book deleted successfully.", {
                //@ts-ignore
                token: req.token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async updateGrowBookStatus(req: Request, res: Response) {
        try {
            let { book_status, book_id } = req.body;
            if (book_status && book_id) {
                await dbWriter.growBooks.update({
                    book_status: book_status
                }, {
                    where: { book_id: book_id }
                });
            }
            new SuccessResponse("Status changed successfully.", {
                //@ts-ignore
                token: req.token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getGrowBookAuthors(req: Request, res: Response) {
        try {
            let bookAuthor = await dbReader.growBooksAuthor.findAll({
                attributes: ["book_author_id", "author_name"],
                where: { is_deleted: 0, author_status: 1 }
            });
            bookAuthor = JSON.parse(JSON.stringify(bookAuthor));
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                bookAuthorData: bookAuthor
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getGrowBookCategory(req: Request, res: Response) {
        try {
            let bookCategory = await dbReader.growBooksCategory.findAll({
                attributes: ["book_category_id", "category_name"],
                where: { is_deleted: 0, category_status: 1 }
            });
            bookCategory = JSON.parse(JSON.stringify(bookCategory));
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                bookCategoryData: bookCategory
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Grow Books Category API
    public async saveGrowBooksCategory(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let { book_category_id = 0, category_name = '', category_description = '', category_status = 1 } = req.body;

            if (book_category_id) {
                await dbWriter.growBooksCategory.update({
                    category_name: category_name,
                    category_description: category_description,
                    updated_by: user_id,
                    category_status: category_status,
                }, {
                    where: { book_category_id: book_category_id }
                });
            } else {
                let sort_order = 0;
                let sortOrderData = await dbReader.growBooksCategory.findAll({
                    attributes: [[dbReader.Sequelize.fn("MAX", dbReader.Sequelize.col("sort_order")), "sort_order"]],
                    where: { is_deleted: 0 }
                });
                if (sortOrderData.length) {
                    sortOrderData = JSON.parse(JSON.stringify(sortOrderData));
                    sort_order = sortOrderData[0].sort_order;
                    sort_order = sort_order + 1;
                }
                await dbWriter.growBooksCategory.create({
                    category_name: category_name,
                    category_description: category_description,
                    created_by: user_id,
                    category_status: 1,
                    sort_order: sort_order,
                });
            }
            new SuccessResponse("Books Category saved successfully.", {
                //@ts-ignore
                token: req.token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listAllGrowBooksCategories(req: Request, res: Response) {
        try {
            let { orders } = req.body;
            //order=ASC or DESC
            let growBooksCategories = await dbReader.growBooksCategory.findAll({
                attributes: ['book_category_id', 'category_name', 'category_description', 'category_status', 'sort_order'],
                where: { is_deleted: 0 },

                order: [['sort_order', orders]]
            });
            growBooksCategories = JSON.parse(JSON.stringify(growBooksCategories));
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                bookCategory: growBooksCategories,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteGrowBookCategory(req: Request, res: Response) {
        try {
            let { book_category_id } = req.body;
            if (book_category_id) {
                let isBookAvailable = await dbReader.growBooks.findAll({
                    attributes: ["book_category_id"],
                    where: { book_category_id: book_category_id, is_deleted: 0 }
                });
                if (isBookAvailable.length) {
                    throw new Error("Unable to delete category. Please remove associated books before attempting category deletion.");
                } else {
                    await dbWriter.growBooksCategory.update({
                        is_deleted: 1
                    }, {
                        where: { book_category_id: book_category_id }
                    });
                    // await dbWriter.growBooks.update({
                    //     is_deleted: 1
                    // }, {
                    //     where: { book_category_id: book_category_id }
                    // });
                    new SuccessResponse("Book Category deleted successfully.", {
                        //@ts-ignore
                        token: req.token,
                    }).send(res);
                }
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async updateGrowBookCategoryStatus(req: Request, res: Response) {
        try {
            let { category_status, book_category_id } = req.body;
            if (category_status && book_category_id) {
                await dbWriter.growBooksCategory.update({
                    category_status: category_status
                }, {
                    where: { book_category_id: book_category_id }
                });
            }
            new SuccessResponse("Status changed successfully.", {
                //@ts-ignore
                token: req.token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Grow Books Author API
    public async saveGrowBooksAuthor(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let { book_author_id = 0, author_name = '', author_description = '', author_image = '', author_status } = req.body;

            if (book_author_id) {
                await dbWriter.growBooksAuthor.update({
                    author_name: author_name,
                    author_description: author_description,
                    author_image: author_image,
                    updated_by: user_id,
                    // author_status: author_status,
                }, {
                    where: { book_author_id: book_author_id }
                });
            } else {
                let sort_order = 0;
                let sortOrderData = await dbReader.growBooksAuthor.findAll({
                    attributes: [[dbReader.Sequelize.fn("MAX", dbReader.Sequelize.col("sort_order")), "sort_order"]],
                    where: { is_deleted: 0 }
                });
                if (sortOrderData.length) {
                    sortOrderData = JSON.parse(JSON.stringify(sortOrderData));
                    sort_order = sortOrderData[0].sort_order;
                    sort_order = sort_order + 1;
                }
                await dbWriter.growBooksAuthor.create({
                    author_name: author_name,
                    author_description: author_description,
                    author_image: author_image,
                    author_status: author_status,
                    sort_order: sort_order,
                    created_by: user_id,
                });
            }
            new SuccessResponse("Books Author saved successfully.", {
                //@ts-ignore
                token: req.token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listAllGrowBooksAuthors(req: Request, res: Response) {
        try {
            let { orders } = req.body;
            //order=ASC or DESC
            let growBooksAuthors = await dbReader.growBooksAuthor.findAll({
                attributes: ["book_author_id", "author_name", "author_description", "author_image", "author_status", 'sort_order'],
                where: { is_deleted: 0 },

                order: [['sort_order', orders]]
            });
            growBooksAuthors = JSON.parse(JSON.stringify(growBooksAuthors));
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                bookAuthors: growBooksAuthors,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteGrowBookAuthor(req: Request, res: Response) {
        try {
            let { book_author_id } = req.body;
            if (book_author_id) {
                let isBookAvailable = await dbReader.growBooks.findAll({
                    attributes: ["book_author_id"],
                    where: { book_author_id: book_author_id, is_deleted: 0 }
                });
                if (isBookAvailable.length) {
                    throw new Error("Unable to delete author. Please remove associated books before attempting author deletion.");
                } else {
                    await dbWriter.growBooksAuthor.update({
                        is_deleted: 1
                    }, {
                        where: { book_author_id: book_author_id }
                    });
                    // await dbWriter.growBooks.update({
                    //     is_deleted: 1
                    // }, {
                    //     where: { book_author_id: book_author_id }
                    // });
                    new SuccessResponse("Book Author deleted successfully.", {
                        //@ts-ignore
                        token: req.token,
                    }).send(res);
                }
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async updateGrowBookAuthorStatus(req: Request, res: Response) {
        try {
            let { author_status, book_author_id } = req.body;
            if (author_status && book_author_id) {
                await dbWriter.growBooksAuthor.update({
                    author_status: author_status
                }, {
                    where: { book_author_id: book_author_id }
                });
            }
            new SuccessResponse("Status changed successfully.", {
                //@ts-ignore
                token: req.token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
