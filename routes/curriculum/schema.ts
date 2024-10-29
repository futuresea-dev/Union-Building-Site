import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";

const EC = new ErrorController();

export default {
    listPostsPayload: Joi.object().keys({
        search: Joi.string().allow(null, ''),
        page_record: Joi.number().allow(null, ''),
        page_no: Joi.number().allow(null, '', 0),
        sort_order: Joi.string().allow(null, ''),
        sort_field: Joi.string().allow(null, ''),
        content_type_id: Joi.number().allow('', 0),
        category_id: Joi.number().allow('', 0),
        page_id: Joi.number().allow('', 0),
        is_from_old: Joi.number().allow(0, 1),
        post_ids: Joi.array(),
        ministry_type: Joi.number().required()
            .label("Ministry type")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Ministry type"])
            }),
    }),

    postPayload: Joi.object().keys({
        post_id: Joi.number().allow(null, '', 0),
        page_id: Joi.number().allow(null, '', 0),
        sort_order: Joi.number().allow(null, 0),
        post_title: Joi.string().allow(null, ''),
        post_description: Joi.string().allow(null, ''),
        post_image: Joi.string().allow(null, ''),
        post_video: Joi.string().allow(null, ''),
        category_id: Joi.number().allow(0, 1),
        ministry_type: Joi.number().allow(0, 1),
        is_locked: Joi.number().allow(0, 1),
        is_coming_soon: Joi.number().allow(0, 1),
        is_from_old: Joi.number().allow(0, 1),
        post_meta: Joi.array().allow(""),
        selected_pages: Joi.array().allow(""),
        is_hidden: Joi.number().optional().allow(null, 0),
        content_type_id: Joi.number().required()
            .label("Content type id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Content type id"])
            }),
    }),

    pagePayload: Joi.object().keys({
        page_id: Joi.number().allow(null, 0, ""),
        category_id: Joi.number().allow(null, "", 0),
        page_description: Joi.string().allow(null, ''),
        page_image: Joi.string().allow(null, ''),
        page_icon: Joi.string().allow(null, ''),
        page_link: Joi.string().allow(null, ''),
        page_slug: Joi.string().allow(null, ''),
        page_title: Joi.string().required()
            .label("Page title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Page title"]),
                'any.empty': EC.errorMessage(EC.required, ["Page title"])
            }),
        accessible_type: Joi.number().required()
            .label("Accessible Type")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Accessible Type"])
            }),
        ministry_type: Joi.number().required()
            .label("Ministry type")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Ministry type"]),
                'any.empty': EC.errorMessage(EC.required, ["Ministry type"])
            }),
        is_ministry_page: Joi.number().required()
            .label("Is ministry page")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Is ministry page"]),
                'any.empty': EC.errorMessage(EC.required, ["Is ministry page"])
            }),
        page_meta: Joi.array(),
        is_hidden: Joi.number().optional().allow(null, 0),
    }),

    idParams: Joi.object().keys({
        id: Joi.number().min(1).required()
    }),

    categoryIdPayload: Joi.object().keys({
        category_id: Joi.number().min(1).required()
    }),

    updateSeriesMemoryVerseDetailsPayload: Joi.object().keys({
        category_id: Joi.number().required(),
        page_link_id: Joi.number().allow('', 0),
        categories_detail_id: Joi.number().allow('', 0),
        detail_value: Joi.object().required()
    }),

    volumePayload: Joi.object().keys({
        category_id: Joi.number().allow('', 0, null),
        category_image: Joi.string().allow(null, ''),
        parent_category_id: Joi.number().allow('', 0, null),
        category_title: Joi.string().required()
            .label("Volume title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Volume title"]),
                'any.empty': EC.errorMessage(EC.required, ["Volume title"])
            }),
    }),

    seriesListPayload: Joi.object().keys({
        category_id: Joi.number().allow(0, ''),
        ministry_type: Joi.number().required()
            .label("Ministry type")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Ministry type"]),
                'any.empty': EC.errorMessage(EC.required, ["Ministry type"])
            }),
        search: Joi.string().allow(null, ''),
        category_ids: Joi.array()
    }),

    addSeriesPayload: Joi.object().keys({
        category_image: Joi.string().allow(null, ''),
        ministry_type: Joi.number().allow(0, '', null),
        parent_category_id: Joi.number().allow(0, '', null),
        category_title: Joi.string().required()
            .label("Volume title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Volume title"]),
                'any.empty': EC.errorMessage(EC.required, ["Volume title"])
            }),
        total_week: Joi.number().required()
            .label("Total week")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Total week"]),
                'any.empty': EC.errorMessage(EC.required, ["Total week"])
            }),
            category_id: Joi.string().allow(null, '')
    }),

    savePageSeriesPayload: Joi.object().keys({
        page_id: Joi.number().required()
            .label("Page id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Page id"]),
                'any.empty': EC.errorMessage(EC.required, ["Page id"])
            }),
        content_type_id: Joi.number().required()
            .label("Content type id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Content type id"]),
                'any.empty': EC.errorMessage(EC.required, ["Content type id"])
            }),
        selected_series: Joi.array(),
    }),

    getPageSeriesPayload: Joi.object().keys({
        page_id: Joi.number().required()
            .label("Page id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Page id"]),
                'any.empty': EC.errorMessage(EC.required, ["Page id"])
            }),
        content_type_id: Joi.number().required()
            .label("Content type id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Content type id"]),
                'any.empty': EC.errorMessage(EC.required, ["Content type id"])
            }),
    }),

    getPostDetailsPayload: Joi.object().keys({
        page_id: Joi.number().allow(0, '', null),
        post_id: Joi.number().required()
            .label("Post id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Post id"]),
                'any.empty': EC.errorMessage(EC.required, ["Post id"])
            }),
    }),

    savePagePostsPayload: Joi.object().keys({
        page_id: Joi.number().required()
            .label("Page id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Page id"]),
                'any.empty': EC.errorMessage(EC.required, ["Page id"])
            }),
        content_type_id: Joi.number().required()
            .label("Content type id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Content type id"]),
                'any.empty': EC.errorMessage(EC.required, ["Content type id"])
            }),
        selected_posts: Joi.array(),
    }),

    seriesEmailSavePayload: Joi.object().keys({
        mail_chimp_json: Joi.string().allow('', null),
        series_email_id: Joi.number().allow(0, '', null),
        mail_chimp_id: Joi.number().allow(0, '', null),
        mail_chimp_link: Joi.string().allow('', null),
        series_type: Joi.number().allow(1, 2),
        week_number: Joi.number(),
        page_content: Joi.string().allow('', null),
        page_content_link: Joi.string().allow('', null),
        category_id: Joi.number().required()
            .label("Category id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Category id"]),
                'any.empty': EC.errorMessage(EC.required, ["Category id"])
            }),
        series_page_title: Joi.string().required()
            .label("Series email title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Series email title"]),
                'any.empty': EC.errorMessage(EC.required, ["Series email title"])
            }),
    }),

    validateLinkPayload: Joi.object().keys({
        data_id: Joi.number().allow('', 0),
        link_type: Joi.string().allow(0, 1),
        site_id: Joi.number().required()
            .label("Site id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Site id"]),
                'any.empty': EC.errorMessage(EC.required, ["Site id"])
            }),
        title: Joi.string().required()
            .label("Title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Title"]),
                'any.empty': EC.errorMessage(EC.required, ["Title"])
            }),
    }),

    updateSeriesDetailsPayload: Joi.object().keys({
        categories_details: Joi.array(),
        category_image: Joi.string().allow(null, ''),
        ministry_type: Joi.number().required()
            .label("Ministry type")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Ministry type"]),
                'any.empty': EC.errorMessage(EC.required, ["Ministry type"])
            }),
        category_id: Joi.number().required()
            .label("Category id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Category id"]),
                'any.empty': EC.errorMessage(EC.required, ["Category id"])
            }),
        category_title: Joi.string().required()
            .label("Category title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Category title"]),
                'any.empty': EC.errorMessage(EC.required, ["Category title"])
            }),
        total_week: Joi.number().required()
            .label("Total week")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Total week"]),
                'any.empty': EC.errorMessage(EC.required, ["Total week"])
            }),

        is_hidden: Joi.number(),
        created_by: Joi.number(),
        updated_by: Joi.number(),
        created_datetime: Joi.date(),
        updated_datetime: Joi.date(),
    }),

    pageListPayload: Joi.object().keys({
        category_id: Joi.number().allow(0, ''),
        ministry_type: Joi.number().allow(0, ''),
    }),

    getAllNewsFeedsPayload: Joi.object().keys({
        page_id: Joi.number().allow(0, ''),
        category_id: Joi.number().required()
            .label("Category id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Category id"]),
                'any.empty': EC.errorMessage(EC.required, ["Category id"])
            }),
    }),

    listAllNewsFeedsPayload: Joi.object().keys({
        page_no: Joi.number().allow(null, '', 0),
        category: Joi.array(),
        page_id: Joi.number().required()
            .label("Page id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Page id"]),
                'any.empty': EC.errorMessage(EC.required, ["Page id"])
            }),
    }),

    publishPagePayload: Joi.object().keys({
        is_publish: Joi.boolean().allow(true, false),
        page_id: Joi.number().required()
            .label("Page id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Page id"]),
                'any.empty': EC.errorMessage(EC.required, ["Page id"])
            }),
    }),

    saveTipVideosPayload: Joi.object().keys({
        tip_video_id: Joi.number().allow('', 0),
        video_cc: Joi.string().allow(''),
        category_id: Joi.number().required()
            .label("Category id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Category id"]),
                'any.empty': EC.errorMessage(EC.required, ["Category id"])
            }),
        ministry_type: Joi.number().required()
            .label("Ministry type")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Ministry type"]),
                'any.empty': EC.errorMessage(EC.required, ["Ministry type"])
            }),
        video_title: Joi.string().required()
            .label("Video title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Video title"]),
                'any.empty': EC.errorMessage(EC.required, ["Video title"])
            }),
        video_url: Joi.string().required()
            .label("Video url")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Video url"]),
                'any.empty': EC.errorMessage(EC.required, ["Video url"])
            }),
    }),

    listTipVideosPayload: Joi.object().keys({
        search: Joi.string().allow(''),
        category_id: Joi.number().required()
            .label("Category id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Category id"]),
                'any.empty': EC.errorMessage(EC.required, ["Category id"])
            }),
        ministry_type: Joi.number().required()
            .label("Ministry type")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Ministry type"]),
                'any.empty': EC.errorMessage(EC.required, ["Ministry type"])
            }),
    }),

    getPageLinkDataPayload: Joi.object().keys({
        page_link_id: Joi.number().allow('', 0),
        data_id: Joi.number().required(),
        detail_id: Joi.number().allow(0, ''),
        site_id: Joi.number().required(),
        keyword: Joi.string().allow(''),
        ui_component: Joi.string().allow(''),
        link_type: Joi.number().required(),
        target_url: Joi.string().allow('')
    }),

    pageLinkPayload: Joi.object().keys({
        keyword: Joi.string().required()
            .label("Keyword")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Keyword"]),
                'any.empty': EC.errorMessage(EC.required, ["Keyword"])
            }),
        site_id: Joi.number().required()
            .label("Site id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Site id"]),
                'any.empty': EC.errorMessage(EC.required, ["Site id"])
            }),
    }),

    saveSeriesTutorialsPayload: Joi.object().keys({
        category_id: Joi.number().required()
            .label("Category id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Category id"]),
                'any.empty': EC.errorMessage(EC.required, ["Category id"])
            }),
        detail_key: Joi.string().required()
            .label("Detail Key")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Detail Key"]),
                'any.empty': EC.errorMessage(EC.required, ["Detail Key"])
            }),
        detail_value: Joi.array().required()
            .label("Detail value")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Detail value"]),
                'any.empty': EC.errorMessage(EC.required, ["Detail value"])
            }),
    }),

    getVolumeSeriesPayload: Joi.object().keys({
        category_id: Joi.number().min(1).required(),
        ministry_type: Joi.number().min(1).required()
    }),

    postFoldersPayload: Joi.object().keys({
        post_folder_id: Joi.number().allow('', 0),
        is_multi_media_enable: Joi.number().allow(null, 0, 1),
        post_id: Joi.number().required()
            .label("Post id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Post id"]),
                'any.empty': EC.errorMessage(EC.required, ["Post id"])
            }),
        title: Joi.string().required()
            .label("Title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Title"]),
                'any.empty': EC.errorMessage(EC.required, ["Title"])
            }),
        description: Joi.string().allow(null, ''),
        color_code: Joi.string().allow(null, ''),
        media_link: Joi.string().allow(null, ''),
        lesson_builder_link1: Joi.string().allow(null, ''),
        lesson_builder_link2: Joi.string().allow(null, ''),
        multi_media_link: Joi.array(),
    }),

    updateSeriesResourcesPayload: Joi.object().keys({
        category_id: Joi.number().required(),
        categories_detail_id: Joi.number().allow('', 0),
        detail_value: Joi.object().required()
    }),

    updatePageTitlePayload: Joi.object().keys({
        page_title: Joi.string().required()
            .label("Page title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Page title"]),
                'any.empty': EC.errorMessage(EC.required, ["Page title"])
            }),
        page_id: Joi.number().required()
            .label("Page id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Page id"])
            })
    }),
};
