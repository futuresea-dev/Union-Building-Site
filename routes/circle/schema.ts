import Joi from 'joi';

export default {
  
    listCircleSupportTickets: Joi.object().keys({
        email: Joi.string().allow(null, ''),        
        search: Joi.string().allow(null, ''),        
        sort_field: Joi.string().allow(null, ''),        
        sort_order: Joi.string().allow(null, ''),        
        site_id: Joi.number().allow(null, '', 0),        
        page_no: Joi.number().allow(null, '', 0),        
        page_record: Joi.number().allow(null, '', 0),        
    }),
        
        
    getCircleSupportRicketDetails: Joi.object().keys({
        post_id:Joi.number().required()
    }),
    saveCircleSupportTicketComment: Joi.object().keys({
        community_id:Joi.number().required(),
        circle_parent_comment_id:Joi.number().required(),
        space_id:Joi.number().required(),
        post_id:Joi.number().required(),
        body:Joi.string().required(),
        user_email:Joi.string().required(),
        skip_notifications:Joi.boolean().required()
    }),
    deleteCircleSupportTicketComment: Joi.object().keys({
        community_id:Joi.number().required(),
        comment_id:Joi.number().required()
    })

};
