import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;

const EC = new ErrorController();

export class MembershipController {
  /*
      *@ayushi 23-11-21
      * @method : listAllMembership
      * @params :
      * * req interface
      * * res interface
      * @return : object
      * @description : Get list of all the membership with pagination,search,sort and filter functionality.
      */
  public async listMembership(req: Request, res: Response) {
    try {
      var reqBody = req.body;
      var row_offset = 0, row_limit = 10;

      if (reqBody.page_record) {
        row_limit = parseInt(reqBody.page_record);
      }
      if (reqBody.page_no) {
        row_offset = (reqBody.page_no * reqBody.page_record) - reqBody.page_record;
      }
      // Searching                           
      var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
      if (reqBody.search) {
        SearchCondition = dbReader.Sequelize.Op.like;
        SearchData = "%" + reqBody.search + "%";
      }
      var sortField = 'membership_id', sortOrder = "DESC";

      if (reqBody.sortField) {
        sortField = reqBody.sortField
      }
      if (reqBody.sortOrder) {
        sortOrder = reqBody.sortOrder;
      }
      let orderArray: any = [];
      if (sortField == "user_id") {
        orderArray = ["sycu_user_memberships", sortField, sortOrder];
      }
      else {
        orderArray = [sortField, sortOrder];
      }
      let siteCond = dbReader.Sequelize.Op.ne, siteData = null;
      if (reqBody.site_id) {
        siteCond = dbReader.Sequelize.Op.eq;
        siteData = reqBody.site_id;
      }
      var data = await dbReader.membership.findAndCountAll({
        where: dbReader.Sequelize.and(
          { is_deleted: 0, site_id: { [siteCond]: siteData } },
          { membership_name: { [SearchCondition]: SearchData } }
        ),
        attributes: ['membership_id', 'page_id', 'membership_name', 'membership_type', [dbReader.Sequelize.literal('`page`.`page_title`'), 'page_title'], 'site_id', [dbReader.sequelize.literal('(select count(1) from sycu_user_memberships a where a.membership_id = sycu_memberships.membership_id and a.status = 2)'), 'members_count']],
        include: [{
          separate: true,
          where: { is_deleted: 0 },
          model: dbReader.membershipProduct,
          include: [{
            model: dbReader.products,
          }],
        }
          // , {
          //   separate: true,
          //   model: dbReader.userMemberships,
          //   attributes: ['user_membership_id', 'user_id'],
          // }
          , {
          required: false,
          model: dbReader.pages,
          attributes: [],
          where: { is_deleted: 0 }
        }],
        limit: row_limit,
        offset: row_offset,
        order: [orderArray]
      });
      data = JSON.parse(JSON.stringify(data));
      // data.rows.forEach((element: any) => {
      //   element.members_count = element.sycu_user_memberships.length;
      // });
      var message = data.count.length > 0 ? EC.success : EC.noDataFound;
      new SuccessResponse(message, {
        //@ts-ignore
        token: req.token,
        count: data.count,
        rows: data.rows
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  /*
      *@ayushi 23-11-21
      * @method : getMembershipDetails
      * @params :
      * * req interface
      * * res interface
      * @return : object
      * @description : Get the membership details based on provided id.
      */
  public async getMembershipDetails(req: Request, res: Response) {
    try {
      var obj = new MembershipController();
      let id = req.params.id;
      let membershipDetails = await obj.getMembershipDetail(id);

      new SuccessResponse(EC.success, {
        user: null,
        //@ts-ignore
        token: req.token,
        membershipDetails
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }

  }

  public async getMembershipDetail(membershipId: string) {
    try {
      var membership = [];
      if (typeof membershipId == "undefined" || membershipId == null) {
        throw new Error(EC.idError);
      }
      else {
        membership = await dbReader.membership.findOne({
          where: {
            membership_id: membershipId,
            is_deleted: 0
          },
          attributes: ['membership_id', 'page_id', 'membership_name', 'membership_type', 'site_id',
            [dbReader.Sequelize.literal('(select count(1) from sycu_user_memberships gum where gum.membership_id = sycu_memberships.membership_id)'), 'members_count']
          ],
          include: [{
            model: dbReader.membershipProduct,
            include: [{
              model: dbReader.products,
            }]
          },
          {
            model: dbReader.userMemberships,
            attributes: ['user_membership_id'],
          }],
        });
        return membership;
      }
    }
    catch (e: any) {
      //ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  /*
      *@ayushi 23-11-21
      * @method : saveMembership
      * @params :
      * * req interface
      * * res interface
      * @return : object
      * @description : add/update membership details and delete/create membership product.
      */
  public async saveMembership(req: Request, res: Response) {
    try {
      var obj = new MembershipController();
      var data = req.body;
      var productIds: any[] = [];
      if (data.membership_type == 3) {
        productIds = data.product_id;
      }
      if (data.membership_type == 3 && (typeof productIds == "undefined" || productIds == null || productIds.length <= 0)) {
        throw new Error("Please select at least one product");
      }
      var obj = new MembershipController();
      var membershipId = req.body.membership_id;
      if (membershipId != null && membershipId != 0) {

        //Old productList associated with membership
        var membershipProductList = await dbReader.membershipProduct.findAll({
          where: {
            membership_id: membershipId,
            is_deleted: 0
          },
          attributes: ['membership_product_id', 'product_id']
        });

        //Add new product
        var newMembershipProducts = productIds.filter((id: any) =>
          !membershipProductList.map((a: any) => a.product_id).includes(id)
        );
        if (newMembershipProducts.length > 0) {
          await obj.saveMembershipProduct(membershipId, newMembershipProducts, res);
        }

        //Remove old product
        var removeMembershipProduct: any[] = [];
        if (data.membership_type == 3) {
          removeMembershipProduct = membershipProductList.map((s: any) => {
            if (!productIds.includes(s.product_id)) { return s.membership_product_id }
          });
        }
        else {
          removeMembershipProduct = membershipProductList.map((s: any) => s.membership_product_id);
        }

        if (removeMembershipProduct.length > 0) {
          await obj.deleteMembershipProductById(removeMembershipProduct, res);
        }

        var result = await dbWriter.membership.update(
          {
            membership_name: data.membership_name,
            page_id: data.page_id,
            slug: data.membership_name.replace(/ /g, '-'),
            membership_type: data.membership_type,
            status: data.status,
            created_datetime: data.created_datetime,
            updated_datetime: data.updated_datetime,
            is_deleted: data.is_deleted,
            site_id: data.site_id
          },
          { where: { membership_id: req.body.membership_id } }
        )
        let membershipData = await obj.getMembershipDetail(req.body.membership_id);
        new SuccessResponse(EC.errorMessage(EC.updatedDataSuccess, ["Membership"]), {
          user: null,
          //@ts-ignore
          token: req.token,
          data: membershipData
        }).send(res);
      }
      else {
        data.slug = data.membership_name.replace(/ /g, '-');
        var result = await dbWriter.membership.create(data);
        if (result != null) {
          obj.saveMembershipProduct(result.membership_id, productIds, "");
        }
        let membershipData = await obj.getMembershipDetail(result.membership_id);
        new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["Membership"]), {
          user: null,
          //@ts-ignore
          token: req.token,
          data: membershipData,
        }).send(res);
      }
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  /*
      *@ayushi 23-11-21
      * @method : deleteMembership
      * @params :
      * * req interface
      * * res interface
      * @return : object
      * @description :Soft delete membership details and membership product based on provided id.
      */
  public async deleteMembership(req: Request, res: Response) {
    try {

      if (typeof req.params.id == "undefined" || req.params.id == null) {
        throw new Error(EC.idError);
      } else {
        var membershipId = req.params.id;
        var obj = new MembershipController();

        await obj.deleteMembershipProductByMembershipId(membershipId, "")

        await dbWriter.membership.update(
          { is_deleted: 1 },
          { where: { membership_id: membershipId } }
        )
        new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess, ["Membership"]), {
          user: null,
          //@ts-ignore
          token: req.token,
          data: []
        }).send(res);
      }
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  /*
    *@ayushi 23-11-21
    * @method : saveMembershipProduct
    * @params :
    * * req interface
    * * res interface
    * @return : object
    * @description :add membership product details.
    */
  public async saveMembershipProduct(membershipId: any, ProductId: any, callback: any) {
    var result: any;
    try {
      var _data: any = [];
      for (let step = 0; step < ProductId.length; step++) {
        _data.push({
          membership_id: membershipId,
          product_id: ProductId[step],
        });
      }
      if (_data.length) {
        result = await dbWriter.membershipProduct.bulkCreate(_data);
      }
    }
    catch (e: any) {
      return e;
    }
    return result;
  }

  /*
     *@ayushi 23-11-21
     * @method : deleteMembershipProductById
     * @params :
     * * req interface
     * * res interface
     * @return : object
     * @description : soft delete membership product by primary key (membership product id)
     */
  public async deleteMembershipProductById(membershipProductId: any, callback: any) {
    try {
      dbWriter.membershipProduct.update(
        { is_deleted: 1 },
        { where: { membership_product_id: membershipProductId } }
      )
    }
    catch (e: any) {
      return e;
    }
  }

  /*
     *@ayushi 23-11-21
     * @method : deleteMembershipProductByMembershipId
     * @params :
     * * req interface
     * * res interface
     * @return : object
     * @description : soft delete membership product membership id
     */
  public async deleteMembershipProductByMembershipId(membershipId: any, callback: any) {
    try {
      dbWriter.membershipProduct.update(
        { is_deleted: 1 },
        { where: { membership_id: membershipId } }
      )
    }
    catch (e: any) {
      return e;
    }
  }

  /*
      * SO 13-12-21
      *  Getting user details those who have memberships
      */

  public async getActiveMembershipUsers(req: Request, res: Response) {
    try {

      //Pagination
      var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
      var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);


      // Automatic offset and limit will set on the base of page number
      var row_limit = limit;
      var row_offset = (offset * limit) - limit;

      // Added Code By sourabh 29-11-2021
      // Getting sort field(column) and sort order(ASC) from body
      // If it is not passed in body then default values will set
      var sortField = 'membership_id', sortOrder = "DESC";
      if (req.body.sortField) {
        sortField = req.body.sortField
      }
      if (req.body.sortOrder) {
        sortOrder = req.body.sortOrder;
      }

      // Searching                           
      var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
      if (req.body.search) {
        searchCondition = Op.like;
        searchData = "%" + req.body.search + "%";
      }

      // Filtering
      var filter = dbReader.Sequelize.and();

      if (req.body.filter) {
        var data = req.body.filter[0];
        filter = dbReader.Sequelize.and(data);
      }

      let getUser = await dbReader.membership.findAndCountAll({
        include: {
          model: dbReader.userMemberships,
          as: 'userMember',
          required: true,
          attributes: [
            [dbReader.Sequelize.literal('`userMember->sycu_user`.`user_id`'), 'user_id'],
            [dbReader.Sequelize.literal('first_name'), 'first_name'],
            [dbReader.Sequelize.literal('last_name'), 'last_name'],
            [dbReader.Sequelize.literal('password'), 'password'],
            [dbReader.Sequelize.literal('display_name'), 'display_name'],
            [dbReader.Sequelize.literal('email'), 'email']
          ],
          include: [{
            model: dbReader.users,
            required: true,
            attributes: [],
          }],
        },
        where: dbReader.Sequelize.and(dbReader.Sequelize.or({ membership_name: { [searchCondition]: searchData } }, filter)),
        attributes: [
          'membership_id', 'membership_name', [dbReader.Sequelize.literal('`userMember`.`status`'), 'status'], ['created_datetime', 'created_date_time']
        ],
        offset: row_offset,
        limit: row_limit,
        order: [[sortField, sortOrder]],
        distinct: true
      });

      if (getUser.count > 0) {
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          count: getUser.count,
          data: getUser.rows
        }).send(res);
      }
      else {
        new SuccessResponse(EC.noDataFound, {}).send(res);
      }
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async getActiveMembershipUsersV1(req: Request, res: Response) {
    try {

      //Pagination
      var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
      var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);


      // Automatic offset and limit will set on the base of page number
      var row_limit = limit;
      var row_offset = (offset * limit) - limit;

      // Added Code By sourabh 29-11-2021
      // Getting sort field(column) and sort order(ASC) from body
      // If it is not passed in body then default values will set
      var sortField = 'membership_id', sortOrder = "DESC";
      if (req.body.sortField) {
        sortField = req.body.sortField
      }
      if (req.body.sortOrder) {
        sortOrder = req.body.sortOrder;
      }

      // Searching                           
      var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
      if (req.body.search) {
        searchCondition = Op.like;
        searchData = "%" + req.body.search + "%";
      }




      let getUser: any;
      getUser = await dbReader.userMemberships.findAndCountAll({
        attributes: [
          "user_membership_id",
          "status",
          "user_id",
          [dbReader.Sequelize.literal('first_name'), 'first_name'],
          [dbReader.Sequelize.literal('last_name'), 'last_name'],
          [dbReader.Sequelize.literal('password'), 'password'],
          [dbReader.Sequelize.literal('display_name'), 'display_name'],
          [dbReader.Sequelize.literal('email'), 'email'],
          [dbReader.Sequelize.literal('email'), 'email'],
          'membership_id',
          [dbReader.Sequelize.literal(`membership_name`), 'membership_name'],
          "created_datetime"
        ],
        include: [{
          model: dbReader.users,
          required: true,
          attributes: [],
        }, {
          attributes: [],
          model: dbReader.membership,
          //where:dbReader.Sequelize.or({ membership_name: { [searchCondition]: searchData } }, filter),
          //order: [[sortField, sortOrder]]
        }],
        //where: dbReader.Sequelize.and(dbReader.Sequelize.or({ membership_name: { [searchCondition]: searchData } }, filter)),
        offset: row_offset,
        limit: row_limit,
        where: dbReader.Sequelize.and(dbReader.Sequelize.where(dbReader.Sequelize.literal(`membership_name`), { [searchCondition]: searchData }),
          { is_deleted: 0 }),
        order: [["sycu_membership", sortField, sortOrder]],
        distinct: true
      });

      if (getUser.count > 0) {
        //   getUser.map(function(item:any) { 
        //     delete item.sycu_membership; 
        //     return item; 
        // });
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          count: getUser.count,
          data: getUser.rows
        }).send(res);
      }
      else {
        new SuccessResponse(EC.noDataFound, {}).send(res);
      }
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

}
