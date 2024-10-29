import { Router } from "express";
import { postController } from "../../controllers/postController";
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';

const BearerToken = require('../../middleware/bearerToken');

export class PostRoute extends postController {

  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.get("/getAllAdminGames", BearerToken, this.getAllAdminGames);
    router.get("/getAllPostsCategories", BearerToken, this.getAllPostsCategories);
    router.post("/savePost", BearerToken, validator(schema.postPayload), this.savePost);
    router.post("/listAllPosts", validator(schema.listPostsPayload), this.listAllPosts);
    router.post("/listAllOldPosts", validator(schema.listPostsPayload), this.listAllOldPosts);
    router.post("/getAllNewsFeeds", BearerToken, validator(schema.getAllNewsFeedsPayload), this.getAllNewsFeeds);
    router.post("/listAllNewsFeeds", BearerToken, validator(schema.listAllNewsFeedsPayload), this.listAllNewsFeeds);
    router.delete("/deletePost/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.deletePost);
    router.post("/getPageConnectedPosts", BearerToken, validator(schema.getPageSeriesPayload), this.getPageConnectedPosts);
    router.post("/getPostDetails", BearerToken, validator(schema.getPostDetailsPayload), this.getPostDetails);
    router.post("/savePageConnectedPosts", BearerToken, validator(schema.savePagePostsPayload), this.savePageConnectedPosts);
    router.post("/listPostSortOrders", BearerToken, validator(schema.getPageSeriesPayload), this.listPostSortOrders);
    router.post("/updatePostSortOrders", BearerToken, this.updatePostSortOrders);
    router.post("/updatePostHiddenDetails", BearerToken, this.updatePostHiddenDetails);

    //Tip Videos API
    router.post("/saveTipVideos", BearerToken, validator(schema.saveTipVideosPayload), this.saveTipVideos);
    router.post("/listAllTipVideos", BearerToken, validator(schema.listTipVideosPayload), this.listAllTipVideos);
    router.delete("/deleteTipVideos/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.deleteTipVideos);
    router.get("/getTipVideosDetails/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.getTipVideosDetails);

    // Post folders APIs
    router.post("/sortPostFolders", BearerToken, this.sortPostFolders);
    router.post("/savePostFolders", BearerToken, validator(schema.postFoldersPayload), this.savePostFolders);
    router.get("/getPostFolders/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.getPostFolders);
    router.delete("/deletePostFolder/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.deletePostFolder);
    router.post("/savePostSortOrder", BearerToken, this.savePostSortOrder);
  }
}
