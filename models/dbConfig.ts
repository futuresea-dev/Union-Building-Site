import { Sequelize } from "sequelize";
import path from 'path';

var sql: any = {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_USER_PWD,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
        connectTimeout: 60000
    }
};
var sqlReader: any, sqlWriter: any;
if (process.env.NODE_ENV == "production") {
    console.log("Production DB Server Structure Model");
    sqlReader = {
        ...sql,
        host: process.env.DB_HOST_READER,
        timezone: '+00:00'
    }
    sqlWriter = {
        ...sql,
        host: process.env.DB_HOST_WRITER,
        timezone: '+00:00'
    }
} else if (process.env.NODE_ENV == "development") {
    console.log("Developing DB Server Structure Model");
    sqlReader = {
        ...sql,
        host: process.env.DB_HOST_READER,
        timezone: '+00:00'
    }
    sqlWriter = {
        ...sql,
        host: process.env.DB_HOST_WRITER,
        timezone: '+00:00'
    }
} else {
    console.log("Local DB Server Structure Model");
    sqlReader = {
        ...sql,
        host: process.env.DB_HOST_READER,
        timezone: '+05:30'
    }
    sqlWriter = {
        ...sql,
        host: process.env.DB_HOST_WRITER,
        timezone: '+05:30'
    }
}

// Connection
var [dbReader, dbWriter]: any = [{
    sequelize: new Sequelize(
        sql.database,
        sql.username,
        sql.password,
        sqlReader
    )
}, {
    sequelize: new Sequelize(
        sql.database,
        sql.username,
        sql.password,
        sqlWriter
    )
}];


var DbInstance = [{
    'name': dbReader
}, {
    'name': dbWriter
}]

DbInstance.forEach(element => {
    // Model Map
    element.name['users'] = require(path.join(__dirname, './usersModel'))(element.name['sequelize'], Sequelize);
    element.name['demo'] = require(path.join(__dirname, './demoModel'))(element.name['sequelize'], Sequelize);
    element.name['userSettings'] = require(path.join(__dirname, './userSettingsModel'))(element.name['sequelize'], Sequelize);

    element.name['coupons'] = require(path.join(__dirname, './couponsModel'))(element.name['sequelize'], Sequelize);
    element.name['couponsProduct'] = require(path.join(__dirname, './couponProductModel'))(element.name['sequelize'], Sequelize);
    element.name['sycuUserCoupon'] = require(path.join(__dirname, './growUserCoupon'))(element.name['sequelize'], Sequelize);
    element.name['userLoginLogs'] = require(path.join(__dirname, './userLoginLogs'))(element.name['sequelize'], Sequelize);
    element.name['paymentKeys'] = require(path.join(__dirname, './paymentKeysModel'))(element.name['sequelize'], Sequelize);
    element.name['membership'] = require(path.join(__dirname, './membershipsModel'))(element.name['sequelize'], Sequelize);
    element.name['membershipProduct'] = require(path.join(__dirname, './membershipProductModel'))(element.name['sequelize'], Sequelize);

    element.name['userSocialLogs'] = require(path.join(__dirname, './usersSocialLogModel'))(element.name['sequelize'], Sequelize);
    element.name['emailServices'] = require(path.join(__dirname, './emailServicesModel'))(element.name['sequelize'], Sequelize);
    element.name['siteEmailServices'] = require(path.join(__dirname, './siteEmailServicesModel'))(element.name['sequelize'], Sequelize);
    element.name['userSubscription'] = require(path.join(__dirname, './userSubscriptionsModel'))(element.name['sequelize'], Sequelize);
    element.name['userOrder'] = require(path.join(__dirname, './userOrdersModel'))(element.name['sequelize'], Sequelize);
    element.name['userOrderItems'] = require(path.join(__dirname, './userOrderItemsModel'))(element.name['sequelize'], Sequelize);
    element.name['categories'] = require(path.join(__dirname, './categoriesModel'))(element.name['sequelize'], Sequelize);
    element.name['categoriesDetail'] = require(path.join(__dirname, './categoriesDetailModel'))(element.name['sequelize'], Sequelize);
    element.name['contentTypes'] = require(path.join(__dirname, './contentTypeModel'))(element.name['sequelize'], Sequelize);
    element.name['contentMeta'] = require(path.join(__dirname, './contentMetaModel'))(element.name['sequelize'], Sequelize);
    element.name['pages'] = require(path.join(__dirname, './pagesModel'))(element.name['sequelize'], Sequelize);
    element.name['pageMeta'] = require(path.join(__dirname, './pageMetaModel'))(element.name['sequelize'], Sequelize);
    element.name['posts'] = require(path.join(__dirname, './postModel'))(element.name['sequelize'], Sequelize);
    element.name['postMeta'] = require(path.join(__dirname, './postMetaModel'))(element.name['sequelize'], Sequelize);
    element.name['pageUiComponent'] = require(path.join(__dirname, './pageUiComponentModel'))(element.name['sequelize'], Sequelize);
    element.name['pageSeries'] = require(path.join(__dirname, './pageSeriesModel'))(element.name['sequelize'], Sequelize);
    element.name['pagePosts'] = require(path.join(__dirname, './pagePostsModel'))(element.name['sequelize'], Sequelize);
    element.name['seriesEmail'] = require(path.join(__dirname, './seriesEmailModel'))(element.name['sequelize'], Sequelize);
    element.name['pageLink'] = require(path.join(__dirname, './pageLinkModel'))(element.name['sequelize'], Sequelize);
    element.name['postsFolders'] = require(path.join(__dirname, './postsFoldersModel'))(element.name['sequelize'], Sequelize);
    //Sm 20-09-22
    element.name['redirectionFolder'] = require(path.join(__dirname, './redirectionFolderModel'))(element.name['sequelize'], Sequelize);
    element.name['tipVideos'] = require(path.join(__dirname, './tipVideosModel'))(element.name['sequelize'], Sequelize);

    element.name["globalVariable"] = require(path.join(__dirname, "./globalVariableModel"))(element.name["sequelize"], Sequelize);
    element.name["emailDesignTemplate"] = require(path.join(__dirname, "./emailDesignTemplateModel"))(element.name["sequelize"], Sequelize);
    element.name["smsDesignTemplate"] = require(path.join(__dirname, "./smsDesignTemplateModel"))(element.name["sequelize"], Sequelize);

    element.name['sites'] = require(path.join(__dirname, './sitesModel'))(element.name['sequelize'], Sequelize);
    element.name['masterPaymentServices'] = require(path.join(__dirname, './masterPaymentServicesModel'))(element.name['sequelize'], Sequelize);
    element.name['sitePaymentServices'] = require(path.join(__dirname, './sitePaymentServicesModel'))(element.name['sequelize'], Sequelize);

    //sh 13-12-2021
    element.name['games'] = require(path.join(__dirname, './gamesModel'))(element.name['sequelize'], Sequelize);
    element.name['attachment'] = require(path.join(__dirname, './attachmentModel'))(element.name['sequelize'], Sequelize);
    element.name['filters'] = require(path.join(__dirname, './filtersModel'))(element.name['sequelize'], Sequelize);
    element.name['giFilters'] = require(path.join(__dirname, './gamesIcebreakersFiltersModel'))(element.name['sequelize'], Sequelize);
    element.name['favouritedGames'] = require(path.join(__dirname, './favouritedGamesModel'))(element.name['sequelize'], Sequelize);
    element.name['playedGames'] = require(path.join(__dirname, './playedGamesModel'))(element.name['sequelize'], Sequelize);
    element.name['mostViewedGames'] = require(path.join(__dirname, './mostViewedGamesModel'))(element.name['sequelize'], Sequelize);
    element.name['gameNotes'] = require(path.join(__dirname, './gameNotesModel'))(element.name['sequelize'], Sequelize);
    element.name['ratings'] = require(path.join(__dirname, './ratingsModel'))(element.name['sequelize'], Sequelize);
    element.name['gameNotes'] = require(path.join(__dirname, './gameNotesModel'))(element.name['sequelize'], Sequelize);
    element.name['notifications'] = require(path.join(__dirname, './notificationsModel'))(element.name['sequelize'], Sequelize);
    element.name['sentNotifications'] = require(path.join(__dirname, './sentNotificationsModel'))(element.name['sequelize'], Sequelize);
    element.name['sharedGames'] = require(path.join(__dirname, './sharedGamesModel'))(element.name['sequelize'], Sequelize);
    element.name['reportAbuse'] = require(path.join(__dirname, './reportAbuseModel'))(element.name['sequelize'], Sequelize);

    element.name['userMemberships'] = require(path.join(__dirname, './userMembershipModel'))(element.name['sequelize'], Sequelize);

    // Sa 13-12-2021
    element.name['icebreakers'] = require(path.join(__dirname, './iceBreakersModel'))(element.name['sequelize'], Sequelize);
    element.name['viewedIceBreakers'] = require(path.join(__dirname, './viewedIceBreakersModel'))(element.name['sequelize'], Sequelize);
    element.name['favoritedIceBreakers'] = require(path.join(__dirname, './favouritedIceBreakersModel'))(element.name['sequelize'], Sequelize);
    element.name['featuredCards'] = require(path.join(__dirname, './featuredCardsModel'))(element.name['sequelize'], Sequelize)
    element.name['countdownConfiguration'] = require(path.join(__dirname, './countdownConfigurationModel'))(element.name['sequelize'], Sequelize);
    element.name['options'] = require(path.join(__dirname, './optionsModel'))(element.name['sequelize'], Sequelize);
    element.name['countdowns'] = require(path.join(__dirname, './countdownsModel'))(element.name['sequelize'], Sequelize);
    element.name['exportCountdownVideoRequest'] = require(path.join(__dirname, './exportCountdownVideoRequestModel'))(element.name['sequelize'], Sequelize);
    element.name['apiLogs'] = require(path.join(__dirname, './apiLogModel'))(element.name['sequelize'], Sequelize);

    //Mr 03-12-21
    element.name['products'] = require(path.join(__dirname, './productModel'))(element.name['sequelize'], Sequelize);
    element.name['productFolder'] = require(path.join(__dirname, './productFolderModel'))(element.name['sequelize'], Sequelize);
    element.name['stripeCustomer'] = require(path.join(__dirname, './stripeCustomerModel'))(element.name['sequelize'], Sequelize);

    element.name['userAddress'] = require(path.join(__dirname, './userAddressModel'))(element.name['sequelize'], Sequelize);
    element.name['orderNotes'] = require(path.join(__dirname, './orderNotesModel'))(element.name['sequelize'], Sequelize);
    element.name['userSubscriptionItems'] = require(path.join(__dirname, './userSubscriptionItemsModel'))(element.name['sequelize'], Sequelize);
    element.name['userCard'] = require(path.join(__dirname, './userCardsModel'))(element.name['sequelize'], Sequelize);
    element.name['countryModel'] = require(path.join(__dirname, './countryModel'))(element.name['sequelize'], Sequelize);
    element.name['stateModel'] = require(path.join(__dirname, './stateModel'))(element.name['sequelize'], Sequelize);
    element.name['systemConfiguration'] = require(path.join(__dirname, './systemConfigurationModel'))(element.name['sequelize'], Sequelize);
    element.name['systemConfigurationMeta'] = require(path.join(__dirname, './systemConfigurationMetaModel'))(element.name['sequelize'], Sequelize);
    element.name['applicationMenu'] = require(path.join(__dirname, './applicationMenuModel'))(element.name['sequelize'], Sequelize);
    element.name['systemThirdPartyService'] = require(path.join(__dirname, './systemThirdPartyServiceModel'))(element.name['sequelize'], Sequelize);

    element.name['smsServices'] = require(path.join(__dirname, './smsServicesModel'))(element.name['sequelize'], Sequelize);
    element.name['siteSmsServices'] = require(path.join(__dirname, './siteSmsServicesModel'))(element.name['sequelize'], Sequelize);

    //Sm 8-12-21
    element.name['transactionMaster'] = require(path.join(__dirname, './transactionMasterModel'))(element.name['sequelize'], Sequelize);

    // So
    element.name['sendEmailLog'] = require(path.join(__dirname, './sendEmailLogsModel'))(element.name['sequelize'], Sequelize);
    // SH - 24-12-2021
    element.name['refunds'] = require(path.join(__dirname, './refundModel'))(element.name['sequelize'], Sequelize);

    element.name['notesModel'] = require(path.join(__dirname, './builder/notesModel'))(element.name['sequelize'], Sequelize);
    element.name['games'] = require(path.join(__dirname, './gamesModel'))(element.name['sequelize'], Sequelize);
    element.name['messageBuildList'] = require(path.join(__dirname, './builder/messageBuildListModel'))(element.name['sequelize'], Sequelize);
    element.name['seriesBuildList'] = require(path.join(__dirname, './builder/seriesBuildListModel'))(element.name['sequelize'], Sequelize);
    element.name['shareCode'] = require(path.join(__dirname, './builder/shareCodeModel'))(element.name['sequelize'], Sequelize);
    element.name['buildFolder'] = require(path.join(__dirname, './builder/buildFolderModel'))(element.name['sequelize'], Sequelize);
    element.name['buildElements'] = require(path.join(__dirname, './builder/buildElementsModel'))(element.name['sequelize'], Sequelize);
    element.name['buildElementsDetails'] = require(path.join(__dirname, './builder/buildElementsDetailsModel'))(element.name['sequelize'], Sequelize);
    element.name['volumeModel'] = require(path.join(__dirname, './builder/volumeModel'))(element.name['sequelize'], Sequelize);
    element.name['addedCodes'] = require(path.join(__dirname, './builder/addedCodesModel'))(element.name['sequelize'], Sequelize);
    element.name['sendContactInquiryEmail'] = require(path.join(__dirname, './builder/sendContactInquiryEmailModel'))(element.name['sequelize'], Sequelize);

    element.name['hubs'] = require(path.join(__dirname, './hubsModel'))(element.name['sequelize'], Sequelize);

    element.name['appVisitHistory'] = require(path.join(__dirname, './appVisitHistoryModel'))(element.name['sequelize'], Sequelize);

    element.name['permissions'] = require(path.join(__dirname, './permissionModel'))(element.name['sequelize'], Sequelize);
    element.name['permissionProfile'] = require(path.join(__dirname, './permissionProfileModel'))(element.name['sequelize'], Sequelize);
    element.name['systemPages'] = require(path.join(__dirname, './systemPagesModel'))(element.name['sequelize'], Sequelize);
    element.name['circleUser'] = require(path.join(__dirname, './circleUsersModel'))(element.name['sequelize'], Sequelize);
    element.name['communities'] = require(path.join(__dirname, './circleCommunitiesModel'))(element.name['sequelize'], Sequelize);
    element.name['spaces'] = require(path.join(__dirname, './circleSpacesModel'))(element.name['sequelize'], Sequelize);
    element.name['CirclePosts'] = require(path.join(__dirname, './circlePostsModel'))(element.name['sequelize'], Sequelize);
    element.name['comments'] = require(path.join(__dirname, './circleCommentsModel'))(element.name['sequelize'], Sequelize);
    element.name['slideShows'] = require(path.join(__dirname, './slidr/slideshowModel'))(element.name['sequelize'], Sequelize);
    element.name['slides'] = require(path.join(__dirname, './slidr/slidesModel'))(element.name['sequelize'], Sequelize);
    element.name['slideshowSetting'] = require(path.join(__dirname, './slidr/slideshowSettingModel'))(element.name['sequelize'], Sequelize);
    element.name['feeds'] = require(path.join(__dirname, './feedModel'))(element.name['sequelize'], Sequelize);
    element.name['amazonEvents'] = require(path.join(__dirname, './amazonEventsModel'))(element.name['sequelize'], Sequelize);
    element.name['sharedPages'] = require(path.join(__dirname, './sharedPagesModel'))(element.name['sequelize'], Sequelize);
    element.name['sharedPagesContentTypes'] = require(path.join(__dirname, './sharedPageContentTypeModel'))(element.name['sequelize'], Sequelize);

    element.name['logs'] = require(path.join(__dirname, './logsModel'))(element.name['sequelize'], Sequelize);
    element.name['notes'] = require(path.join(__dirname, './notesModel'))(element.name['sequelize'], Sequelize);
    element.name['subscriptionRenewal'] = require(path.join(__dirname, './subscriptionRenewalModel'))(element.name['sequelize'], Sequelize);
    element.name['subscriptionRenewalCronLog'] = require(path.join(__dirname, './subscriptionRenewalCronLogModel'))(element.name['sequelize'], Sequelize);

    element.name['geoData'] = require(path.join(__dirname, './geoDataModel'))(element.name['sequelize'], Sequelize);
    element.name['geoConfig'] = require(path.join(__dirname, './geoConfigModel'))(element.name['sequelize'], Sequelize);

    // Hub's Models
    element.name['hubNotification'] = require(path.join(__dirname, './hub/notificationModel'))(element.name['sequelize'], Sequelize);
    element.name['hubNotificationSent'] = require(path.join(__dirname, './hub/notificationSentModel'))(element.name['sequelize'], Sequelize);
    element.name['hubAttachments'] = require(path.join(__dirname, './hub/attachmentsModel'))(element.name['sequelize'], Sequelize);
    element.name['hubs'] = require(path.join(__dirname, './hub/hubsModel'))(element.name['sequelize'], Sequelize);
    element.name['hubAnnouncements'] = require(path.join(__dirname, './hub/announcementsModel'))(element.name['sequelize'], Sequelize);
    element.name['hubUserInvites'] = require(path.join(__dirname, './hub/userInvitesModel'))(element.name['sequelize'], Sequelize);
    element.name['hubReactions'] = require(path.join(__dirname, './hub/reactionsModel'))(element.name['sequelize'], Sequelize);
    element.name['hubVisitors'] = require(path.join(__dirname, './hub/visitorsModel'))(element.name['sequelize'], Sequelize);
    element.name['hubComments'] = require(path.join(__dirname, './hub/commentsModel'))(element.name['sequelize'], Sequelize);
    element.name['hubManageAdmins'] = require(path.join(__dirname, './hub/manageAdminsModel'))(element.name['sequelize'], Sequelize);
    element.name['hubBanners'] = require(path.join(__dirname, './hub/bannersModel'))(element.name['sequelize'], Sequelize);
    element.name['hubScheduleAnnouncement'] = require(path.join(__dirname, './hub/scheduleAnnouncementModel'))(element.name['sequelize'], Sequelize);
    element.name['hubSMSShortLink'] = require(path.join(__dirname, './hub/smsShortLinkModel'))(element.name['sequelize'], Sequelize);
    element.name['hubChatRooms'] = require(path.join(__dirname, './hub/chatRoomsModel'))(element.name['sequelize'], Sequelize);
    element.name['hubChatRoomUsers'] = require(path.join(__dirname, './hub/chatRoomUsersModel'))(element.name['sequelize'], Sequelize);
    element.name['hubChatMessages'] = require(path.join(__dirname, './hub/chatMessagesModel'))(element.name['sequelize'], Sequelize);
    element.name['hubChatMessagesRead'] = require(path.join(__dirname, './hub/chatMessagesReadModel'))(element.name['sequelize'], Sequelize);
    element.name['hubChatMessagesReplies'] = require(path.join(__dirname, './hub/chatMessagesRepliesModel'))(element.name['sequelize'], Sequelize);
    element.name['hubCalender'] = require(path.join(__dirname, './hub/calenderModel'))(element.name['sequelize'], Sequelize);
    element.name['hubOption'] = require(path.join(__dirname, './hub/optionModel'))(element.name['sequelize'], Sequelize);
    element.name['tutorial'] = require(path.join(__dirname, './tutorialModel'))(element.name['sequelize'], Sequelize);
    element.name['faq'] = require(path.join(__dirname, './faqModel'))(element.name['sequelize'], Sequelize);

    element.name['thirdParty'] = require(path.join(__dirname, './thirdParty/thirdPartyModel'))(element.name['sequelize'], Sequelize);
    element.name['thirdPartyConfiguration'] = require(path.join(__dirname, './thirdParty/thirPartyConfigurationModel'))(element.name['sequelize'], Sequelize);
    element.name['thirdPartyLog'] = require(path.join(__dirname, './thirdParty/thirPartyLogModel'))(element.name['sequelize'], Sequelize);

    //Affiliate's Models
    element.name['affiliates'] = require(path.join(__dirname, './affiliates/affiliatesModel'))(element.name['sequelize'], Sequelize);
    element.name['affiliateConfigurations'] = require(path.join(__dirname, './affiliates/affiliateConfigurationsModel'))(element.name['sequelize'], Sequelize);
    element.name['affiliatePayouts'] = require(path.join(__dirname, './affiliates/affiliatePayoutsModel'))(element.name['sequelize'], Sequelize);
    element.name['affiliateReferrals'] = require(path.join(__dirname, './affiliates/affiliateReferralsModel'))(element.name['sequelize'], Sequelize);
    element.name['affiliateVisits'] = require(path.join(__dirname, './affiliates/affiliateVisitsModel'))(element.name['sequelize'], Sequelize);

    element.name['shipbobMethodsModel'] = require(path.join(__dirname, './shipbobMethodsModel'))(element.name['sequelize'], Sequelize);

    element.name['shipbobProductModel'] = require(path.join(__dirname, './shipbobProductModel'))(element.name['sequelize'], Sequelize);
    element.name['shipbobSycuProductModel'] = require(path.join(__dirname, './shipbobSycuProductModel'))(element.name['sequelize'], Sequelize);
    element.name['shipbobChannelModel'] = require(path.join(__dirname, './shipbobChannelModel'))(element.name['sequelize'], Sequelize);
    element.name['adminActivityModel'] = require(path.join(__dirname, './adminActivityModel'))(element.name['sequelize'], Sequelize);

    element.name['shipbobOrders'] = require(path.join(__dirname, './shipbobOrderModel'))(element.name['sequelize'], Sequelize);
    element.name['userEmailsHistory'] = require(path.join(__dirname, './userEmailsHistoryModel'))(element.name['sequelize'], Sequelize);

    //Sm 21-07-22
    element.name['habit'] = require(path.join(__dirname, './habitModel'))(element.name['sequelize'], Sequelize);
    element.name['category'] = require(path.join(__dirname, './categoryModel'))(element.name['sequelize'], Sequelize);
    element.name['resource'] = require(path.join(__dirname, './resourceModel'))(element.name['sequelize'], Sequelize);
    element.name['shareResource'] = require(path.join(__dirname, './shareResourceModel'))(element.name['sequelize'], Sequelize);
    element.name['paymentCheck'] = require(path.join(__dirname, './paymentCheckModel'))(element.name['sequelize'], Sequelize);
    //SA 14-11-2022
    element.name['disputedTransaction'] = require(path.join(__dirname, './disputedTransactionModel'))(element.name['sequelize'], Sequelize);
    element.name['disputedEvidence'] = require(path.join(__dirname, './disputedEvidenceModel'))(element.name['sequelize'], Sequelize);
    element.name['liveChatData'] = require(path.join(__dirname, './liveChatModel'))(element.name['sequelize'], Sequelize);
    element.name["cronLogs"] = require(path.join(__dirname, "./cronLogsModel"))(
        element.name["sequelize"],
        Sequelize
    );
    element.name['signupMetricReportModel'] = require(path.join(__dirname, './signupMetricReportModel'))(element.name['sequelize'], Sequelize);
    element.name['checkoutUtmCampaignModel'] = require(path.join(__dirname, './checkoutUtmCampaignModel'))(element.name['sequelize'], Sequelize);
    //Grow Together Models - 21-04-2023
    element.name['growTogetherIntakeForms'] = require(path.join(__dirname, './growTogetherIntakeFormModel'))(element.name['sequelize'], Sequelize);
    element.name['userKidsMusic'] = require(path.join(__dirname, './userKidsMusicModel'))(element.name['sequelize'], Sequelize);
    element.name['userKidsMusicLibrary'] = require(path.join(__dirname, './userKidsMusicLibraryModel'))(element.name['sequelize'], Sequelize);

    element.name['dashbordWidget'] = require(path.join(__dirname, './dashbordWidgetModel'))(element.name['sequelize'], Sequelize);
    element.name['disputeLogs'] = require(path.join(__dirname, './stripeDisputeLogsModel'))(element.name['sequelize'], Sequelize);
    element.name['conUsers'] = require(path.join(__dirname, './conUsersModel'))(element.name['sequelize'], Sequelize);
    element.name['freeTrialProduct'] = require(path.join(__dirname, './freeTrialProduct'))(element.name['sequelize'], Sequelize);

    // Grow conn videoes
    element.name['growConVideoes'] = require(path.join(__dirname, './growConVideoesModel'))(element.name['sequelize'], Sequelize);
    element.name['growConFolders'] = require(path.join(__dirname, './growConFoldersModel'))(element.name['sequelize'], Sequelize);

    //free trial models
    element.name['growStories'] = require(path.join(__dirname, './growStoriesModel'))(element.name['sequelize'], Sequelize);
    element.name['growStoriesViews'] = require(path.join(__dirname, './growStoriesViewsModel'))(element.name['sequelize'], Sequelize);
    element.name['helpfulResources'] = require(path.join(__dirname, './helpfulResourcesModel'))(element.name['sequelize'], Sequelize);
    element.name['applicationAds'] = require(path.join(__dirname, './applicationAdsModel'))(element.name['sequelize'], Sequelize);
    element.name['applicationColor'] = require(path.join(__dirname, './applicationColorModel'))(element.name['sequelize'], Sequelize);
    element.name['feedBack'] = require(path.join(__dirname, './feedbackModel'))(element.name['sequelize'], Sequelize);
    element.name['todoList'] = require(path.join(__dirname, './todoListModel'))(element.name['sequelize'], Sequelize);
    element.name['userTodoList'] = require(path.join(__dirname, './userToDoListModel'))(element.name['sequelize'], Sequelize);
    element.name['church'] = require(path.join(__dirname, './churchModel'))(element.name['sequelize'], Sequelize);

    //grow Books models
    element.name['growBooks'] = require(path.join(__dirname, './growBooksModel'))(element.name['sequelize'], Sequelize);
    element.name['growBooksAuthor'] = require(path.join(__dirname, './growBooksAuthorsModel'))(element.name['sequelize'], Sequelize);
    element.name['growBooksCategory'] = require(path.join(__dirname, './growBooksCategoriesModel'))(element.name['sequelize'], Sequelize);

    element.name['activeCampaignTags'] = require(path.join(__dirname, './activeCampaignTagsModel'))(element.name['sequelize'], Sequelize);
    element.name['checkOutLogs'] = require(path.join(__dirname, './checkOutLogsModel'))(element.name['sequelize'], Sequelize);

    // Share all pages changes - KM 11/06/2024
    element.name['shareAllPages'] = require(path.join(__dirname, './shareAllPagesModel'))(element.name['sequelize'], Sequelize)

    // Support ticket 
    element.name['supportTickets'] = require(path.join(__dirname, './supportTicketsModel'))(element.name['sequelize'], Sequelize)
    element.name['supportTicketTypes'] = require(path.join(__dirname, './supportTicketTypesModel'))(element.name['sequelize'], Sequelize)
    element.name['supportTicketApplications'] = require(path.join(__dirname, './supportTicketApplicationsModel'))(element.name['sequelize'], Sequelize)
    element.name['supportTicketStatus'] = require(path.join(__dirname, './supportTicketStatusModel'))(element.name['sequelize'], Sequelize)
    element.name['supportTicketServices'] = require(path.join(__dirname, './supportTicketServicesModel'))(element.name['sequelize'], Sequelize)
    element.name['supportTicketAssignees'] = require(path.join(__dirname, './supportTicketAssigneesModel'))(element.name['sequelize'], Sequelize)
    element.name['supportTicketActivities'] = require(path.join(__dirname, './supportTicketActivitiesModel'))(element.name['sequelize'], Sequelize)
    element.name['supportTicketLinks'] = require(path.join(__dirname, './supportTicketLinksModel'))(element.name['sequelize'], Sequelize)
    element.name['supportTicketNotes'] = require(path.join(__dirname, './supportTicketNotesModel'))(element.name['sequelize'], Sequelize)


    // Frontend exception log model
    element.name['frontendExceptionLogs'] = require(path.join(__dirname, './frontendExceptionLogsModel'))(element.name['sequelize'], Sequelize)

    //Nine Dot Menu Model
    element.name['nineDotMenu'] = require(path.join(__dirname, './nineDotMenuModel'))(element.name['sequelize'], Sequelize)

    element.name['baFacebookGroups'] = require(path.join(__dirname, './baFacebookGroupsModel'))(element.name['sequelize'], Sequelize);
    element.name['baFacebookGroupActivity'] = require(path.join(__dirname, './baFacebookGroupActivityModel'))(element.name['sequelize'], Sequelize);
    // Model Association
    Object.keys(element.name).forEach(function (modelName) {
        if ('associate' in element.name[modelName]) {
            element.name[modelName].associate(element.name);
        }
    });
});

dbReader.Sequelize = Sequelize
dbWriter.Sequelize = Sequelize

module.exports = { dbReader, dbWriter };
