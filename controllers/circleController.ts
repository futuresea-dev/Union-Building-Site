import { Request, Response } from "express";
import {
  ErrorController,
  SuccessResponse,
  BadRequestError,
  ApiError,
} from "../core/index";
import { ThirdPartyController } from "./thirdParty/thirdPartyController";
import { enumerationController } from "./enumerationController";
import { isActiveThirdPartyAPI } from "../helpers/helpers";

const axios = require("axios");
const { dbReader, dbWriter } = require("../models/dbConfig");
const { Op } = dbReader.Sequelize;

const thirdParty = new ThirdPartyController();
const EC = new ErrorController();
const enumObject = new enumerationController();

let circleApi: any, circleActivityType: any, community_id: any;

export class CircleController {
  /**
   * Initialize circle configuration variables
   */
  constructor() {
    circleApi = process?.env["Circle_API"];
    circleActivityType = enumObject.thirdPartyAPIType.get("circle").value;
  }
  /**
   * list of circle support tickets
   * @param req
   * @param res
   */
  public async listCircleSupportTickets(req: Request, res: Response) {
    try {
      let {
        email,
        site_id,
        sort_order,
        sort_field,
        page_no,
        page_record,
        search,
      } = req.body;
      let sortOrder = sort_order ? sort_order : "DESC";
      let sortField = sort_field ? sort_field : "post_id";
      let rowLimit = page_record ? parseInt(page_record) : 50;
      let rowOffset = page_no ? page_no * page_record - page_record : 0;
      let SearchCondition = search
        ? dbReader.Sequelize.Op.like
        : dbReader.Sequelize.Op.ne;
      let SearchData = search ? "%" + search + "%" : "";
      let whereCondition: any;
      if (email && site_id) {
        whereCondition = dbReader.Sequelize.and(
          { user_email: email },
          { site_id: site_id },
          { is_deleted: 0 },
          dbReader.Sequelize.or(
            { title: { [SearchCondition]: SearchData } },
            { user_name: { [SearchCondition]: SearchData } },
            { user_email: { [SearchCondition]: SearchData } }
          )
        );
      } else if (email && !site_id) {
        whereCondition = dbReader.Sequelize.and(
          { user_email: email },
          { is_deleted: 0 },
          dbReader.Sequelize.or(
            { title: { [SearchCondition]: SearchData } },
            { user_name: { [SearchCondition]: SearchData } },
            { user_email: { [SearchCondition]: SearchData } }
          )
        );
      } else if (!email && site_id) {
        whereCondition = dbReader.Sequelize.and(
          { site_id: site_id },
          { is_deleted: 0 },
          dbReader.Sequelize.or(
            { title: { [SearchCondition]: SearchData } },
            { user_name: { [SearchCondition]: SearchData } },
            { user_email: { [SearchCondition]: SearchData } }
          )
        );
      } else {
        whereCondition = dbReader.Sequelize.and(
          { is_deleted: 0 },
          dbReader.Sequelize.or(
            { title: { [SearchCondition]: SearchData } },
            { user_name: { [SearchCondition]: SearchData } },
            { user_email: { [SearchCondition]: SearchData } }
          )
        );
      }
      let findPosts = await dbReader.CirclePosts.findAndCountAll({
        where: whereCondition,
        attributes: [
          "post_id",
          "title",
          "post_url",
          "user_name",
          "user_email",
          "post_content",
          "circle_user_id",
          "user_id",
          "profile_url",
          "circle_post_id",
          "circle_space_id",
          "circle_community_id",
          "created_datetime",
          "updated_datetime",
        ],
        include: [
          {
            model: dbReader.sites,
            attributes: ["title"],
          },
        ],
        limit: rowLimit,
        offset: rowOffset,
        order: [[sortField, sortOrder]],
      });
      new SuccessResponse(EC.listOfData, {
        count: findPosts.count,
        posts: findPosts.rows,
      }).send(res);
    } catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  /**
   * get circle support ticket details
   * @param req
   * @param res
   */
  public async getCircleSupportTicketDetails(req: Request, res: Response) {
    try {
      let { post_id } = req.body;
      let findComment = await dbReader.CirclePosts.findOne({
        where: { circle_post_id: post_id, is_deleted: 0 },
        include: [
          {
            required: true,
            model: dbReader.users,
            attributes: ["user_id", "profile_image"],
            where: { is_deleted: 0 },
          },
          {
            required: false,
            model: dbReader.comments,
            where: { is_deleted: 0 },
            include: [
              {
                required: false,
                model: dbReader.users,
                attributes: ["user_id", "profile_image"],
                where: { is_deleted: 0 },
              },
            ],
          },
        ],
        order: [[{ model: dbReader.comments }, "created_datetime", "DESC"]],
      });
      if (findComment) {
        findComment = JSON.parse(JSON.stringify(findComment));
        const nest: any = (
          items: [],
          circle_comment_id = 0,
          link = "circle_parent_comment_id"
        ) =>
          items
            .filter((item: any) => item[link] === circle_comment_id)
            .map((item: any) => ({
              ...item,
              replies: nest(items, item.circle_comment_id).sort().reverse(),
            }));
        let nested = nest(
          JSON.parse(JSON.stringify(findComment.circle_comments))
        );
        findComment.circle_comments = nested.sort().reverse();
      } else {
        findComment = "";
      }
      new SuccessResponse(EC.listOfData, {
        posts: findComment,
      }).send(res);
    } catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  /**
   * save circle support ticket comment
   * @param req
   * @param res
   */
  public async saveCircleSupportTicketComment(req: Request, res: Response) {
    try {
      let {
        community_id,
        space_id,
        post_id,
        body,
        user_email,
        circle_parent_comment_id,
        skip_notifications,
      } = req.body;
      let thirdPartyConfiguration =
        await thirdParty?.GetThirdPartyConfigurationDetailsById(
          circleActivityType
        );
      let thirdPartyConfigurationAPIKey = JSON.parse(
        JSON.stringify(thirdPartyConfiguration)
      ).configuration_json.api_key;
      let findUser = await dbReader.circleUser.findOne({
        where: {
          email: user_email,
        },
        attributes: ["id"],
      });

      if (findUser) {
        let url;

        if (circle_parent_comment_id == 0) {
          url = `comments?community_id=${community_id}&space_id=${space_id}&post_id=${post_id}&body=${body}&user_email=${user_email}&skip_notifications=${skip_notifications}`;
        } else {
          url = `comments?community_id=${community_id}&space_id=${space_id}&post_id=${post_id}&body=${body}&user_email=${user_email}&parent_comment_id=${circle_parent_comment_id}&skip_notifications${skip_notifications}`;
        }
        await axios(`${circleApi}/${url}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${thirdPartyConfigurationAPIKey}`,
          },
        }).then(async (result: any) => {
          if (result.status == 200) {
            let UserId = await dbReader.users.findOne({
              where: {
                email: result.data.comment.user_email,
              },
              attributes: ["email", "user_id"],
            });
            if (UserId) {
              await dbWriter.comments.create({
                comment_text: result.data.comment.body.body,
                user_name: result.data.comment.user_name,
                user_email: result.data.comment.user_email,
                profile_url: result.data.comment.user_avatar_url,
                circle_comment_id: result.data.comment.id,
                circle_user_id: result.data.comment.user_id,
                circle_parent_comment_id:
                  result.data.comment.parent_comment_id == null
                    ? 0
                    : result.data.comment.parent_comment_id,
                user_id: UserId.user_id,
                circle_post_id: result.data.comment.post_id,
              });
            } else {
              await dbWriter.comments.create({
                comment_text: result.data.comment.body.body,
                user_name: result.data.comment.user_name,
                user_email: result.data.comment.user_email,
                profile_url: result.data.comment.user_avatar_url,
                circle_comment_id: result.data.comment.id,
                circle_user_id: result.data.comment.user_id,
                circle_parent_comment_id:
                  result.data.comment.parent_comment_id == null
                    ? 0
                    : result.data.comment.parent_comment_id,
                user_id: 0,
                circle_post_id: result.data.comment.post_id,
              });
            }
            new SuccessResponse(
              EC.errorMessage(result.data.message, ["Comment"]),
              {
                // @ts-ignore
                token: req.token,
                comment: result.data.comment,
              }
            ).send(res);
          }
        });
      } else {
        throw new Error(EC.errorMessage(EC.notFoundCircleUser, ["Circle"]));
      }
    } catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  /**
   * delete circle support ticket comment
   * @param req
   * @param res
   */
  public async deleteCircleSupportTicketComment(req: Request, res: Response) {
    try {
      let { community_id, comment_id } = req.body;
      let thirdPartyConfiguration =
        await thirdParty?.GetThirdPartyConfigurationDetailsById(
          circleActivityType
        );
      let thirdPartyConfigurationAPIKey = JSON.parse(
        JSON.stringify(thirdPartyConfiguration)
      ).configuration_json.api_key;
      let deleteCircleCommentActivityType =
        enumObject.thirdPartyActivityType.get("deleteCircleComment").value;
      await dbWriter.comments.update(
        {
          is_deleted: 1,
        },
        {
          where: {
            circle_comment_id: comment_id,
          },
        }
      );
      let circleDeleteCommentApi = `${circleApi}/comments/${comment_id}?community_id=${community_id}`;
      await axios(circleDeleteCommentApi, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${thirdPartyConfigurationAPIKey}`,
        },
      }).then((result: any) => {
        if (result.data.success == true) {
          // request data store in thirdParty api
          let deleteCommentCircleAPIRequest = {
            api: circleDeleteCommentApi,
            commentId: comment_id,
            communityId: community_id,
          };
          // response data store in thirdParty api
          let deleteCommentCircleAPIResponse = {
            statusCode: result.status,
            message: result.data.message,
            response: Object.assign({}, result.data),
          };
          // final thirdParty api log array
          let thirdPartyData = {
            thirdparty_id: circleActivityType,
            request: JSON.stringify(deleteCommentCircleAPIRequest),
            response: JSON.stringify(deleteCommentCircleAPIResponse),
            activity_type: deleteCircleCommentActivityType,
            status: result.status,
          };
          // store data into thirdParty api log
          thirdParty.SaveThirdPartyLog(thirdPartyData);
          new SuccessResponse(
            EC.errorMessage(result.data.message, ["Comment"]),
            {
              // @ts-ignore
              token: req.token,
            }
          ).send(res);
        }
      });
    } catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  /**
   * list circle spaces
   * @param req
   * @param res
   */
  public async listCircleSpaces(req: Request, res: Response) {
    try {
      let findSpaces = await dbReader.spaces.findAll({
        attributes: ["circle_space_id", "title"],
        include: [
          {
            model: dbReader.communities,
            attributes: ["title"],
          },
        ],
      });
      new SuccessResponse(EC.errorMessage(EC.listOfData, ["Comment"]), {
        // @ts-ignore
        token: req.token,
        Spaces: findSpaces,
      }).send(res);
    } catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  /**
   * sync users with circle
   * @param req
   * @param res
   */
  public async syncUsers(req: Request, res: Response) {
    try {
      await dbWriter.cronLogs.create({
        args: "Circle Users",
      });
      if (!(await isActiveThirdPartyAPI(circleActivityType))) {
        let user: any = [],
          addUserCircleAPIRequest: any = [],
          addUserCircleAPIResponse: any = [],
          thirdPartyData: any = [],
          Circle_Log: any = [],
          circle_community_id: any = [];
        let findCommunities = await dbReader.communities.findAll({
          attributes: ["id", "circle_community_id"],
        });
        let thirdPartyConfiguration =
          await thirdParty?.GetThirdPartyConfigurationDetailsById(
            circleActivityType
          );
        let thirdPartyConfigurationAPIKey = JSON.parse(
          JSON.stringify(thirdPartyConfiguration)
        ).configuration_json.api_key;
        let addCircleUserActivityType =
          enumObject.thirdPartyActivityType.get("addCircleUser").value;
        let i = 0;
        findCommunities.map(async (community: any) => {
          circle_community_id.push(community.circle_community_id);
        });

        while (i <= circle_community_id.length) {
          let api_circle_community_id = circle_community_id[i];
          let circleAddUserApi = `${circleApi}/community_members/?community_id=${api_circle_community_id}`;

          try {
            let get_response = await axios(circleAddUserApi, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${thirdPartyConfigurationAPIKey}`,
              },
            });

            console.log("URL ===> ", circleAddUserApi);
            console.log("Authorization ===> ", thirdPartyConfigurationAPIKey);

            let Circle_Log: any = [];
            if (get_response.data.length) {
              /** empty space */

              // Get Users Emails from Response
              let response_user_emails_arr = get_response.data.map(
                (s: any) => s.email
              );

              console.log(response_user_emails_arr);

              // Exisiting User Emails From DB
              let fetch_user_email_arr: any = [];
              fetch_user_email_arr = await dbReader.circleUser.findAll({
                attributes: ["email"],
              });
              fetch_user_email_arr = JSON.parse(
                JSON.stringify(fetch_user_email_arr)
              );

              var j = 0;

              // get unique records

              var unique: any = [];
              while (j < get_response.data.length) {
                let currntElement = get_response.data[j];
                if (
                  !fetch_user_email_arr.some(
                    (s: any) => s.email == currntElement.email
                  )
                ) {
                  unique.push({
                    circle_id: currntElement.id,
                    user_id: currntElement.user_id,
                    circle_community_id: currntElement.community_id,
                    first_name: currntElement.first_name,
                    last_name: currntElement.last_name,
                    email: currntElement.email,
                    avatar_url: currntElement.avatar_url,
                    profile_url: currntElement.profile_url,
                  });

                  // final thirdParty api log array
                  Circle_Log.push({
                    thirdparty_id: circleActivityType,
                    request: JSON.stringify({
                      api: circleAddUserApi,
                      communityId: currntElement.community_id,
                    }),
                    response: JSON.stringify({
                      statusCode: get_response.status,
                      message: get_response.statusText,
                      response: Object.assign({}, currntElement),
                    }),
                    activity_type: addCircleUserActivityType,
                    status: get_response.status,
                  });
                }
                j++;
              }

              if (unique.length) {
                console.log(unique.length);
                await dbWriter.circleUser.bulkCreate(unique);
              }
            }
          } catch (error: any) {
            addUserCircleAPIRequest = {
              api: circleAddUserApi,
            };
            // response data store in thirdParty api
            addUserCircleAPIResponse = {
              statusCode: 400,
              message: error.message,
              response: JSON.stringify(error),
            };
            Circle_Log.push({
              thirdParty_id: circleActivityType,
              request: JSON.stringify(addUserCircleAPIRequest),
              response: JSON.stringify(addUserCircleAPIResponse),
              activity_type: addCircleUserActivityType,
              status: 400,
            });
          }
          i++;
        }
        if (Circle_Log.length) {
          console.log(Circle_Log);

          // thirdParty.SaveThirdPartyLog(thirdPartyData);
        }
        new SuccessResponse(
          EC.errorMessage(EC.saveDataSuccess, ["CircleUsers"]),
          {
            // @ts-ignore
          }
        ).send(res);
      } else {
        throw new Error("Third party activity not enable.");
      }
    } catch (error: any) {
      await dbWriter.cronLogs.create({
        args: "Error : Circle Users",
      });
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  /**
   * sync communities with circle
   * @param req
   * @param res
   */
  public async syncCommunities(req: Request, res: Response) {
    try {
      await dbWriter.cronLogs.create({
        args: "Circle Communities",
      });
      if (!(await isActiveThirdPartyAPI(circleActivityType))) {
        let community: any = [],
          addCommunityCircleAPIRequest: any = [],
          addCommunityCircleAPIResponse: any = [];
        let thirdPartyData: any = [];
        let thirdPartyConfiguration =
          await thirdParty?.GetThirdPartyConfigurationDetailsById(
            circleActivityType
          );
        let thirdPartyConfigurationAPIKey = JSON.parse(
          JSON.stringify(thirdPartyConfiguration)
        ).configuration_json.api_key;
        let circleAddCommunitiesApi = `${circleApi}/communities`;
        let addCircleCommunityActivityType =
          enumObject.thirdPartyActivityType.get("addCircleCommunity").value;

        await axios(circleAddCommunitiesApi, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${thirdPartyConfigurationAPIKey}`,
          },
        })
          .then(async (communities: any) => {
            if (communities.data.length) {
              /** empty community and community_ids */
              community.splice(0, community.length);
              communities.data.forEach((element: any) => {
                community.push({
                  title: element.name,
                  circle_community_id: element.id,
                });
              });
              let findCommunities = await dbReader.communities.findAll({
                attributes: ["circle_community_id"],
              });
              /** update unique community */
              var unique: any = [];
              for (var i = 0; i < community.length; i++) {
                var found = false;
                for (var j = 0; j < findCommunities.length; j++) {
                  if (
                    community[i].circle_community_id ==
                    findCommunities[j].circle_community_id
                  ) {
                    found = true;
                    break;
                  }
                }
                if (found == false) {
                  unique.push(community[i]);

                  // request data store in thirdParty api
                  addCommunityCircleAPIRequest = {
                    api: circleAddCommunitiesApi,
                  };
                  // response data store in thirdParty api
                  addCommunityCircleAPIResponse = {
                    statusCode: 200,
                    message: EC.circleCommunitySave,
                    response: Object.assign({}, communities[i]),
                  };
                  // final thirdParty api log array
                  thirdPartyData.push({
                    thirdparty_id: circleActivityType,
                    request: JSON.stringify(addCommunityCircleAPIRequest),
                    response: JSON.stringify(addCommunityCircleAPIResponse),
                    activity_type: addCircleCommunityActivityType,
                    status: 200,
                  });
                }
              }
              if (unique.length) {
                await dbWriter.communities.bulkCreate(unique);
                await dbWriter.thirdPartyLog.bulkCreate(thirdPartyData);
              }
              new SuccessResponse(EC.saveDataSuccess, {
                // @ts-ignore
              }).send(res);
            }
          })
          .catch((error: any) => {
            addCommunityCircleAPIRequest = {
              api: circleAddCommunitiesApi,
            };
            // response data store in thirdParty api
            addCommunityCircleAPIResponse = {
              statusCode: error.response.status,
              message: error.message,
              response: error.data,
            };
            thirdPartyData = {
              thirdparty_id: circleActivityType,
              request: JSON.stringify(addCommunityCircleAPIRequest),
              response: JSON.stringify(addCommunityCircleAPIResponse),
              activity_type: addCircleCommunityActivityType,
              status: error.response.status,
            };
            thirdParty.SaveThirdPartyLog(thirdPartyData);
          });
      }
    } catch (error: any) {
      await dbWriter.cronLogs.create({
        args: "Error : Circle Communities",
      });
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  /**
   * sync spaces with circle
   * @param req
   * @param res
   */
  public async syncSpaces(req: Request, res: Response) {
    try {
      await dbWriter.cronLogs.create({
        args: "Circle Spaces",
      });
      if (!(await isActiveThirdPartyAPI(circleActivityType))) {
        let space: any = [],
          thirdPartyData: any = [],
          addSpaceCircleAPIRequest: any,
          addSpaceCircleAPIResponse: any;
        let findCommunities = await dbReader.communities.findAll({
          attributes: ["id", "circle_community_id"],
        });
        let thirdPartyConfiguration =
          await thirdParty?.GetThirdPartyConfigurationDetailsById(
            circleActivityType
          );
        let thirdPartyConfigurationAPIKey = JSON.parse(
          JSON.stringify(thirdPartyConfiguration)
        ).configuration_json.api_key;
        let addCircleSpaceActivityType =
          enumObject.thirdPartyActivityType.get("addCircleSpace").value;
        let circle_community_id: any = [];

        findCommunities.map(async (community: any) => {
          circle_community_id.push(community.circle_community_id);
        });

        var i = 0;
        while (i <= circle_community_id.length) {
          let new_circle_community_id = circle_community_id[i];
          let circleAddSpaceApi = `${circleApi}/spaces?community_id=${new_circle_community_id}&sort=active&per_page=200&page=1`;
          await axios(circleAddSpaceApi, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${thirdPartyConfigurationAPIKey}`,
            },
          })
            .then(async (spaces: any) => {
              if (spaces.data.length) {
                /** empty space */
                space.splice(0, space.length);
                spaces.data.forEach((element: any) => {
                  findCommunities.forEach((element1: any) => {
                    if (element.community_id == element1.circle_community_id) {
                      space.push({
                        title: element.name,
                        community_id: element1.id,
                        circle_community_id: element.community_id,
                        circle_space_id: element.id,
                      });
                    }
                  });
                });
                let findSpaces = await dbReader.spaces.findAll({
                  attributes: ["circle_space_id"],
                });
                var unique: any = [];
                for (var i = 0; i < space.length; i++) {
                  var found = false;
                  for (var j = 0; j < findSpaces.length; j++) {
                    if (
                      space[i].circle_space_id == findSpaces[j].circle_space_id
                    ) {
                      found = true;
                      break;
                    }
                  }
                  if (found == false) {
                    unique.push(space[i]);

                    // request data store in thirdParty api
                    addSpaceCircleAPIRequest = {
                      api: circleAddSpaceApi,
                      communityId: community_id,
                    };
                    // response data store in thirdParty api
                    addSpaceCircleAPIResponse = {
                      statusCode: spaces.status,
                      message: spaces.data.message,
                      response: Object.assign({}, space[i]),
                    };
                    // final thirdParty api log array
                    thirdPartyData.push({
                      thirdparty_id: circleActivityType,
                      request: JSON.stringify(addSpaceCircleAPIRequest),
                      response: JSON.stringify(addSpaceCircleAPIResponse),
                      activity_type: addCircleSpaceActivityType,
                      status: spaces.status,
                    });
                  }
                }

                if (unique.length) {
                  await dbWriter.spaces.bulkCreate(unique);
                  await dbWriter.thirdPartyLog.bulkCreate(thirdPartyData);
                }
              }
            })
            .catch((error: any) => {
              let addSpaceCircleErrorAPIRequest = {
                api: circleAddSpaceApi,
              };
              // response data store in thirdParty api
              let addSpaceCircleErrorAPIResponse = {
                statusCode: error.response.status,
                message: error.message,
                response: error.data,
              };
              let thirdPartyErrorLogData = {
                thirdparty_id: circleActivityType,
                request: JSON.stringify(addSpaceCircleErrorAPIRequest),
                response: JSON.stringify(addSpaceCircleErrorAPIResponse),
                activity_type: addCircleSpaceActivityType,
                status: error.response.status,
              };
              thirdParty.SaveThirdPartyLog(thirdPartyErrorLogData);
            });
          i++;
        }
        new SuccessResponse(
          EC.errorMessage(EC.saveDataSuccess, ["Community"]),
          {
            // @ts-ignore
          }
        ).send(res);
      }
    } catch (error: any) {
      await dbWriter.cronLogs.create({
        args: "Error : Circle Spaces",
      });
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  /**
   * sync posts with circle
   * @param req
   * @param res
   */
  public async syncPosts(req: Request, res: Response) {
    try {
      await dbWriter.cronLogs.create({
        args: "Circle Post",
      });
      // -----------------------------------------------------------------
      if (!(await isActiveThirdPartyAPI(circleActivityType))) {
        let thirdPartyConfiguration =
          await thirdParty?.GetThirdPartyConfigurationDetailsById(
            circleActivityType
          );
        let thirdPartyConfigurationAPIKey = JSON.parse(
          JSON.stringify(thirdPartyConfiguration)
        ).configuration_json.api_key;
        let addCirclePostActivityType =
          enumObject.thirdPartyActivityType.get("addCirclePost").value;
        // Communities Get
        let findCommunities = await dbReader.communities.findAll({
          attributes: ["id", "circle_community_id"],
        });
        let circle_community_id_arr: any = [];
        findCommunities.forEach((community: any) => {
          circle_community_id_arr.push(community.circle_community_id);
        });
        // Communities Get Over
        // Space Get
        let circle_spaces_id_arr: any = [],
          fetch_spaces = [];
        if (circle_community_id_arr.length) {
          fetch_spaces = await dbReader.spaces.findAll({
            where: { circle_community_id: circle_community_id_arr },
            attributes: ["id", "circle_space_id", "circle_community_id"],
          });
        }
        fetch_spaces.forEach((spaces: any) => {
          let applicationSiteSpaceId = enumObject.circleApplication.get(
            spaces.circle_space_id.toString()
          )?.value;
          if (applicationSiteSpaceId) {
            circle_spaces_id_arr.push({
              get_space_id: spaces.circle_space_id,
              get_community_id: spaces.circle_community_id,
              applicationSiteSpaceId: applicationSiteSpaceId,
            });
          }
        });
        // Space Get
        // console.log(circle_community_id_arr);
        // console.log(circle_community_id_arr.length);
        // console.log(circle_spaces_id_arr);
        // console.log(circle_spaces_id_arr.length);
        let j = 0,
          Circle_Log: any = [];
        while (j < circle_spaces_id_arr.length) {
          let site_id = circle_spaces_id_arr[j].applicationSiteSpaceId;
          let circleAddPostApi = `${circleApi}/posts?community_id=${circle_spaces_id_arr[j].get_community_id}&space_id=${circle_spaces_id_arr[j].get_space_id}`;
          console.log("URL ===> ", circleAddPostApi);
          // console.log("KEY ===> ", thirdPartyConfigurationAPIKey);
          try {
            let get_response = await axios(circleAddPostApi, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: thirdPartyConfigurationAPIKey,
              },
            });
            console.log("*********** IN TRUE ***********");
            // console.log(get_response);
            if (get_response.data.length) {
              let circle_posts_id_db_arr = [];
              let post_id = get_response.data.map((s: any) => s.id);
              if (post_id.length) {
                circle_posts_id_db_arr = await dbReader.CirclePosts.findAll({
                  attributes: ["circle_post_id"],
                  where: { circle_post_id: post_id },
                });
                circle_posts_id_db_arr = JSON.parse(
                  JSON.stringify(circle_posts_id_db_arr)
                );
              }
              let fetch_user_email_arr: any = [];
              let user_emails = get_response.data.map((s: any) => s.user_email);
              if (user_emails.length) {
                fetch_user_email_arr = await dbReader.users.findAll({
                  attributes: ["user_id", "email"],
                  where: { email: user_emails },
                });
                fetch_user_email_arr = JSON.parse(
                  JSON.stringify(fetch_user_email_arr)
                );
              }
              var i = 0,
                final_post_arr: any = [];
              while (i < get_response.data.length) {
                let currentEle = get_response.data[i];
                if (
                  fetch_user_email_arr.some(
                    (s: any) => s.email == currentEle.user_email
                  ) &&
                  !circle_posts_id_db_arr.some(
                    (s: any) => s.circle_post_id == currentEle.id
                  )
                ) {
                  // let applicationSiteSpaceId = enumObject.circleApplication.get(
                  //   currentEle.space_id.toString()
                  // )?.value;
                  final_post_arr.push({
                    circle_user_id: currentEle.user_id,
                    user_id: fetch_user_email_arr.find(
                      (item: any) => item.email === currentEle.user_email
                    ).user_id,
                    profile_url: currentEle.user_avatar_url,
                    circle_post_id: currentEle.id,
                    post_content: currentEle.body.body,
                    title: currentEle.name,
                    post_url: currentEle.url,
                    user_name: currentEle.user_name,
                    user_email: currentEle.user_email,
                    site_id: site_id,
                    circle_space_id: currentEle.space_id,
                    circle_community_id: currentEle.community_id,
                  });
                  // final thirdParty api log array
                  Circle_Log.push({
                    thirdparty_id: circleActivityType,
                    request: JSON.stringify({
                      api: circleAddPostApi,
                      communityId: currentEle.community_id,
                    }),
                    response: JSON.stringify({
                      statusCode: get_response.status,
                      message: get_response.statusText,
                      response: Object.assign({}, currentEle),
                    }),
                    activity_type: addCirclePostActivityType,
                    status: get_response.status,
                  });
                }
                i++;
              }
              if (final_post_arr.length) {
                dbWriter.CirclePosts.bulkCreate(final_post_arr);
              }
            }
          } catch (error: any) {
            console.log("*********** IN CATCH ***********");
            let addPostCircleAPIError_Request = {
              api: circleAddPostApi,
            };
            // console.log(addPostCircleAPIError_Request);
            let addPostCircleAPIError_Response = {
              statusCode: 400,
              message: error.message,
              response: JSON.stringify(error),
            };
            // console.log(addPostCircleAPIError_Response);
            Circle_Log.push({
              thirdParty_id: circleActivityType,
              request: JSON.stringify(addPostCircleAPIError_Request),
              response: JSON.stringify(addPostCircleAPIError_Response),
              activity_type: addCirclePostActivityType,
              status: 400,
            });
          }
          j++;
        }
        if (Circle_Log.length) thirdParty.SaveThirdPartyLog(Circle_Log);
        console.log("\n *********** DONE *********** \n");
        new SuccessResponse(
          EC.errorMessage(EC.saveDataSuccess, ["Community"]),
          {}
        ).send(res);
      } else {
        throw new Error("Third party activity not enable.");
      }
    } catch (error: any) {
      await dbWriter.cronLogs.create({
        args: "Error : Circle Post",
      });
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  /**
   * sync comments with circle
   * @param req
   * @param res
   */
  public async syncComments(req: Request, res: Response) {
    try {
      await dbWriter.cronLogs.create({
        args: "Circle Comments",
      });

      if (!(await isActiveThirdPartyAPI(circleActivityType))) {
        let comments: any = [],
          uniqueCircleAddCommentLog: any = [],
          circle_community_id: any = [],
          circleAddCommentRequest: any,
          circleAddCommentResponse: any;
        let emails: any = [];
        let thirdPartyConfiguration =
          await thirdParty?.GetThirdPartyConfigurationDetailsById(
            circleActivityType
          );
        let thirdPartyConfigurationAPIKey = JSON.parse(
          JSON.stringify(thirdPartyConfiguration)
        ).configuration_json.api_key;

        let circlePostAddCommentType =
          enumObject.thirdPartyActivityType.get("addCircleComment").value;
        let findCommunities = await dbReader.communities.findAll({
          attributes: ["id", "circle_community_id"],
        });

        findCommunities.map(async (community: any) => {
          circle_community_id.push(community.circle_community_id);
        });
        var i = 0;
        while (i <= circle_community_id.length) {
          let circleAddCommentAPI =
            circleApi + "/comments?community_id=" + circle_community_id[i];
          await axios(`${circleAddCommentAPI}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${thirdPartyConfigurationAPIKey}`,
            },
          })
            .then(async (comment: any) => {
              if (comment.data.length) {
                /** empty comments */

                comments.splice(0, comments.length);
                comment.data.forEach((element: any) => {
                  comments.push({
                    comment_text: element.body.body,
                    user_name: element.user_name,
                    user_email: element.user_email,
                    circle_comment_id: element.id,
                    circle_user_id: element.user_id,
                    circle_post_id: element.post_id,
                    circle_parent_comment_id:
                      element.parent_comment_id != null
                        ? element.parent_comment_id
                        : 0,
                    profile_url: element.user_avatar_url,
                    created_datetime: element.body.created_at,
                    updated_datetime: element.body.updated_at,
                  });
                });
                let findComments = await dbReader.comments.findAll({
                  attributes: ["circle_comment_id"],
                });
                /** update unique comment */
                var unique: any = [],
                  thirdPartyLogs: any = [];
                for (var i = 0; i < comments.length; i++) {
                  var found = false;
                  for (var j = 0; j < findComments.length; j++) {
                    if (
                      comments[i].circle_comment_id ==
                      findComments[j].circle_comment_id
                    ) {
                      found = true;
                      break;
                    }
                  }
                  if (found == false) {
                    unique.push(comments[i]);
                    emails.push(comments[i].user_email);

                    // create a request to store in thirdParty api logs
                    circleAddCommentRequest = {
                      api: circleAddCommentAPI,
                      community_id,
                      token: thirdPartyConfigurationAPIKey,
                    };

                    // create a response to store in thirdParty api logs
                    circleAddCommentResponse = {
                      statusCode: 200,
                      message: "Success",
                      response: Object.assign({}, comments[i]),
                    };

                    // create an array for thirdParty api logs
                    thirdPartyLogs.push({
                      thirdparty_id: circleActivityType,
                      request: JSON.stringify(circleAddCommentRequest),
                      response: JSON.stringify(circleAddCommentResponse),
                      activity_type: circlePostAddCommentType,
                      status: 200,
                    });
                  }
                }
                if (unique.length) {
                  let updateEmail: any = [];

                  await dbWriter.comments.bulkCreate(unique);
                  // Store thirdParty api logs
                  await dbWriter.thirdPartyLog.bulkCreate(thirdPartyLogs);

                  let Comment = await dbReader.users.findAll({
                    where: {
                      email: {
                        [Op.in]: emails,
                      },
                    },
                    attributes: ["email", "user_id"],
                  });
                  if (Comment.length) {
                    let user_id = "case user_email";
                    Comment.forEach((element: any) => {
                      if (element.email) {
                        updateEmail.push(element.email);
                        user_id +=
                          " when " +
                          JSON.stringify(element.email) +
                          " then '" +
                          element.user_id +
                          "'";
                      }
                    });
                    if (updateEmail.length) {
                      user_id += " else user_id end";
                      await dbWriter.comments.update(
                        {
                          updated_datetime: new Date(),
                          user_id: dbWriter.Sequelize.literal(user_id),
                        },
                        {
                          where: {
                            user_email: {
                              [dbReader.Sequelize.Op.in]: updateEmail,
                            },
                          },
                        }
                      );
                    }
                  }
                }
              }
            })
            .catch((error: any) => {
              circleAddCommentRequest = {
                api: circleAddCommentAPI,
              };
              // response data store in thirdParty api
              circleAddCommentResponse = {
                statusCode: error.response.status,
                message: error.message,
                response: error.data,
              };
              uniqueCircleAddCommentLog = {
                thirdparty_id: circleActivityType,
                request: JSON.stringify(circleAddCommentRequest),
                response: JSON.stringify(circleAddCommentResponse),
                activity_type: circlePostAddCommentType,
                status: error.response.status,
              };
              // console.log(uniqueCircleAddCommentLog);
              thirdParty.SaveThirdPartyLog(uniqueCircleAddCommentLog);
            });

          i++;
        }
        new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["Comments"]), {
          // @ts-ignore
        }).send(res);
      }
    } catch (error: any) {
      await dbWriter.cronLogs.create({
        args: "Circle Comments",
      });
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
}
