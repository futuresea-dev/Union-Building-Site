import Joi from "joi";
export default {
    getIntakeFormList: Joi.object().keys({
        sort_order: Joi.string().allow(null, ""),
        sort_field: Joi.string().allow(null, ""),
        page_no: Joi.number().allow(null, ""),
        page_record: Joi.number().allow(null, ""),
        search: Joi.string().allow(null, ""),
        filterByMastermindGroup: Joi.number().allow(null, ""),
        filterByStatus: Joi.number().allow(null, ""),
        start_date: Joi.date().allow(null, ""),
        end_date: Joi.date().allow(null, ""),
    }),
    saveIntakeFormStatus: Joi.object().keys({
        grow_together_intake_form_id: Joi.number().required(),
        status: Joi.number().required()
    }),
    saveIntakeApplication: Joi.object().keys({
        grow_together_intake_form_id: Joi.number().required(),
        mastermind_group: Joi.number().required(),
        no_of_volunteers: Joi.number().allow(null, ""),
        no_of_kid_student: Joi.number().allow(null, ""),
        is_leader: Joi.number().required().allow(0, ""),
        call_schedule: Joi.array().items({
            id: Joi.number().allow(null, ""),
            mainTitle: Joi.string().allow(null, ""),
            data: Joi.array().items({
                value: Joi.string().allow(null, ""),
                isSelected: Joi.boolean().allow(null, ""),
            })
        }),
        reference_mastermind_group: Joi.string().allow(null, ""),
    }),
};
