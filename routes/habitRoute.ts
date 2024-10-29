import { NextFunction, Request, Response, Router } from "express";
import { HabitController } from "../controllers/habitController";
const BearerToken = require("../middleware/bearerToken");
import validator, { ValidationSource } from '../helpers/validator';


// const multerStorage = multer.diskStorage({
//     destination: (req: any, file: any, cb: any) => {
//         cb(null, "public");
//     },
//     filename: (req: any, file: any, cb: any) => {
//         const ext = file.mimetype.split("/")[1];
//         cb(null, `${file.fieldname}-${Date.now()}.${ext}`);
//     },
// });

// const upload = multer({
//     storage: multerStorage,
//     fileFilter: (req: any, file: any, cb: any) => {
//         if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
//             cb(null, true);
//         } else {
//             cb(null, false);
//             return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
//         }
//     }
// });

export class habitRoute extends HabitController {
    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/createHabit", BearerToken, this.createHabit);
        router.post("/listHabit", BearerToken, this.listHabit);
        router.get("/getLinks", this.listAllIcons)
        router.put("/deleteHabit", BearerToken, this.deleteHabbit);
        router.put("/editHabit", BearerToken, this.editHabbit);
        router.get("/fetchHabitById/:habit_id?", BearerToken, this.fetchHabitById)
        // router.delete("/deleteHabit", BearerToken, validator(schema.deleteHabitPayload), this.deleteHabbit);
        // router.get("/getHabitDetails/:habit_id?", validator(schema.deleteHabitPayload, ValidationSource.PARAM), BearerToken, this.getHabitDetails);
        // router.put("/switchIndex", BearerToken, validator(schema.switchIndexPayload), this.switchIndex);
        // router.post("/uploadImageToS3", BearerToken, upload.single('profileimage'), this.uploadImageToS3);
    }
}