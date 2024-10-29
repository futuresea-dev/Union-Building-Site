import Joi, { array } from 'joi';
import { join } from 'lodash';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    membershipPayload: Joi.object().keys({
        membership_id: Joi.number().allow(null, 0),
        product_id: Joi.array().allow(null, 0),
        page_id: Joi.number().allow(null, 0),
        // page_id: Joi.number()
        //     .required()
        //     .messages({
        //         'any.required': EC.errorMessage(EC.required, ["Page id"])
        //     }),
        membership_name: Joi.string()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Membership name"])
            }),
        membership_type: Joi.number()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Membership type"])
            }),
        status: Joi.number()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Status"])
            }),
        site_id: Joi.number()
            .required()
            .label("site id")
            .greater(0)
            .messages({
                "this.required": EC.errorMessage(EC.required, ["site id"]),
            })
    }),
    subscriptionListPayload: Joi.object().keys({
        subscription_id: Joi.number().allow(null).messages({
            'any.required': EC.subscriptionIdMessageError
        }),
        user_id: Joi.number().allow(null).messages({
            'any.required': EC.userIdMessageError
        })
    }),
    productFolderPayload: Joi.object().keys({
        product_folder_id: Joi.number().allow(null, 0),
        parent_folder_id: Joi.number().allow(null, 0),
        folder_name: Joi.string()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Folder name"])
            })
    }),
    productPayload: Joi.object().keys({
        product_id: Joi.number().allow(null, 0),
        is_recurring_product: Joi.number().allow(null, 1),
        site_id: Joi.number()
            .required()
            .label("site id")
            .greater(0)
            .messages({
                "this.required": EC.errorMessage(EC.required, ["site id"]),
            }),
        product_folder_id: Joi.number().allow(null, 0),
        in_stock: Joi.number().allow(null, 0),
        tax_in_percentage: Joi.number().allow(null, 0),
        tax_in_amount: Joi.number().allow(null, 0),
        shipping_fees: Joi.number().allow(null, 0),
        processing_fees: Joi.number().allow(null, 0),
        category_id: Joi.number().allow(null, 0),
        product_description: Joi.string().allow(null, ""),
        product_image: Joi.string().allow(null, ""),
        product_name: Joi.string()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Product name"])
            }),
        product_price: Joi.number()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Product price"])
            }),
        product_duration: Joi.number()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Product duration"])
            }),
        ministry_type: Joi.number().required(),
        product_type: Joi.number().required(),
        is_ministry_page: Joi.number().allow(null, 0),
        is_shippable: Joi.number().allow(null, 0),
        is_hidden: Joi.number().allow(null, 0, 1)
    }),
    confirmPagePayload: Joi.object().keys({
        product_id: Joi.array()
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["Product id"]),
                "this.empty": EC.errorMessage(EC.required, ["Product id"]),
                "this.type": EC.errorMessage(EC.typeNumber, ["Product id"])
            }),
        site_id: Joi.number()
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["Site id"]),
                "this.empty": EC.errorMessage(EC.required, ["Site id"]),
                "this.type": EC.errorMessage(EC.typeNumber, ["Site id"])
            }),
        return_url: Joi.string()
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["Return URL"]),
                "this.empty": EC.errorMessage(EC.required, ["Return URL"]),
                "this.type": EC.errorMessage(EC.typeString, ["Return URL"])
            })
    }),
    orderNotesPayload: Joi.object().keys({
        note_id: Joi.number().allow(null, 0),
        is_customer: Joi.number().allow(null, 0),
        type: Joi.number()
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["Type"]),
            }),
        event_type_id: Joi.number()
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["Event type id"]),
            }),
        message: Joi.string()
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["Message"]),
            })
    }),
    saveUserMembershipPayload: Joi.object().keys({
        user_subscription_id: Joi.number()
            .label("user subscription id")
            .allow(null, 0),
        start_date: Joi.date()
            .label("start date")
            .allow(null, '')
            .messages({
                "this.required": EC.errorMessage(EC.required, ["start date"]),
            }),
        expires: Joi.date()
            .label("expires")
            .allow(null, ''),
        user_orders_id: Joi.number()
            .label("user orders id")
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["user orders id"]),
            }),
        user_membership_id: Joi.number()
            .label("user membership id")
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["user membership id"]),
            }),
        // membership_id: Joi.number()
        //     .label("membership id")
        //     .required()
        //     .messages({
        //         "this.required": EC.errorMessage(EC.required, ["membership id"]),
        //     }),
        membership_id: Joi.array().required(),
        user_id: Joi.number()
            .label("user id")
            .required(),
        status: Joi.number()
            .label("status")
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["status"]),
            }),
        site_id: Joi.number()
            .required()
            .label("site id")
            //.greater(0)
            .messages({
                "this.required": EC.errorMessage(EC.required, ["site id"]),
            })
    }),
    productFolderIdParams: Joi.object().keys({
        id: Joi.number().min(1).required()
    }),
    productParams: Joi.object().keys({
        id: Joi.number().min(1).required()
    }),
    uniqueProductParams: Joi.object().keys({
        user_id: Joi.number().min(1).required()
    }),
    listAllProductsPayload: Joi.object().keys({
        site_id: Joi.number()
            .required()
            .label("site id")
            .greater(0)
            .messages({
                "this.required": EC.errorMessage(EC.required, ["site id"]),
            }),
        sort_order: Joi.string().allow(null, ""),
        search: Joi.string().allow(null, ""),
        sort_field: Joi.string().allow(null, ""),
        page_record: Joi.number().allow(null, 0),
        page_no: Joi.number().allow(null, 0),
        filter: Joi.array().allow(null, 0),
        category_id: Joi.number().allow(null, 0)
    }),

    listCouponPayload: Joi.object().keys({
        site_id: Joi.number().min(1).required(),
        search: Joi.string().allow(null, ""),
        page_record: Joi.number().allow(null, 0),
        page_no: Joi.number().allow(null, 0),
        sort_field: Joi.string().allow(null, ""),
        sort_order: Joi.string().allow(null, ""),
        coupon_filter: Joi.number().allow(null, 0),
    }),

    saveCouponPayload: Joi.object().keys({
        coupon_code: Joi.string().min(1).required(),
        coupon_description: Joi.string().allow(null, ""),
        rate_type: Joi.number().min(1).required(),
        rate: Joi.number().min(1).required(),
        product_id: Joi.array().allow(null, 0),
        site_id: Joi.number().min(1).required(),
        coupon_id: Joi.number().allow(null, 0),
        coupon_expire_date_time: Joi.string().allow(null, ""),
        max_limit: Joi.number().allow(null, 0),
        user_used_limit: Joi.number().allow(null, 0),
        min_cart_amount: Joi.number().allow(null, 0)
    }),
    getUserActiveMembershipPayload: Joi.object().keys({
        page_record: Joi.number().allow("", null, 0),
        page_no: Joi.number().allow("", null, 0),
        sort_order: Joi.string().allow("", null),
        sort_field: Joi.string().allow("", null),
        user_id: Joi.number()
            .label("user id")
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["user id"]),
            }),
    }),
    idParams: Joi.object().keys({
        id: Joi.number().min(1).required()
    }),
    saveShippingAddressPayload: Joi.object().keys({
        user_id: Joi.number().min(1).required().label("User id"),
        user_address_id: Joi.number().allow(null, 0).label("User Address id"),
        email_address: Joi.string().allow(null, "").label("Email address"),
        phone_number: Joi.string().allow(null, "").label("Phone Number"),
        address_type: Joi.number().required().label("Address type"),
        is_shipping_same: Joi.number().allow(null, 0).label("Is Shipping same"),
        first_name: Joi.string().allow(null, "").label("First name"),
        last_name: Joi.string().allow(null, "").label("Last name"),
        address_line1: Joi.string().allow(null, "").label("Address Line 1"),
        address_line2: Joi.string().allow(null, "").label("Address Line 2"),
        city: Joi.string().allow(null, "").label("City"),
        state_id: Joi.number().allow(null, 0).label("State id"),
        latitude: Joi.number().allow(null, 0).label("latitude"),
        longitude: Joi.number().allow(null, 0).label("longitude"),
        country_id: Joi.number().allow(null, 0).label("Country id"),
        zipcode: Joi.string().allow(null, "").label("Zipcode"),
        user_orders_id: Joi.number().allow(null, 0).label("User Order id"),
        company: Joi.string().allow(null, "").label("Company"),
    }),
    listSubscriptionTransactionPayload: Joi.object().keys({
        user_subscription_id: Joi.number()
            .required()
            .label("user subscription id")
    }),
    updateMembershipStatusPayload: Joi.object().keys({
        user_membership_ids: Joi.array().required(),
        status: Joi.number().min(1).required()
            .label("Membership status")
    }),
    changeSubscriptionStatus: Joi.object().keys({
        user_subscription_id: Joi.number().required().label("user subscription id"),
        status: Joi.number().required().label("status"),
    }),
};
