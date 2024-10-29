import { Request, Response } from "express";
import moment from "moment";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError } from "../core/ApiError";
const { dbReader, dbWriter } = require("../models/dbConfig");
const client = require("@mailchimp/mailchimp_marketing");
const EC = new ErrorController();
const curriculumSiteId = 2;

export class CategoryController {

  //volumes APIs
  public async listAllVolumes(req: Request, res: Response) {
    try {
      let data = await dbReader.categories.findAll({
        attributes: ["category_id", "category_title", "category_image", "sort_order",
          "created_datetime", "updated_datetime", "created_by", "updated_by"],
        where: dbReader.Sequelize.and({ is_deleted: 0 }, { category_level: 0 }),
        include: [{
          as: "created_user",
          model: dbReader.users,
          attributes: ["user_id", "display_name"]
        }, {
          as: "updated_user",
          model: dbReader.users,
          attributes: ["user_id", "display_name"]
        }],
        order: [["created_datetime", "DESC"]]
      });
      if (data.length) {
        data = JSON.parse(JSON.stringify(data));
        data.forEach((element: any) => {
          element.created_by = element.created_user.length ? element.created_user[0].display_name : "";
          element.updated_by = element.updated_user.length ? element.updated_user[0].display_name : "";
          delete element.created_user;
          delete element.updated_user;
        });
      }
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        volumes: data,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async saveVolume(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req, reqBody = req.body, volume: any;
      let categorySlug = reqBody.category_title.toLowerCase().replace(/ /g, "-");

      if (reqBody.category_id) {
        volume = await dbWriter.categories.update({
          parent_category_id: reqBody.parent_category_id,
          category_title: reqBody.category_title,
          category_slug: categorySlug,
          category_image: reqBody.category_image || "",
          updated_by: user_id,
        }, {
          where: { category_id: reqBody.category_id }
        });
      } else {
        let volume_count = 0;
        if (reqBody.parent_category_id) {
          let volumeCountData = await dbReader.categories.findAll({
            attributes: [[dbReader.Sequelize.fn("MAX", dbReader.Sequelize.col("volume_count")), "volume_count"]]
          });
          volumeCountData = JSON.parse(JSON.stringify(volumeCountData));
          volume_count = volumeCountData[0].volume_count;
          volume_count = volume_count + 1;
        }

        let sort_order = 0;
        let sortOrderData = await dbReader.categories.findAll({
          attributes: [[dbReader.Sequelize.fn("MAX", dbReader.Sequelize.col("sort_order")), "sort_order"]]
        });
        sortOrderData = JSON.parse(JSON.stringify(sortOrderData));
        sort_order = sortOrderData[0].sort_order;
        sort_order = sort_order + 1;

        volume = await dbWriter.categories.create({
          parent_category_id: reqBody.parent_category_id || 0,
          category_title: reqBody.category_title,
          category_slug: categorySlug,
          category_image: reqBody.category_image || "",
          volume_count: volume_count,
          sort_order: sort_order,
          category_level: 0,
          ministry_type: 0,
          created_by: user_id,
        });
      }

      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        volume: volume,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getVolumeDetails(req: Request, res: Response) {
    try {
      let categoryId = req.params.id;
      let volume = await dbReader.categories.findOne({
        where: { category_id: categoryId },
        attributes: ["category_id", "category_title", "category_image", "parent_category_id",
          "sort_order", "created_datetime", "updated_datetime", "created_by", "updated_by"]
      });
      volume = JSON.parse(JSON.stringify(volume));
      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        volume: volume,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async deleteVolume(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req;
      let categoryId = req.params.id;
      let data = await dbReader.categories.findOne({
        attributes: ['category_level'],
        where: { category_id: categoryId }
      });
      if (data.category_level == 0) {
        await dbWriter.categories.update({
          is_deleted: 1,
          updated_by: user_id,
        }, {
          where: { category_id: categoryId }
        });
        new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess), '').send(res);
      } else {
        throw new Error(EC.errorMessage("Please provide valid data."));
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getUserCurriculumVolumes(user_id: any = 0, user_role: any = 3, ministry_type: any = 0) {
    try {
      let purchasedVolumes: any, nonPurchasedVolumes: any, userMemberships: any = [], sharedMembershipsDetail: any,
        sharedMembershipsData: any = [], arrKids: any = [], arrStudents: any = [], arrGroups: any = [], nonPurchasedKids: any = [],
        nonPurchasedStudents: any = [], nonPurchasedGroups: any = [], membershipPageIds: any = [];
      let arrSuperAdminUserIds = [1, 626, 3540, 22359, 76217, 12172];

      let membershipsData = await dbReader.userMemberships.findAll({
        attributes: ["membership_id", "user_subscription_id", [dbReader.Sequelize.literal("`sycu_membership`.`page_id`"), "page_id"]],
        where: dbReader.Sequelize.and({ is_deleted: 0, user_id: user_id, membership_id: { [dbReader.Sequelize.Op.ne]: 0 } },
          dbReader.Sequelize.or(dbReader.Sequelize.and({ status: [2, 4, 10, 8, 5] }, { site_id: 2 }),
            dbReader.Sequelize.and({ status: [2, 4, 10, 5] }, { site_id: { [dbReader.Sequelize.Op.ne]: 2 } }))),
        include: [{
          attributes: ['membership_id'],
          model: dbReader.membership,
          where: { is_deleted: 0, status: 1 },
          include: [{
            separate: true,
            model: dbReader.membershipProduct,
            attributes: ['membership_product_id'],
            where: { is_deleted: 0 },
            include: [{
              model: dbReader.products,
              attributes: ['product_id', 'product_name', 'product_duration', 'category_id', 'ministry_type'],
              where: { is_deleted: 0 },
            }]
          }]
        }]
      });
      if (membershipsData.length) {
        membershipsData = JSON.parse(JSON.stringify(membershipsData));
        let findSubscription = await dbReader.userSubscription.findAll({
          where: { user_id: user_id, subscription_status: [2, 4, 8, 10, 5] },
          include: [{
            separate: true,
            model: dbReader.userOrder,
            attributes: ['user_orders_id', 'user_subscription_id', 'total_amount'],
            where: { order_status: { [dbReader.Sequelize.Op.ne]: 7 } },
            include: [{
              separate: true,
              model: dbReader.userOrderItems,
              attributes: ['user_order_item_id', 'product_id', 'updated_product_id'],
              where: { item_type: 1, is_deleted: 0 },
              include: [{
                model: dbReader.products,
                attributes: ['product_id', 'product_name', 'product_duration', 'category_id', 'ministry_type'],
                where: { is_deleted: 0 },
              }, {
                required: false,
                as: 'updated_product',
                model: dbReader.products,
                attributes: ['product_id', 'product_name', 'product_duration', 'category_id', 'ministry_type'],
              }]
            }, {
              separate: true,
              model: dbReader.refunds
            }],
            order: [['user_orders_id', 'DESC']]
          }]
        });
        let refundProductIds: any = [], tempProductIds: any = [];
        findSubscription = JSON.parse(JSON.stringify(findSubscription));
        findSubscription.forEach((s: any) => {
          s.user_orders.forEach((o: any, index: any) => {
            if (o.refunds.length) {
              let total_refund = 0;
              o.refunds.forEach((r: any) => { total_refund += r.refund_amount; });
              if (o.total_amount == total_refund) {
                o.user_order_items.forEach((oi: any) => {
                  if (oi.updated_product_id) {
                    refundProductIds.push({
                      product_id: oi.updated_product_id,
                      product_name: oi.updated_product.product_name,
                      product_duration: oi.updated_product.product_duration,
                      ministry_type: oi.updated_product.ministry_type,
                      category_id: oi.updated_product.category_id,
                    });
                  } else {
                    refundProductIds.push({
                      product_id: oi.product_id,
                      product_name: oi.sycu_product.product_name,
                      product_duration: oi.sycu_product.product_duration,
                      ministry_type: oi.sycu_product.ministry_type,
                      category_id: oi.sycu_product.category_id,
                    });
                  }
                });
              } else {
                o.user_order_items.forEach((oi: any) => {
                  if (oi.updated_product_id) {
                    tempProductIds.push({
                      product_id: oi.updated_product_id,
                      product_name: oi.product_name,
                      product_duration: oi.updated_product.product_duration,
                      ministry_type: oi.updated_product.ministry_type,
                      category_id: oi.updated_product.category_id,
                      status: s.subscription_status
                    });
                  } else {
                    tempProductIds.push({
                      product_id: oi.product_id,
                      product_name: oi.product_name,
                      product_duration: oi.sycu_product.product_duration,
                      ministry_type: oi.sycu_product.ministry_type,
                      category_id: oi.sycu_product.category_id,
                      status: s.subscription_status
                    });
                  }
                });
              }
            } else {
              o.user_order_items.forEach((oi: any) => {
                if (oi.updated_product_id) {
                  tempProductIds.push({
                    product_id: oi.updated_product_id,
                    product_name: oi.product_name,
                    product_duration: oi.updated_product.product_duration,
                    ministry_type: oi.updated_product.ministry_type,
                    category_id: oi.updated_product.category_id,
                    status: s.subscription_status
                  });
                } else {
                  tempProductIds.push({
                    product_id: oi.product_id,
                    product_name: oi.product_name,
                    product_duration: oi.sycu_product.product_duration,
                    ministry_type: oi.sycu_product.ministry_type,
                    category_id: oi.sycu_product.category_id,
                    status: s.subscription_status
                  });
                }
              });
            }
          });
        });

        tempProductIds = JSON.parse(JSON.stringify(tempProductIds))
        tempProductIds.filter((g: any) => {
          if ([2, 4, 10].includes(g.status) || g.product_duration == 365) {
            refundProductIds = refundProductIds.filter((e: any, i: any) => {
              if (!(g.category_id == e.category_id && g.ministry_type == e.ministry_type)) {
                return true
              }
            })
          } else if ((g.status == 5 || g.status == 10) && g.product_duration == 90) {
            let pc = tempProductIds.filter((u: any) => u.category_id == g.category_id && u.ministry_type == g.ministry_type).length
            if (pc >= 4) {
              refundProductIds = refundProductIds.filter((e: any, i: any) => {
                if (!(g.category_id == e.category_id && g.ministry_type == e.ministry_type)) {
                  return true
                }
              })
            }
          } else if (g.status == 5 && g.product_duration == 30) {
            let pc = tempProductIds.filter((u: any) => u.category_id == g.category_id && u.ministry_type == g.ministry_type).length
            if (pc >= 12) {
              refundProductIds = refundProductIds.filter((e: any, i: any) => {
                if (!(g.category_id == e.category_id && g.ministry_type == e.ministry_type)) {
                  return true
                }
              })
            }
          }
        });

        membershipsData.forEach((um: any) => {
          if (user_role == 3) {
            if (!um.sycu_membership.sycu_membership_products.some((p: any) => refundProductIds.some((s: any) => s.product_id == p.sycu_product.product_id))) {
              userMemberships.push(um);
            }
          } else {
            userMemberships.push(um);
          }
          if (!membershipPageIds.includes(um.page_id))
            membershipPageIds.push(um.page_id);
        });
      }

      let shareAllPages = await dbReader.shareAllPages.findAll({
        where: { is_deleted: 0, receiver_user_id: user_id }
      });
      if (shareAllPages.length > 0) {
        shareAllPages = JSON.parse(JSON.stringify(shareAllPages));
        sharedMembershipsData = [];
        for (let i = 0; i < shareAllPages.length; i++) {
          let ministry_type: any = [];
          if (shareAllPages[i].is_share_all_kids === 1)
            ministry_type.push(1);
          if (shareAllPages[i].is_share_all_students === 1)
            ministry_type.push(2);
          if (shareAllPages[i].is_share_all_groups === 1)
            ministry_type.push(3);

          sharedMembershipsDetail = await dbReader.userMemberships.findAll({
            attributes: ["membership_id", "user_subscription_id", [dbReader.Sequelize.literal("`sycu_membership`.`page_id`"), "page_id"]],
            where: dbReader.Sequelize.and({ is_deleted: 0, user_id: shareAllPages[i].sender_user_id, membership_id: { [dbReader.Sequelize.Op.ne]: 0 } },
              dbReader.Sequelize.or(dbReader.Sequelize.and({ status: [2, 4, 10, 8] }, { site_id: 2 }),
                dbReader.Sequelize.and({ status: [2, 4, 10] }, { site_id: { [dbReader.Sequelize.Op.ne]: 2 } }))),
            include: [{
              attributes: ['membership_id'],
              model: dbReader.membership,
              where: { is_deleted: 0, status: 1, ministry_type: { [dbReader.Sequelize.Op.in]: ministry_type } },
              include: [{
                separate: true,
                model: dbReader.membershipProduct,
                attributes: ['membership_product_id'],
                where: { is_deleted: 0 },
                include: [{
                  model: dbReader.products,
                  attributes: ['product_id', 'product_name', 'product_duration', 'category_id', 'ministry_type'],
                  where: { is_deleted: 0 },
                }]
              }]
            }]
          });
          sharedMembershipsDetail = JSON.parse(JSON.stringify(sharedMembershipsDetail));
          sharedMembershipsDetail.forEach((e: any) => {
            sharedMembershipsData.push(e);
          });
        };
      }

      let sharedPages = await dbReader.sharedPages.findAll({
        attributes: ["page_id"],
        where: {
          is_deleted: 0,
          receiver_user_id: user_id,
          membership_id: { [dbReader.Sequelize.Op.ne]: 0 }
        },
        include: [{
          as: 'single_sender',
          model: dbReader.users,
          include: [{
            separate: true,
            model: dbReader.userMemberships,
            where: { status: [2, 4, 10], is_deleted: 0 },
            include: [{
              model: dbReader.membership
            }]
          }]
        }]
      });
      sharedPages = JSON.parse(JSON.stringify(sharedPages));
      let categories = await dbReader.categories.findAll({
        attributes: ["category_id", "category_title", "category_slug", "category_image", "is_current_volume", "volume_count"],
        where: { is_deleted: 0, category_level: 0 },
        include: [{
          separate: true,
          model: dbReader.pages,
          attributes: ["category_id", "page_id", "ministry_type", "page_link", "is_ministry_page", "page_title"],
          where: { is_deleted: 0, is_published: 1 },
          include: [{
            as: "page_series_link",
            model: dbReader.pageLink,
            attributes: ["keyword"],
            where: dbReader.Sequelize.and({ is_deleted: 0 },
              dbReader.Sequelize.or({ link_type: 1 }, { link_type: 14 })
            )
          }]
        }],
        order: [["created_datetime", "DESC"]],
      });
      categories = JSON.parse(JSON.stringify(categories));
      categories.forEach((element: any) => {
        let ge = {
          category_id: element.category_id,
          category_title: element.category_title,
          category_slug: element.category_slug,
          category_image: element.category_image,
        };
        if (element.pages.length) {
          element.pages.map(function (e: any) {
            e.keyword = e.page_series_link.keyword;
            e.volume_count = element.volume_count;
            delete e.page_series_link;
          });
        }

        let ak_pages = element.pages.filter((s: any) => s.ministry_type == 1 &&
          (userMemberships.some((m: any) => m?.page_id == s?.page_id) || sharedMembershipsData?.some((sm: any) => sm?.page_id == s?.page_id) ||
            sharedPages.some((sp: any) => sp?.page_id == s?.page_id && sp.single_sender?.sycu_user_memberships.length > 0 &&
              sp.single_sender?.sycu_user_memberships.some((g: any) => g.sycu_membership?.page_id == s?.page_id)) ||
            element.category_slug == "free-trial" || element.category_slug == "music" ||
            (element.category_id == 341 && [1, 2].includes(user_role)))
        ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page);
        if (ak_pages.length) {
          arrKids.push({
            ...ge,
            ...ak_pages[0],
          });
        }

        let as_pages = element.pages.filter((s: any) => s.ministry_type == 2 &&
          (userMemberships.some((m: any) => m?.page_id == s?.page_id) || sharedMembershipsData?.some((sm: any) => sm?.page_id == s?.page_id) ||
            sharedPages.some((sp: any) => sp?.page_id == s?.page_id && sp.single_sender?.sycu_user_memberships.length > 0 &&
              sp.single_sender?.sycu_user_memberships.some((g: any) => g.sycu_membership?.page_id == s?.page_id)) ||
            element.category_slug == "free-trial" || element.category_slug == "music" ||
            (element.category_id == 341 && [1, 2].includes(user_role)))
        ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page);
        if (as_pages.length) {
          arrStudents.push({
            ...ge,
            ...as_pages[0],
          });
        }

        let ag_pages = element.pages.filter((s: any) => s.ministry_type == 3 &&
          (userMemberships.some((m: any) => m?.page_id == s?.page_id) || sharedMembershipsData?.some((sm: any) => sm?.page_id == s?.page_id) ||
            sharedPages.some((sp: any) => sp?.page_id == s?.page_id && sp.single_sender?.sycu_user_memberships.length > 0 &&
              sp.single_sender?.sycu_user_memberships.some((g: any) => g.sycu_membership?.page_id == s?.page_id)) ||
            element.category_slug == "free-trial" || element.category_slug == "music" ||
            (element.category_id == 341 && [1, 2].includes(user_role)))
        ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page);
        if (ag_pages.length) {
          arrGroups.push({
            ...ge,
            ...ag_pages[0],
          });
        }

        let ak_non_purchase_pages = !arrSuperAdminUserIds.includes(user_id) ?
          element.pages.filter((s: any) => s.ministry_type == 1 && s.is_ministry_page == 1 &&
            !membershipPageIds.includes(s?.page_id) && element.is_current_volume == 0 &&
            !sharedPages.some((a: any) => a?.page_id == s?.page_id && a.single_sender?.sycu_user_memberships.length > 0 &&
              a.single_sender?.sycu_user_memberships.some((g: any) => g.sycu_membership?.page_id == s?.page_id)) &&
            element.category_slug != "free-trial" && element.category_slug != "3-month-pack" && element.category_slug != "music"
          ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page) :
          element.pages.filter((s: any) => s.ministry_type == 1 && s.is_ministry_page == 1 && element.is_current_volume == 0 &&
            element.category_slug != "free-trial" && element.category_slug != "3-month-pack" && element.category_slug != "music"
          ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page);

        if (ak_non_purchase_pages.length) {
          if (!arrKids.some((e: any) => e.category_id == ak_non_purchase_pages[0].category_id) || arrSuperAdminUserIds.includes(user_id)) {
            nonPurchasedKids.push({
              ...ge,
              ...ak_non_purchase_pages[0],
            });
          }
        }

        let as_non_purchase_pages = !arrSuperAdminUserIds.includes(user_id) ?
          element.pages.filter((s: any) => s.ministry_type == 2 && s.is_ministry_page == 1 &&
            element.is_current_volume == 0 && !membershipPageIds.includes(s?.page_id) &&
            !sharedPages.some((a: any) => a?.page_id == s?.page_id && a.single_sender?.sycu_user_memberships.length > 0 &&
              a.single_sender?.sycu_user_memberships.some((g: any) => g.sycu_membership?.page_id == s?.page_id)) &&
            element.category_slug != "free-trial" && element.category_slug != "3-month-pack" && element.category_slug != "music"
          ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page) :
          element.pages.filter((s: any) => s.ministry_type == 2 && s.is_ministry_page == 1 && element.is_current_volume == 0 &&
            element.category_slug != "free-trial" && element.category_slug != "3-month-pack" && element.category_slug != "music"
          ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page);

        if (as_non_purchase_pages.length) {
          if (!arrStudents.some((e: any) => e.category_id == as_non_purchase_pages[0].category_id) || arrSuperAdminUserIds.includes(user_id)) {
            nonPurchasedStudents.push({
              ...ge,
              ...as_non_purchase_pages[0],
            });
          }
        }

        let ag_non_purchase_pages = !arrSuperAdminUserIds.includes(user_id) ?
          element.pages.filter((s: any) => s.ministry_type == 3 && s.is_ministry_page == 1 &&
            !membershipPageIds.includes(s?.page_id) && element.is_current_volume == 0 &&
            !sharedPages.some((a: any) => a?.page_id == s?.page_id && a.single_sender?.sycu_user_memberships.length > 0 &&
              a.single_sender?.sycu_user_memberships.some((g: any) => g.sycu_membership?.page_id == s?.page_id)) &&
            element.category_slug != "free-trial" && element.category_slug != "3-month-pack" && element.category_slug != "music"
          ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page) :
          element.pages.filter((s: any) => s.ministry_type == 3 && s.is_ministry_page == 1 && element.is_current_volume == 0 &&
            element.category_slug != "free-trial" && element.category_slug != "3-month-pack" && element.category_slug != "music"
          ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page);

        if (ag_non_purchase_pages.length) {
          if (!arrGroups.some((e: any) => e.category_id == ag_non_purchase_pages[0].category_id) || arrSuperAdminUserIds.includes(user_id)) {
            nonPurchasedGroups.push({
              ...ge,
              ...ag_non_purchase_pages[0],
            });
          }
        }
      });

      if (ministry_type) {
        purchasedVolumes = (ministry_type == "1") ? arrKids : (ministry_type == "2" ? arrStudents : (ministry_type == "3" ? arrGroups : []));
      } else {
        purchasedVolumes = {
          kids: arrKids,
          students: arrStudents,
          groups: arrGroups,
        }
        nonPurchasedVolumes = {
          kids: nonPurchasedKids,
          students: nonPurchasedStudents,
          groups: nonPurchasedGroups,
        }
      }

      return {
        purchased_volumes: purchasedVolumes,
        non_purchased_volumes: nonPurchasedVolumes,
      }
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  public async getUserMembershipVolumes(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0, user_role = 3 } = req, { ministry_type = 0 } = req.params;

      const self = new CategoryController();
      let userVolumesData = await self.getUserCurriculumVolumes(user_id, user_role, ministry_type);

      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        purchased_volumes: userVolumesData.purchased_volumes,
        non_purchased_volumes: userVolumesData.non_purchased_volumes,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getUserVolumeCounts(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req, c = 0;
      let arrKids: any = [], arrStudents: any = [], arrGroups: any = [];

      let userMemberships = await dbReader.userMemberships.findAll({
        attributes: ["membership_id", [dbReader.Sequelize.literal("`sycu_membership`.`page_id`"), "page_id"]],
        where: { is_deleted: 0, status: 2, user_id: user_id, membership_id: { [dbReader.Sequelize.Op.ne]: 0 } },
        include: [{
          attributes: [],
          model: dbReader.membership,
          where: { is_deleted: 0, status: 1 },
        }]
      });
      userMemberships = JSON.parse(JSON.stringify(userMemberships));
      let sharedPages = await dbReader.sharedPages.findAll({
        attributes: ["page_id"],
        where: {
          is_deleted: 0,
          receiver_user_id: user_id,
          membership_id: { [dbReader.Sequelize.Op.ne]: 0 }
        }
      });
      sharedPages = JSON.parse(JSON.stringify(sharedPages));
      let categories = await dbReader.categories.findAll({
        attributes: ["category_id", "category_title", "category_slug"],
        where: { is_deleted: 0, category_level: 0 },
        include: [{
          separate: true,
          model: dbReader.pages,
          attributes: ["page_id", "ministry_type", "is_ministry_page"],
          where: { is_deleted: 0, is_published: 1 },
        }],
        order: [["created_datetime", "DESC"]],
      });
      categories = JSON.parse(JSON.stringify(categories));

      while (c < categories.length) {
        let element = categories[c];
        let ak_pages = element.pages.filter((s: any) => s.ministry_type == 1 &&
          (userMemberships.some((m: any) => m.page_id == s.page_id) ||
            sharedPages.some((sp: any) => sp.page_id == s.page_id) ||
            element.category_slug == "free-trial")
        ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page);
        if (ak_pages.length) {
          let ak_page_ids = ak_pages.map((p: any) => p.page_id);
          let ak_series_count = await dbReader.pageSeries.count({
            attributes: ["page_series_id"],
            where: { is_deleted: 0, is_locked: 0, is_coming_soon: 0, is_selected: 1, content_type_id: 2, page_id: ak_page_ids }
          });
          arrKids.push({
            category_id: element.category_id,
            category_title: element.category_title,
            series_count: ak_series_count
          });
        }

        let as_pages = element.pages.filter((s: any) => s.ministry_type == 2 &&
          (userMemberships.some((m: any) => m.page_id == s.page_id) ||
            sharedPages.some((sp: any) => sp.page_id == s.page_id) ||
            element.category_slug == "free-trial")
        ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page);
        if (as_pages.length) {
          let as_page_ids = as_pages.map((p: any) => p.page_id);
          let as_series_count = await dbReader.pageSeries.count({
            attributes: ["page_series_id"],
            where: { is_deleted: 0, is_locked: 0, is_coming_soon: 0, is_selected: 1, content_type_id: 2, page_id: as_page_ids }
          });
          arrStudents.push({
            category_id: element.category_id,
            category_title: element.category_title,
            series_count: as_series_count
          });
        }

        let ag_pages = element.pages.filter((s: any) => s.ministry_type == 3 &&
          (userMemberships.some((m: any) => m.page_id == s.page_id) ||
            sharedPages.some((sp: any) => sp.page_id == s.page_id) ||
            element.category_slug == "free-trial")
        ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page);
        if (ag_pages.length) {
          let ag_page_ids = ag_pages.map((p: any) => p.page_id);
          let ag_series_count = await dbReader.pageSeries.count({
            attributes: ["page_series_id"],
            where: { is_deleted: 0, is_locked: 0, is_coming_soon: 0, is_selected: 1, content_type_id: 2, page_id: ag_page_ids }
          });
          arrGroups.push({
            category_id: element.category_id,
            category_title: element.category_title,
            series_count: ag_series_count
          });
        }
        c++;
      }

      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        kids: { ministry_type: 1, count: arrKids.length, volumes: arrKids },
        students: { ministry_type: 2, count: arrStudents.length, volumes: arrStudents },
        groups: { ministry_type: 3, count: arrGroups.length, volumes: arrGroups },
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  //Series APIs

  public async listAllSeries(req: Request, res: Response) {
    try {
      let { search, category_id, ministry_type, category_ids } = req.body;
      let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null, whereCondition: any;
      if (search) {
        SearchCondition = dbReader.Sequelize.Op.like;
        SearchData = "%" + search + "%";
      }
      if (category_ids && category_ids.length) {
        whereCondition = { category_id: category_ids };
      } else if (category_id) {
        whereCondition = dbReader.Sequelize.and(
          { is_deleted: 0 },
          { category_level: 1 },
          { ministry_type: ministry_type },
          { parent_category_id: category_id },
          { category_title: { [SearchCondition]: SearchData } }
        );
      } else {
        whereCondition = dbReader.Sequelize.and(
          { is_deleted: 0 },
          { category_level: 1 },
          { ministry_type: ministry_type },
          { category_title: { [SearchCondition]: SearchData } }
        );
      }

      let data = await dbReader.categories.findAll({
        where: whereCondition,
        attributes: ["category_id", "parent_category_id", "category_title", "category_image",
          "ministry_type", "total_week", "created_datetime", "updated_datetime", "created_by", "updated_by"],
        include: [{
          separate: true,
          model: dbReader.categoriesDetail,
          attributes: ["categories_detail_id", "detail_key", "detail_value",
            [dbReader.Sequelize.literal("`page_link`.`keyword`"), "memory_verse_keyword"]],
          where: { is_deleted: 0, detail_key: "series_memory_verse" },
          include: [{
            required: false,
            attributes: [],
            model: dbReader.pageLink,
            where: { is_deleted: 0, site_id: curriculumSiteId, link_type: 8 },
          }]
        }, {
          required: false,
          separate: true,
          model: dbReader.pageLink,
          attributes: ["page_link_id", "keyword", "link_type"],
          where: { is_deleted: 0, site_id: curriculumSiteId, link_type: [5, 6] },
        }, {
          as: "created_user",
          model: dbReader.users,
          attributes: ["user_id", "display_name"],
        }, {
          as: "updated_user",
          model: dbReader.users,
          attributes: ["user_id", "display_name"],
        }]
      });
      if (data.length) {
        data = JSON.parse(JSON.stringify(data));
        data.forEach((element: any) => {
          if (element.categories_details.length) {
            let index = element.categories_details.length;
            element.memory_verse_keyword = element.categories_details[index - 1].memory_verse_keyword;
          }
          if (element.page_links.length) {
            let amazon_keyword = element.page_links.find((e: any) => e.link_type == 6);
            let series_page_keyword = element.page_links.find((e: any) => e.link_type == 5);
            element.amazon_internal_keyword = amazon_keyword ? amazon_keyword.keyword : "";
            element.series_page_keyword = series_page_keyword ? series_page_keyword.keyword : "";
          } else {
            data.amazon_internal_keyword = "";
            data.series_page_keyword = "";
          }
          element.created_by = element.created_user.length ? element.created_user[0].display_name : "";
          element.updated_by = element.updated_user.length ? element.updated_user[0].display_name : "";
          delete element.created_user;
          delete element.updated_user;
          delete element.categories_details;
          delete element.page_links;
        });
      }

      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        series: data,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async addSeries(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req, seriesMeta: any = [];
      let { parent_category_id, category_image, ministry_type, category_title, total_week } = req.body;
      let categorySlug = category_title.toLowerCase().replace(/[^a-zA-Z0-9]+/gi, "-");

      let series = await dbWriter.categories.create({
        parent_category_id: parent_category_id,
        category_image: category_image || "",
        category_title: category_title,
        ministry_type: ministry_type,
        category_slug: categorySlug,
        total_week: total_week,
        category_level: 1,
        created_by: user_id,
      });

      let seriesId = series.category_id;
      let seriesDetail = ["description", "download_link", "preview_link",
        "instruction_link", "lesson_builder", "amazon_internal", "release_time"];
      seriesDetail.forEach((element: any) => {
        let detail_value = (element == "lesson_builder" || element == "notes") ? "[]" : "";
        seriesMeta.push({
          category_id: seriesId,
          detail_key: element,
          detail_value: detail_value,
          created_by: user_id,
        });
      });

      let categoriesDetailData = await dbWriter.categoriesDetail.bulkCreate(seriesMeta);
      let amazon_internal_id = categoriesDetailData.some((e: any) => e.detail_key == "amazon_internal") ?
        categoriesDetailData.find((e: any) => e.detail_key == "amazon_internal").categories_detail_id : 0;
      if (amazon_internal_id) {
        let ministry_keyword = ministry_type == 1 ? "growkids-" : (ministry_type == 2 ? "growstudents-" : "growgroups-");
        let amazon_keyword = ministry_keyword + categorySlug + "-amazon-" + moment().unix();
        let pageLinkCount = await dbReader.pageLink.count({
          where: { is_deleted: 0, keyword: amazon_keyword, site_id: curriculumSiteId }
        });
        if (pageLinkCount > 0) {
          amazon_keyword += moment().unix();
        }
        await dbWriter.pageLink.create({
          data_id: seriesId,
          site_id: curriculumSiteId,
          keyword: amazon_keyword,
          target_url: "",
          ui_component: "amazon-internal",
          link_type: 6,
          is_disable: 0,
        });
      }

      //create series details keyword
      let ministry_keyword = ministry_type == 1 ? "kidsseries-" : (ministry_type == 2 ? "studentseries-" : "groupseries-");
      let series_keyword = ministry_keyword + categorySlug;
      let pageLinkCount = await dbReader.pageLink.count({
        where: { is_deleted: 0, keyword: series_keyword, site_id: curriculumSiteId }
      });
      if (pageLinkCount > 0) {
        series_keyword += moment().unix();
      }
      await dbWriter.pageLink.create({
        data_id: seriesId,
        site_id: curriculumSiteId,
        keyword: series_keyword,
        target_url: "",
        ui_component: "series-detail",
        link_type: 5,
        is_disable: 0,
      });

      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        category: series,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getSeriesDetails(req: Request, res: Response) {
    try {
      let categoryId = req.params.id;
      let volume = await dbReader.categories.findOne({
        attributes: ["category_id", "parent_category_id", "ministry_type", "category_title", "category_image",
          "total_week", "created_datetime", "updated_datetime", "created_by", "updated_by", "is_hidden"],
        where: { category_id: categoryId },
      });
      volume = JSON.parse(JSON.stringify(volume));
      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        series: volume,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getSeriesEditorDetails(req: Request, res: Response) {
    try {
      let seriesId = req.params.id;
      let data = await dbReader.categories.findOne({
        attributes: ["category_id", "parent_category_id", "ministry_type", "category_title", "category_image",
          "total_week", "created_datetime", "updated_datetime", "created_by", "updated_by", "is_hidden"],
        where: { category_id: seriesId, is_deleted: 0 },
        include: [{
          separate: true,
          model: dbReader.categoriesDetail,
          where: { is_deleted: 0 },
        }, {
          separate: true,
          model: dbReader.pageLink,
          attributes: ["page_link_id", "keyword", "link_type"],
          where: { is_deleted: 0, site_id: curriculumSiteId, link_type: [5, 6] },
        }]
      });
      data = JSON.parse(JSON.stringify(data));
      data.categories_details.forEach((s: any) => {
        s.detail_value =
          (s.detail_key == "lesson_builder" ||
            s.detail_key == "notes" ||
            s.detail_key == "big_idea_info") &&
            s.detail_value != ""
            ? JSON.parse(s.detail_value)
            : s.detail_value;
      });
      if (data.page_links.length) {
        let amazon_keyword = data.page_links.find((e: any) => e.link_type == 6);
        let series_page_keyword = data.page_links.find((e: any) => e.link_type == 5);
        data.amazon_internal_keyword = amazon_keyword ? amazon_keyword.keyword : "";
        data.series_page_keyword = series_page_keyword ? series_page_keyword.keyword : "";
      } else {
        data.amazon_internal_keyword = "";
        data.series_page_keyword = "";
      }

      delete data.page_links;
      new SuccessResponse(EC.errorMessage(EC.saveDataSuccess), {
        //@ts-ignore
        token: req.token,
        data: data,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getSeriesMemoryVerseDetails(req: Request, res: Response) {
    try {
      let { category_id } = req.params;
      let data = await dbReader.categoriesDetail.findOne({
        where: { category_id: category_id, is_deleted: 0, detail_key: "series_memory_verse" },
        attributes: ["categories_detail_id", "detail_key", "detail_value",
          "created_datetime", "updated_datetime", "created_by", "updated_by"],
        include: [{
          model: dbReader.pageLink,
          attributes: ["page_link_id", "keyword"],
          where: { is_deleted: 0, site_id: curriculumSiteId, link_type: 8 },
        }]
      });
      if (data) {
        data = JSON.parse(JSON.stringify(data));
        data.detail_value = data.detail_value != "" ? JSON.parse(data.detail_value) : data.detail_value;
        data.memory_verse_keyword = data.page_link.keyword;
        data.page_link_id = data.page_link.page_link_id;
        delete data.page_link;
      }
      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        data: data,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async updateSeriesMemoryVerseDetails(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req, keyword = "";
      let { categories_detail_id, category_id, detail_value, page_link_id } = req.body;

      // Keyword Make Methods
      let categoriesData = await dbReader.categories.findOne({
        where: { category_id: category_id },
        attributes: ["category_title"],
      });
      if (categoriesData) {
        categoriesData = JSON.parse(JSON.stringify(categoriesData));
        keyword = categoriesData?.category_title.toLowerCase().replace(/[^a-zA-Z0-9]+/gi, "-");
      }
      if (detail_value.code) {
        keyword += "-" + detail_value.code.toLowerCase().replace(/[^a-zA-Z0-9]+/gi, "-");
      }
      keyword += "memory-verse";

      if (categories_detail_id) {
        let pageLink = await dbReader.pageLink.count({
          where: {
            is_deleted: 0,
            keyword: keyword,
            site_id: curriculumSiteId,
            page_link_id: { [dbReader.Sequelize.Op.ne]: page_link_id },
          }
        });
        if (pageLink > 0) {
          keyword += "-" + moment().unix();
        }
        if (page_link_id) {
          await dbWriter.pageLink.update({
            keyword: keyword,
            updated_datetime: new Date(),
          }, {
            where: { page_link_id: page_link_id },
          });
        } else {
          await dbWriter.pageLink.create({
            data_id: categories_detail_id,
            site_id: curriculumSiteId,
            keyword: keyword,
            target_url: "",
            ui_component: "memory-verses",
            link_type: 8,
            is_disable: 0,
          });
        }
        await dbWriter.categoriesDetail.update({
          detail_value: JSON.stringify(detail_value),
          updated_by: user_id,
        }, {
          where: { category_id: category_id, categories_detail_id: categories_detail_id, is_deleted: 0 }
        });
      } else {
        let categoriesDetailData = await dbWriter.categoriesDetail.create({
          category_id: category_id,
          detail_key: "series_memory_verse",
          detail_value: JSON.stringify(detail_value),
          created_by: user_id,
        });
        let pageLink = await dbReader.pageLink.count({
          where: { is_deleted: 0, keyword: keyword, site_id: curriculumSiteId },
        });
        if (pageLink > 0) {
          keyword += "-" + moment().unix();
        }
        await dbWriter.pageLink.create({
          data_id: categoriesDetailData.categories_detail_id,
          site_id: curriculumSiteId,
          keyword: keyword,
          target_url: "",
          ui_component: "memory-verses",
          link_type: 8,
          is_disable: 0,
        });
      }

      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async updateSeriesDetails(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req, newCategoriesDetails: any = [];
      let { ministry_type, category_id, category_title, category_image, total_week, categories_details } = req.body;
      let categorySlug = category_title.toLowerCase().replace(/[^a-zA-Z0-9]+/gi, "-");

      await dbWriter.categories.update({
        category_title: category_title,
        category_slug: categorySlug,
        category_image: category_image || "",
        total_week: total_week,
        updated_by: user_id,
      }, {
        where: { category_id: category_id }
      });

      if (categories_details && categories_details.length) {
        let seriesDetailId: any = [], newCategoriesDetail = null, detail_value = "case categories_detail_id";
        categories_details.forEach((element: any) => {
          if (element.detail_key != "series_resources" &&
            element.detail_key != "series_memory_verse" &&
            element.detail_key != "kids_series_elementary_tutorials" &&
            element.detail_key != "kids_series_preschool_tutorials"
          ) {
            if (element.categories_detail_id == 0 && element.detail_key == "amazon_internal") {
              newCategoriesDetail = {
                category_id: category_id,
                detail_key: element.detail_key,
                detail_value: element.detail_value,
                created_by: user_id,
              };
            } else if (element.categories_detail_id == 0) {
              if (element.detail_key != "parent_volunteer_emails_link_v7" &&
                element.detail_key != "lesson_builder_link_v7" &&
                element.detail_key != "lesson_builder_link_v7_ele") {
                newCategoriesDetails.push({
                  category_id: category_id,
                  detail_key: element.detail_key,
                  detail_value: JSON.stringify(element.detail_value),
                  created_by: user_id,
                });
              } else {
                newCategoriesDetails.push({
                  category_id: category_id,
                  detail_key: element.detail_key,
                  detail_value: element.detail_value,
                  created_by: user_id,
                });
              }
            } else {
              let detailValue =
                element.detail_key == "lesson_builder" ||
                  element.detail_key == "notes" ||
                  element.detail_key == "big_idea_info"
                  ? JSON.stringify(element.detail_value)
                  : element.detail_value;

              if (element.detail_key == "description" || element.detail_key == "big_idea_info" || element.detail_key == "sub_title") {
                detailValue = detailValue.replace(/'/g, "\\'");
              }
              seriesDetailId.push(element.categories_detail_id);
              // detailValue = (element.detail_key == "amazon_internal") ? detailValue : JSON.stringify(detailValue);
              detail_value += " when " + element.categories_detail_id + " then '" + detailValue + "'";
            }
          }
        });

        if (seriesDetailId && seriesDetailId.length) {
          detail_value += " else detail_value end";
          await dbWriter.categoriesDetail.update({
            detail_value: dbWriter.Sequelize.literal(detail_value),
            updated_by: user_id,
          }, {
            where: { categories_detail_id: seriesDetailId },
          });
        }
        if (newCategoriesDetails.length) {
          await dbWriter.categoriesDetail.bulkCreate(newCategoriesDetails);
        }

        //create amazon internal keyword
        if (newCategoriesDetail) {
          let newCategoriesDetailData = await dbWriter.categoriesDetail.create(newCategoriesDetail);
          if (newCategoriesDetailData) {
            let ministry_keyword = ministry_type == 1 ? "growkids-" : (ministry_type == 2 ? "growstudents-" : "growgroups-");
            let amazon_keyword = ministry_keyword + categorySlug + "-amazon-" + moment().unix();
            let pageLink = await dbReader.pageLink.count({
              where: { is_deleted: 0, keyword: amazon_keyword, site_id: curriculumSiteId }
            });
            if (pageLink > 0) {
              amazon_keyword += "-" + moment().unix();
            }
            await dbWriter.pageLink.create({
              data_id: category_id,
              site_id: curriculumSiteId,
              keyword: amazon_keyword,
              target_url: "",
              ui_component: "amazon-internal",
              link_type: 6,
              is_disable: 0,
            });
          }
        }

        //create series details keyword
        let existsPageLink = await dbReader.pageLink.count({
          where: { is_deleted: 0, site_id: curriculumSiteId, link_type: 5, data_id: category_id }
        });
        if (existsPageLink <= 0) {
          let ministry_keyword = ministry_type == 1 ? "kidsseries-" : (ministry_type == 2 ? "studentseries-" : "groupseries-");
          let series_keyword = ministry_keyword + categorySlug;
          let pageLink = await dbReader.pageLink.count({
            where: { is_deleted: 0, keyword: series_keyword, site_id: curriculumSiteId }
          });
          if (pageLink > 0) {
            series_keyword += "-" + moment().unix();
          }
          await dbWriter.pageLink.create({
            data_id: category_id,
            site_id: curriculumSiteId,
            keyword: series_keyword,
            target_url: "",
            ui_component: "series-detail",
            link_type: 5,
            is_disable: 0,
          });
        }
      }

      new SuccessResponse(EC.errorMessage(EC.saveDataSuccess), {
        //@ts-ignore
        token: req.token,
        data: true,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async deleteSeries(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req, categoryId = req.params.id;

      await dbWriter.categories.update(
        { is_deleted: 1, updated_by: user_id },
        { where: { category_id: categoryId } }
      );
      await dbWriter.pageSeries.update(
        { is_deleted: 1, updated_by: user_id },
        { where: { category_id: categoryId } }
      );

      let seriesEmail = await dbReader.seriesEmail.findAll({
        attributes: ["series_email_id"],
        where: { category_id: categoryId, is_deleted: 0 }
      });
      let seriesEmailId = seriesEmail.length ? seriesEmail.map((e: any) => { e.series_email_id }) : [];

      await dbWriter.seriesEmail.update(
        { is_deleted: 1, updated_by: user_id },
        { where: { series_email_id: seriesEmailId } }
      );
      await dbWriter.pageLink.update({ is_deleted: 1 }, {
        where: { data_id: seriesEmailId, link_type: 2, site_id: curriculumSiteId }
      });

      new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess), "").send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async saveSeriesEmail(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req, reqBody = req.body, seriesEmail: any, request: any;
      let titleSlug = reqBody.series_page_title.toLowerCase().replace(/[^a-zA-Z0-9]+/gi, "-");
      /* let thirdPartyConfiguration = await dbReader.thirdPartyConfiguration.findOne({
           where: { thirdparty_id: 5 },
           attributes: ["configuration_json"],
        });
       thirdPartyConfiguration = JSON.parse(JSON.stringify(thirdPartyConfiguration));
       let client_data = JSON.parse(thirdPartyConfiguration.configuration_json);
       client.setConfig({
         apiKey: client_data.api_key,
         server: client_data.server_prefix,
       }); */
      if (reqBody.series_email_id) {
        let pageLink = await dbReader.pageLink.findAll({
          where: dbReader.Sequelize.and(
            { is_deleted: 0 },
            { keyword: titleSlug },
            { site_id: curriculumSiteId },
            { data_id: { [dbReader.Sequelize.Op.ne]: reqBody.series_email_id } }
          ),
        });
        let is_validate = pageLink.length ? false : true;
        if (is_validate) {
          /*  let response: any, status: any;
           try {
             response = await client.templates.updateTemplate(
               reqBody.mail_chimp_id,
               {
                 name: reqBody.series_page_title,
                 html: reqBody.page_content,
               }
             );
             response = JSON.stringify(response);
             status = 200;
           } catch (error: any) {
             response = JSON.stringify(error);
             status = 400;
           } 
           request = {
             mail_chimp_id: reqBody.mail_chimp_id,
             name: reqBody.series_page_title,
             html: reqBody.page_content,
           };
           request = JSON.stringify(request);
           await dbWriter.thirdPartyLog.create({
             thirdparty_id: 5,
             request: request,
             response: response,
             activity_type: 13,
             status: status,
           }); */
          seriesEmail = await dbWriter.seriesEmail.update({
            series_page_title: reqBody.series_page_title,
            mail_chimp_link: reqBody.mail_chimp_link || "",
            page_content: reqBody.page_content || "",
            page_content_link: reqBody.page_content_link || "",
            updated_by: user_id,
          }, {
            where: { series_email_id: reqBody.series_email_id },
          });
          let pageLink = await dbReader.pageLink.findAll({
            where: {
              is_deleted: 0,
              data_id: reqBody.series_email_id,
              link_type: 2,
              site_id: curriculumSiteId,
            },
          });
          let is_validate = pageLink.length ? true : false;
          if (is_validate) {
            await dbWriter.pageLink.update({
              keyword: titleSlug
            }, {
              where: { is_deleted: 0, data_id: reqBody.series_email_id, link_type: 2, },
            });
          } else {
            await dbWriter.pageLink.create({
              data_id: reqBody.series_email_id,
              ui_component: "series-email",
              keyword: titleSlug,
              link_type: 2,
              site_id: curriculumSiteId,
            });
          }
        } else {
          throw new Error(
            EC.errorMessage("Series is already exists with given title.")
          );
        }
      } else {
        let pageLink = await dbReader.pageLink.findAll({
          where: {
            is_deleted: 0,
            keyword: titleSlug,
            site_id: curriculumSiteId,
          },
        });
        let is_validate = pageLink.length ? false : true;
        let templateId = reqBody.mail_chimp_id, template: any;
        if (is_validate) {
          /* if (!templateId) {
            template = await client.templates.create({
              name: reqBody.series_page_title,
              html: reqBody.page_content,
            });
            templateId = template.id;
            request = {
              name: reqBody.series_page_title,
              html: reqBody.page_content,
            };
            let status = template ? 200 : 400;
            request = JSON.stringify(request);
            let response = JSON.stringify(template);
            await dbWriter.thirdPartyLog.create({
              thirdparty_id: 5,
              request: request,
              response: response,
              activity_type: 13,
              status: status,
            });
          } */
          let mailChimpRedirectUrl = templateId != "" ? "https://admin.mailchimp.com/templates/share-template?id=" + templateId : "https://admin.mailchimp.com/templates/";
          seriesEmail = await dbWriter.seriesEmail.create({
            category_id: reqBody.category_id,
            series_page_title: reqBody.series_page_title,
            series_type: reqBody.series_type,
            week_number: reqBody.week_number,
            mail_chimp_id: templateId,
            mail_chimp_redirect_url: mailChimpRedirectUrl,
            mail_chimp_json: template ? JSON.stringify(template) : "",
            mail_chimp_link: reqBody.mail_chimp_link || "",
            page_content: reqBody.page_content || "",
            page_content_link: reqBody.page_content_link || "",
            created_by: user_id,
          });
          await dbWriter.pageLink.create({
            data_id: seriesEmail.series_email_id,
            ui_component: "series-email",
            keyword: titleSlug,
            link_type: 2,
            site_id: curriculumSiteId,
          });
        } else {
          throw new Error(
            EC.errorMessage("Series is already exists with given title.")
          );
        }
      }
      new SuccessResponse(EC.errorMessage(EC.saveDataSuccess), {
        //@ts-ignore
        token: req.token,
        seriesEmail: seriesEmail,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getSeriesEmailDetails(req: Request, res: Response) {
    try {
      let series_email_id = req.params.id;
      let data = await dbReader.seriesEmail.findOne({
        where: { series_email_id: series_email_id }
      });
      data = JSON.parse(JSON.stringify(data));
      new SuccessResponse(EC.errorMessage(EC.success), data).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getAllSeriesEmailPages(req: Request, res: Response) {
    try {
      let seriesId = req.params.id;
      let data = await dbReader.seriesEmail.findAll({
        where: { category_id: seriesId, is_deleted: 0 }
      });
      data = JSON.parse(JSON.stringify(data));
      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        seriesEmailPages: data,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getMailChimpData(req: Request, res: Response) {
    try {
      let template_id = req.params.id;
      let thirdPartyConfiguration = await dbReader.thirdPartyConfiguration.findOne({
        attributes: ["configuration_json"], where: { thirdparty_id: 5 },
      });
      thirdPartyConfiguration = JSON.parse(JSON.stringify(thirdPartyConfiguration));
      let client_data = JSON.parse(thirdPartyConfiguration.configuration_json);
      client.setConfig({
        apiKey: client_data.api_key,
        server: client_data.server_prefix,
      });
      let data = await client.templates.getTemplate(template_id);
      data = JSON.parse(JSON.stringify(data));
      new SuccessResponse(EC.errorMessage(EC.success), data).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getSeriesTutorials(req: Request, res: Response) {
    try {
      let { category_id } = req.params;
      let preschool_keyword = "", elementary_keyword = "", students_keyword = "";

      let preschool_data = await dbReader.categoriesDetail.findOne({
        attributes: ["categories_detail_id", "category_id", "detail_key", "detail_value",
          "created_datetime", "updated_datetime", "created_by", "updated_by"],
        where: { category_id: category_id, is_deleted: 0, detail_key: "kids_series_preschool_tutorials" },
        include: [{
          required: false,
          as: "series_tutorials",
          model: dbReader.pageLink,
          attributes: ["page_link_id", "keyword"],
          where: { is_deleted: 0, site_id: curriculumSiteId, link_type: 10 },
        }]
      });
      if (preschool_data) {
        preschool_data = JSON.parse(JSON.stringify(preschool_data));
        preschool_keyword = preschool_data.series_tutorials ? preschool_data.series_tutorials.keyword : "";
        preschool_data = preschool_data.detail_value != "" ? JSON.parse(preschool_data.detail_value) : preschool_data.detail_value;
      } else {
        preschool_data = [];
      }

      let elementary_data = await dbReader.categoriesDetail.findOne({
        attributes: ["categories_detail_id", "category_id", "detail_key", "detail_value",
          "created_datetime", "updated_datetime", "created_by", "updated_by"],
        where: { category_id: category_id, is_deleted: 0, detail_key: "kids_series_elementary_tutorials" },
        include: [{
          required: false,
          as: "series_tutorials",
          model: dbReader.pageLink,
          attributes: ["page_link_id", "keyword"],
          where: { is_deleted: 0, site_id: curriculumSiteId, link_type: 11 },
        }]
      });
      if (elementary_data) {
        elementary_data = JSON.parse(JSON.stringify(elementary_data));
        elementary_keyword = elementary_data.series_tutorials ? elementary_data.series_tutorials.keyword : "";
        elementary_data = elementary_data.detail_value != "" ? JSON.parse(elementary_data.detail_value) : elementary_data.detail_value;
      } else {
        elementary_data = [];
      }

      let students_data = await dbReader.categoriesDetail.findOne({
        attributes: ["categories_detail_id", "detail_key", "detail_value",
          "created_datetime", "updated_datetime", "created_by", "updated_by"],
        where: { category_id: category_id, is_deleted: 0, detail_key: "students_series_tutorials" },
        include: [{
          required: false,
          as: "series_tutorials",
          model: dbReader.pageLink,
          attributes: ["page_link_id", "keyword"],
          where: { is_deleted: 0, site_id: curriculumSiteId, link_type: 12 },
        }]
      });
      if (students_data) {
        students_data = JSON.parse(JSON.stringify(students_data));
        students_keyword = students_data.series_tutorials ? students_data.series_tutorials.keyword : "";
        students_data = students_data.detail_value != "" ? JSON.parse(students_data.detail_value) : students_data.detail_value;
      } else {
        students_data = [];
      }

      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        students_series_tutorials: {
          data: students_data,
          keyword: students_keyword,
        },
        kids_series_preschool_tutorials: {
          data: preschool_data,
          keyword: preschool_keyword,
        },
        kids_series_elementary_tutorials: {
          data: elementary_data,
          keyword: elementary_keyword,
        },
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async saveSeriesTutorials(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req;
      let { category_id, detail_key, detail_value } = req.body;
      let detail_flag = false, keyword = "", link_type: any;

      if (detail_key == "kids_series_preschool_tutorials") {
        keyword = "kids-series-preschool-tutorials";
        detail_flag = true;
        link_type = 10;
      } else if (detail_key == "kids_series_elementary_tutorials") {
        keyword = "kids-series-elementary-tutorials";
        detail_flag = true;
        link_type = 11;
      } else if (detail_key == "students_series_tutorials") {
        keyword = "students-series-tutorials";
        detail_flag = true;
        link_type = 12;
      }

      if (detail_key && detail_flag) {
        let categories = await dbReader.categories.findOne({
          where: { category_id: category_id, is_deleted: 0 },
          attributes: ["category_slug"],
        });
        if (categories) {
          keyword = categories.category_slug + "-" + keyword;
          let pageLink = await dbReader.pageLink.count({
            where: { is_deleted: 0, keyword: keyword, site_id: curriculumSiteId, data_id: category_id, link_type: 10 }
          });
          if (pageLink <= 0) {
            await dbWriter.pageLink.create({
              data_id: category_id,
              site_id: curriculumSiteId,
              keyword: keyword,
              target_url: "",
              ui_component: "series-tutorials",
              link_type: link_type,
              is_disable: 0,
            });
          }
        }

        let data = await dbReader.categoriesDetail.findOne({
          attributes: ["categories_detail_id"],
          where: { category_id: category_id, is_deleted: 0, detail_key: detail_key }
        });
        if (data) {
          await dbWriter.categoriesDetail.update({
            detail_value: JSON.stringify(detail_value),
            updated_by: user_id,
          }, {
            where: { categories_detail_id: data.categories_detail_id }
          });
        } else {
          await dbWriter.categoriesDetail.create({
            category_id: category_id,
            detail_key: detail_key,
            detail_value: JSON.stringify(detail_value),
            created_by: user_id,
          });
        }
      }

      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getAmazonInternals(req: Request, res: Response) {
    try {
      let { category_id } = req.params;
      let categoriesDetail = await dbReader.categoriesDetail.findAll({
        attributes: ["categories_detail_id", "category_id", "detail_key", "detail_value"],
        where: { category_id: category_id, detail_key: "amazon_internal", is_deleted: 0 },
        include: [{
          required: false,
          as: 'amazon_internal',
          attributes: ["page_link_id", "keyword"],
          model: dbReader.pageLink,
          where: { is_deleted: 0, site_id: curriculumSiteId, link_type: 6 },
        }],
      });
      if (categoriesDetail.length) {
        categoriesDetail = JSON.parse(JSON.stringify(categoriesDetail));
        categoriesDetail.forEach((element: any) => {
          element.detail_value = element.detail_value ? JSON.parse(element.detail_value) : "";
          element.keyword = element.amazon_internal ? element.amazon_internal.keyword : "";
          delete element.amazon_internal;
        });
      }

      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        amazon_data: categoriesDetail
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async saveAmazonInternals(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req;
      let { series_id, amazon_array } = req.body;
      if (series_id && amazon_array.length) {
        let i = 0;
        let series_data = await dbReader.categories.findOne({
          attributes: ["category_id", "category_slug", "ministry_type"],
          where: { category_id: series_id, is_deleted: 0 }
        });
        series_data = JSON.parse(JSON.stringify(series_data));
        let ministry_keyword = series_data.ministry_type == 1 ? "kidsseries-" : (series_data.ministry_type == 2 ? "studentseries-" : "groupseries-");

        //remove from existing details data
        let categoriesDetail = await dbReader.categoriesDetail.findAll({
          attributes: ["categories_detail_id", "category_id"],
          where: { category_id: series_id, detail_key: 'amazon_internal', is_deleted: 0 }
        });
        if (categoriesDetail.length) {
          let j = 0;
          categoriesDetail = JSON.parse(JSON.stringify(categoriesDetail));
          while (j < categoriesDetail.length) {
            if (!amazon_array.some((e: any) => e.categories_detail_id == categoriesDetail[j].categories_detail_id)) {
              await dbWriter.categoriesDetail.update({ is_deleted: 1 }, {
                where: { categories_detail_id: categoriesDetail[j].categories_detail_id }
              });
              await dbWriter.pageLink.update({ is_deleted: 1 }, {
                where: { detail_id: categoriesDetail[j].categories_detail_id, link_type: 6, data_id: series_id }
              });
            }
            j++;
          }
        }

        //add or update amazon internal data into tables
        while (i < amazon_array.length) {
          if (amazon_array[i].categories_detail_id == 0) {
            let new_data = await dbWriter.categoriesDetail.create({
              category_id: series_id,
              detail_key: "amazon_internal",
              detail_value: JSON.stringify(amazon_array[i].detail_value),
              created_by: user_id,
              updated_by: user_id,
            });

            let amazon_keyword = ministry_keyword + series_data.category_slug + "-amazon-" + moment().unix();
            await dbWriter.pageLink.create({
              data_id: series_id,
              detail_id: new_data.categories_detail_id,
              site_id: curriculumSiteId,
              keyword: amazon_keyword,
              target_url: "",
              ui_component: "amazon-internal",
              link_type: 6,
              is_disable: 0,
            });
          } else {
            await dbWriter.categoriesDetail.update({
              detail_value: JSON.stringify(amazon_array[i].detail_value),
              updated_by: user_id,
            }, {
              where: { categories_detail_id: amazon_array[i].categories_detail_id }
            });
          }
          i++;
        }

        new SuccessResponse(EC.errorMessage(EC.success), {
          //@ts-ignore
          token: req.token,
        }).send(res);
      } else {
        throw new Error(EC.errorMessage("Please provide valid data."));
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getSeriesResourcesDetails(req: Request, res: Response) {
    try {
      let { category_id } = req.params;
      let data = await dbReader.categoriesDetail.findOne({
        where: { category_id: category_id, is_deleted: 0, detail_key: "series_resources" }
      });
      if (data) {
        data = JSON.parse(JSON.stringify(data));
        data.detail_value = data.detail_value ? JSON.parse(data.detail_value) : data.detail_value;
      }
      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        data: data,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async updateSeriesResourcesDetails(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req, categoryResources: any;
      let { categories_detail_id, category_id, detail_value } = req.body;

      if (categories_detail_id) {
        categoryResources = await dbWriter.categoriesDetail.update({
          detail_value: JSON.stringify(detail_value),
          updated_by: user_id,
        }, {
          where: {
            category_id: category_id,
            categories_detail_id: categories_detail_id,
            is_deleted: 0,
          }
        });
      } else {
        categoryResources = await dbWriter.categoriesDetail.create({
          category_id: category_id,
          detail_key: "series_resources",
          detail_value: JSON.stringify(detail_value),
          created_by: user_id,
        });
      }
      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        data: categoryResources
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async updateSeriesHiddenDetails(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req;
      let { category_id = 0, is_hidden = 0 } = req.body;

      if (category_id) {
        await dbWriter.categories.update({
          is_hidden: is_hidden,
          updated_by: user_id
        }, {
          where: { category_id: category_id }
        });

        new SuccessResponse(EC.errorMessage(EC.successMessage), "").send(res);
      } else {
        throw new Error("Please provide series id.");
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  //Category API

  public async getAllCategories(req: Request, res: Response) {
    try {
      let categories = await dbReader.categories.findAll({
        where: { is_deleted: 0, parent_category_id: 0, category_level: 2 },
        include: [{
          separate: true,
          model: dbReader.categoriesDetail,
          where: { is_deleted: 0 },
        }, {
          as: "sub_category",
          model: dbReader.categories
        }],
        order: [["created_datetime", "DESC"]],
      });
      categories = JSON.parse(JSON.stringify(categories));
      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        categories
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getVolumeSeries(req: Request, res: Response) {
    try {
      let pageSeries: any = [];
      let { category_id, ministry_type } = req.body;
      let pageSeriesData = await dbReader.pages.findAll({
        attributes: ["page_id"],
        where: { is_deleted: 0, category_id: category_id, ministry_type: ministry_type },
        include: [{
          separate: true,
          model: dbReader.pageSeries,
          attributes: ["page_series_id", "category_id"],
          where: { is_deleted: 0, is_selected: 1 },
        }],
      });
      pageSeriesData = JSON.parse(JSON.stringify(pageSeriesData));
      pageSeriesData.forEach((e: any) => {
        e.page_series.forEach((s: any) => {
          if (!pageSeries.includes(s.category_id)) pageSeries.push(s.category_id);
        });
      });
      let seriesData = await dbReader.categories.findAll({
        attributes: ["category_id", "category_title"],
        where: { category_id: pageSeries, is_deleted: 0 }
      });
      seriesData = JSON.parse(JSON.stringify(seriesData));
      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        series: seriesData
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listSeriesSortOrders(req: Request, res: Response) {
    try {
      let { page_id, content_type_id } = req.body;
      let pageSeries = await dbReader.pageSeries.findAll({
        attributes: ["page_series_id", "sort_order", "category_id",
          [dbReader.Sequelize.literal('category_title'), 'category_title']],
        where: { is_deleted: 0, is_selected: 1, page_id: page_id, content_type_id: content_type_id },
        include: [{
          attributes: [],
          model: dbReader.categories,
        }],
        order: [['sort_order', 'ASC']]
      });
      pageSeries = JSON.parse(JSON.stringify(pageSeries));
      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        series: pageSeries
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async updateSeriesSortOrders(req: Request, res: Response) {
    try {
      let { sort_array = [] } = req.body;
      let arrPageSeriesId: any = [];
      let update_sort_order = "case page_series_id";
      if (sort_array.length) {
        sort_array.forEach((e: any) => {
          arrPageSeriesId.push(e.page_series_id);
          update_sort_order += " when " + e.page_series_id + " then " + e.sort_order;
        });
      }
      if (arrPageSeriesId.length) {
        update_sort_order += " else sort_order end";
        await dbWriter.pageSeries.update({
          sort_order: dbWriter.Sequelize.literal(update_sort_order),
        }, {
          where: { page_series_id: arrPageSeriesId }
        });
      }
      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        data: true
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
