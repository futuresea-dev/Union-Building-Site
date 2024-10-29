export class ErrorController {

    public firstNameError: string;
    public lastNameError: string;
    public success: string;
    public error: string;

    public requiredFieldError: string;
    public checkOutSuccess: string;
    public saveDataSuccess: string;
    public publishPageSuccess: string;
    public unpublishPageSuccess: string;
    public saveFolderDataSuccess: string;
    public updateFolderDataSuccess: string;
    public saveCouponSuccess: string;
    public deleteCouponSuccess: string;
    public updatedDataSuccess: string;
    public deleteDataSuccess: string;
    public noDataFound: string;
    public ProfileDataNotFound: string;
    public postList: string;
    public postDetail: string;
    public userNotFound: string;
    public SystemPageDataNotFound: string;

    public idError: string;
    public authFailureResponse: string;
    public someThingWentWrong: string;
    /*
    * @ayushi 25-11-21        
    * @description : Common error variable for validation with label place holder
    */
    public atLeast: string;
    public required: string;
    public typeString: string;
    public typeNumber: string;
    public validFormate: string;
    public minLength: string;
    public maxLength: string;
    public fixedLength: string;

    // Sh - 24-11-2021
    public listOfData: string;
    public siteIdRequired: string;
    public paymentServiceIdRequired: string;
    public authJsonRequired: string;
    public sitePaymentGatewayIdRequired: string;

    //sh - 13-12-2021
    public gameDescriptionRequired: string;
    public gameTitleRequired: string;
    public creatorRequired: string;
    public filterIdRequired: string;
    public nameRequired: string;
    public isSystemRequired: string;
    public filterTypeRequired: string;
    public createdByRequired: string;
    public filterIsExist: string;
    public pageRecordRequired: string;
    public pageNoRequired: string;
    public sortFieldRequired: string;
    public sortOrderRequired: string;
    public unauthorizedError: string;
    public slideshowByGameExists: string;

    //santosh 20-12-2021
    //IceBreaker Add and List purpose
    public iceBreakerTitleRequired: string;
    public iceBreakerIdRequired: string;

    // Sm 24-11-21
    // email design template
    public emailDesignSuccess: string;
    public emailDesignTemplateId: string;
    public emailDesignTemplateTitle: string;
    public replyOnEmailAddress: string;
    public templateHtmlText: string;
    public subject: string;
    public isStatus: string;
    public isFor: string;

    //SH 02-03-22 for sms design
    public smsDesignTemplateField: string;

    // SO 
    public invalidSiteId: string;
    public rejectCancelSubscriptionSuccess: string;
    public approveCancelSubscriptionSuccess: string;

    //Sm 3-12-21
    public AuthFailureResponse: string;

    //SH 27-12-21
    public amountGreaterThanRefund: string;
    //SH 01-02-22
    public pageRecord: number = 100;
    public getMessage: string;
    public pinUnpin: string;
    public createdMessage: string;
    public savedMessage: string;
    public updatedMessage: string;
    public deletedMessage: string;
    public pageRecordFor10Page: number = 10;
    public successMessage: string;

    // sourabh 24-11-2021
    // Order List And Subscription list purpose
    public userIdMessageError: string;
    public orderIdMessageError: string;
    public subscriptionIdMessageError: string;
    public userIdNullErrorMessage: string;

    public messageSaved: string;
    public listMessageBuild: string;
    public seriesAlreadyAvailable: string;
    public shareLink: string;
    public deleteVolume: string;
    public listAdminLogs: string;
    /*
         *@olson 26-11-21        
         * 
         */
    public DataFetched: string;
    public Updated: string;

    //Sm 14-02-22
    public androidAppVersion: string;
    public androidForceUpdate: string;
    public rokuappversion: string;
    public rokuforceupdate: string;
    public iosAppVersion: string;
    public iosForceUpdate: string;
    public SystemConfigurationDataUpdated: string;
    public systemConfigurationId: string;
    public duplicateElement: string;
    public buildElementDetail: string;
    public elementSorted: string;
    public validVideoURL: string;
    public seriesElement: string;
    public duplicateSeries: string;
    public seriesSort: string;
    public volumeCU: string;
    public seriesCU: string;

    /**
     * Darshit 09-03-2022
     */
     public seriesIdRequired: string;
     public ministryTypeRequired: string;
     public ministrySubTypeRequired: string;
     public weekNumberRequired: string;
     public EmailnotFound:string;
     public CommentsnotFound:string;
     public publishedSlideshow:string;
     public SlideShowDataNotFound:string;
     public notFoundCircleUser:string;
     public importSlideshow: string;
     public gameIdRequired: string;
     
     public circleCommunitySave: string;
     public circleUserSave: string;

     //Sm 4-4-22
    public codeGenerated: string;
    public listAffiliate: string;
    public affiliateCreate: string;
    public affiliateUpdate: string;
    public affiliateId:string;
    public affiliateUser:string;
    

    //Jayesh 06042022
    public affiliatePayoutCreate: string;
    public affiliatePayoutUpdate: string;
    
    //Jayesh 07042022
    public latestAffiliateRegistrations: string;
    public mostValuableAffiliates: string;
    public recentAffiliateReferrals: string;
    public allTotalAffiliateDataCounts: string;
    public highestConvertingURLs: string;
    public visitAndReferralDataForGraph: string;

    //Sm 21-06-22
    public fileName:string;
    public siteId:string;
    public password:string;

    //Dl 07-07-2022
    public chargeReceiptSuccess:string;


    // So shipbob Messages
    public confirmationEmailHasSendSuccess:string;
    public shipbobDataTransferSuccess :string;
   
    //JG grow con videoes
    public growConAddVideo: string;
    public growConEditVideo: string;
    public growConGetVideo: string;
    public growConDeleteVideo: string;

    public pinnedNote: string;

    constructor() {
        // Daksh 17-11-2021
        // For Demo Purposed
        this.firstNameError = "Please provide first name value.";
        this.lastNameError = "Please provide last name value.";
        this.success = "Success.";
        this.error = "Oops! something went wrong.";
        this.requiredFieldError = "Please provide all required fields.";
        this.saveDataSuccess = "Product has been added successfully.";
        this.publishPageSuccess = "Publish page successfully.";
        this.unpublishPageSuccess = "Unpublish page successfully.";
        this.saveFolderDataSuccess = "Folder has been added successfully.";
        this.updateFolderDataSuccess = "Folder has been updated successfully.";
        this.saveCouponSuccess = "Coupon has been added successfully.";
        this.deleteCouponSuccess = "Coupon has been deleted successfully.";
        this.checkOutSuccess = "Subscription has been created successfully.";
        this.updatedDataSuccess = "Data updated successfully!";
        this.deleteDataSuccess = "Data deleted successfully!";
        this.noDataFound = "No data found.";
        this.postList = "List Of Posts.";
        this.postDetail = "Detail Of Posts."
        this.ProfileDataNotFound = "No data found for profile";
        this.userNotFound = "user not found"
        this.SystemPageDataNotFound = "No data found for system_pages";
        this.idError = "Please provide Id.";
        this.authFailureResponse = "Invalid Token.";

        /*
        * @ayushi 25-11-21        
        * @description : Common error message for validation with label place holder
        */

        this.atLeast = "Please select at least  " + process.env.ecPlaceHolder + " " + process.env.ecPlaceHolder + ".";
        this.required = process.env.ecPlaceHolder + " is required.";
        this.typeString = process.env.ecPlaceHolder + " should be a string.";
        this.typeNumber = process.env.ecPlaceHolder + " should be a number.";
        this.validFormate = "Please provide valid " + process.env.ecPlaceHolder + ".";
        this.minLength = process.env.ecPlaceHolder + " should have at least " + process.env.ecPlaceHolder + " digits.";
        this.maxLength = process.env.ecPlaceHolder + " should not be more then " + process.env.ecPlaceHolder + " digits.";
        this.fixedLength = process.env.ecPlaceHolder + "  must have " + process.env.ecPlaceHolder + " digits.";

        /*@olson 26-11-21 
        * 
        */
        this.DataFetched = "Data fetched successfully."
        this.Updated = "Data updated successfully "
        // Sh - 24-11-2021
        this.listOfData = "List Of Data.";
        this.siteIdRequired = `"site_id" is a required field`;
        this.paymentServiceIdRequired = `"payment_service_id" is a required field`;
        this.authJsonRequired = `"auth_json" is a required field`;
        this.sitePaymentGatewayIdRequired = `"site_payment_service_id" is a required field`;

        //Sa 20-12-2021
        //IceBreaker Add and List purpose
        this.iceBreakerTitleRequired = "IceBreaker title is required"
        this.iceBreakerIdRequired = " IceBreaker id is required"

        //sh - 13-12-2021
        this.gameDescriptionRequired = "Game description is required field";
        this.gameTitleRequired = "Game title is required field";
        this.creatorRequired = "Creator is required field";
        this.filterIdRequired = "Filter id is required field";
        this.nameRequired = "Name is required field";
        this.isSystemRequired = "Is system is required field";
        this.filterTypeRequired = "Filter type is required field";
        this.createdByRequired = "Created by is required field";
        this.filterIsExist = "This filter is already exist";
        this.pageRecordRequired = "Page record is required field";
        this.pageNoRequired = "Page no. is required field";
        this.sortFieldRequired = "Sort field is required field";
        this.sortOrderRequired = "Sort order is required field";
        this.unauthorizedError = "UnauthorizedError user";
        this.slideshowByGameExists = "The slideshow related to this game already exist";

        //SH 27-12-21
        // For Refund module
        this.amountGreaterThanRefund = "Amount should be less than Order Amount!";
        //SH 01-02-22 ---> FOR HUB
        this.getMessage = "Get all " + process.env.ecPlaceHolder + " successfully.";
        this.createdMessage = process.env.ecPlaceHolder + " created Successfully";
        this.updatedMessage = process.env.ecPlaceHolder + " updated Successfully";
        this.deletedMessage = process.env.ecPlaceHolder + " removed Successfully";
        this.savedMessage = process.env.ecPlaceHolder + " saved Successfully";
        this.successMessage = process.env.ecPlaceHolder + " Successfully";
        this.pinUnpin = "Announcement " + process.env.ecPlaceHolder + " Successfully";


        // Sm 24-11-2021
        // For Email Design Template
        this.emailDesignSuccess = "Email Design Template Record added/updated.";
        this.emailDesignTemplateId = "Email Design Template Id is a required filed.";
        this.emailDesignTemplateTitle = "Email Design Template Title is a required filed.";
        this.replyOnEmailAddress = "Reply on Email Address is a required field.";
        this.templateHtmlText = "Template Html Text is a required field.";
        this.subject = "Subject is a required field."
        this.isStatus = "is_status is a required field."
        this.isFor = "is_for is a required field."

        //SH 02-03-22
        this.smsDesignTemplateField = "SMS " + process.env.ecPlaceHolder +  " is a required filed.";

        //Sm 3-12-21
        this.AuthFailureResponse = "Invalid token.";

        // Sourabh => 24-11-2021 
        // Order List And Subscription list purpose
        this.userIdMessageError = "User id must be a number";
        this.orderIdMessageError = "Order id must be a number";
        this.subscriptionIdMessageError = "Subscription id must be a number";
        this.userIdNullErrorMessage = "Please provide user id";
        this.someThingWentWrong = "Something went wrong please try again";

        this.messageSaved = "Message saved successfully."
        this.listMessageBuild = "Got all Message Builds."
        this.seriesAlreadyAvailable = "Series already available."
        this.shareLink = "Link  generated successfully."
        this.deleteVolume = "Volume  deleted successfully."
        this.listAdminLogs = "Admin Logs List."

        //Sm 14-02-22
        this.SystemConfigurationDataUpdated = "System configuration data updated successfully."
        this.systemConfigurationId = "system_configuration_id is required field."
        this.androidAppVersion = "andriod_app_version is required field."
        this.androidForceUpdate = "android_force_update is required field."
        this.rokuappversion = "roku_app_version is required field."
        this.rokuforceupdate = "roku_force_update is required field."
        this.iosAppVersion = "ios_app_version is required field."
        this.iosForceUpdate = "ios_force_update is required field."
        this.duplicateElement = "Element duplicated successfully."
        this.buildElementDetail = "Got series details and sections."
        this.elementSorted = "Message element sorted successfully."
        this.validVideoURL = "Video url is valid."
        this.seriesElement = "Series section saved successfully."
        this.duplicateSeries = "Series duplicated successfully."
        this.seriesSort = "Series sorted successfully."
        this.volumeCU = "Volume saved successfully."
        this.seriesCU = "Series saved successfully."

        /** Darshit 09-03-2022 */
        this.seriesIdRequired = 'series_id" is a required field';
        this.ministryTypeRequired = 'ministrytype" is a required field';
        this.ministrySubTypeRequired = 'ministry_sub_type" is a required field';
        this.weekNumberRequired = 'week_number" is a required field';
        this.EmailnotFound = "No data found for Email.";
        this.CommentsnotFound = 'No data found for Post.';
        this.publishedSlideshow = "slideshow has been published successfully";
        this.SlideShowDataNotFound = "No data found for slideShow";
        this.notFoundCircleUser = "You can't comment as you are not a member on Circle."
        this.importSlideshow = "Slideshow has been imported successfully";
        this.gameIdRequired = 'Please select game';

        this.circleCommunitySave = "Community Save Successfully!"
        this.circleUserSave = "User Save Successfully!"

        //so 
        this.invalidSiteId = "Please Provide Valid Site Id";
        this.rejectCancelSubscriptionSuccess = "Subscription Cancellation Request Rejected";
        this.approveCancelSubscriptionSuccess = "Subscription Cancelled Successfully";

        //Sm 4-4-22

        this.codeGenerated = "Code Generated."
        this.listAffiliate = "List all affiliates."
        this.affiliateCreate = "Affiliate created successfully."
        this.affiliateUpdate = "Affiliate updated successfully."
        this.affiliateId = "Affiliate id is required field."
        this.affiliateUser = "User already added affiliate."

        //Jayesh 06042022
        this.affiliatePayoutCreate = "Affiliate payout created successfully."
        this.affiliatePayoutUpdate = "Affiliate payout updated successfully."
        this.latestAffiliateRegistrations = "List of latest affiliate registrations.";
        this.mostValuableAffiliates = "List of most valuable affiliates.";
        this.recentAffiliateReferrals = "List of recent affiliate referrals.";
        this.allTotalAffiliateDataCounts = "Affiliate Data Total Counts.";
        this.highestConvertingURLs = "List of highest converting URLs.";
        this.visitAndReferralDataForGraph = "Visits and referrals data for graph.";

         //Sm 21-06-22
        this.fileName = "Please enter valid file name."
        this.siteId = "Please enter site id."
        this.password = " Please enter valid password."

        //Dl 07-07-2022
        this.chargeReceiptSuccess = "Charge Receipt Has Been Sent Successfully.";

        //so shipbob 
        this.confirmationEmailHasSendSuccess = "Shipbob confirmation email has been send."
        this.shipbobDataTransferSuccess = "Shipbob calendar card added successfully."

        //jg Grow con video 01-02-2024
        this.growConAddVideo = "Video added successfully.";
        this.growConEditVideo = "Video edited successfully.";
        this.growConGetVideo = "Video data get successfully.";
        this.growConDeleteVideo = "Video deleted successfully.";

        this.pinnedNote = "Note pinned successfully."
    }

    /*
    * @ayushi 25-11-21
    * @method : errorMessage
    * @params :
    * string Error controller message string  
    * data array include label and other required data
    * @return : object
    * @description : Concat error string and the label and  convert the text in required formate.
    */
    public errorMessage(message: string, data: any = []) {
        var placeholder = process.env.ecPlaceHolder == undefined || process.env.ecPlaceHolder == null ? "" : process.env.ecPlaceHolder;
        var regex = new RegExp(placeholder, 'g');
        message.match(regex);
        var count = (message.match(regex) || []).length;
        for (let i = 0; i < count; i++) {
            message = message.replace(placeholder, (data[i] == undefined || data[i] == null ? "" : data[i]));
        }
        return message.charAt(0).toUpperCase() + message.substring(1).toLowerCase().trim();
    }
}
