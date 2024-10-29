import { Response } from 'express';
const fs = require('fs');
import moment from 'moment'
const { dbWriter } = require('../models/dbConfig');
import {
  AuthFailureResponse,
  AccessTokenErrorResponse,
  InternalErrorResponse,
  NotFoundResponse,
  BadRequestResponse,
  ForbiddenResponse,
} from './ApiResponse';

import path from "path";
require("dotenv").config({path: path.resolve(__dirname, "../../.env")});
 
import AWS from 'aws-sdk';
const s3 = new AWS.S3({
  accessKeyId: process.env.AWSACCESSKEYID,
  secretAccessKey: process.env.AWSSECRETACCESSKEY
});

enum ErrorType {
  BAD_TOKEN = 'BadTokenError',
  TOKEN_EXPIRED = 'TokenExpiredError',
  UNAUTHORIZED = 'AuthFailureError',
  ACCESS_TOKEN = 'AccessTokenError',
  INTERNAL = 'InternalError',
  NOT_FOUND = 'NotFoundError',
  NO_ENTRY = 'NoEntryError',
  NO_DATA = 'NoDataError',
  BAD_REQUEST = 'BadRequestError',
  FORBIDDEN = 'ForbiddenError',
}

export abstract class ApiError extends Error {
  constructor(public type: ErrorType, public message: string = 'error') {
    super(type);
  }

  public static handle(err: ApiError, res: Response): Response {
    let errData = "---------------------------------------------------------------------------------------------\n";
    errData += "Time : " + moment().format('MM-DD-YYYY HH:mm') + "\n";
    errData += "End Point : " + res.req.originalUrl + "\n";
    errData += "Method : " + res.req.method + "\n";
    errData += "Headers : " + JSON.stringify(res.req.headers) + "\n";
    errData += "Body : " + JSON.stringify(res.req.body) + "\n";
    errData += "Params : " + JSON.stringify(res.req.params) + "\n";
    errData += "Error : " + err.message + "\n";
    errData += "---------------------------------------------------------------------------------------------\n";
    // fs.appendFileSync('ErrorLogs/' + moment(new Date()).format('MM-DD-YYYY_HH:mm') + '.txt', '\n' + errData);
    const params = {
      Bucket: "sycu-production-logs", // pass your bucket name
      region: 'us-east-2',
      Key: "admin/"+moment(new Date()).format('DD-MM-YYYY_HH:mm:ss') + '.txt',
      ContentType: "text/plain",
      Body: errData,
      ACL: 'public-read'
    };
    s3.upload(params).promise();
    switch (err.type) {
      case ErrorType.BAD_TOKEN:
      case ErrorType.TOKEN_EXPIRED:
      case ErrorType.UNAUTHORIZED:
        return new AuthFailureResponse(err.message).send(res);
      case ErrorType.ACCESS_TOKEN:
        return new AccessTokenErrorResponse(err.message).send(res);
      case ErrorType.INTERNAL:
        return new InternalErrorResponse(err.message).send(res);
      case ErrorType.NOT_FOUND:
      case ErrorType.NO_ENTRY:
      case ErrorType.NO_DATA:
        return new NotFoundResponse(err.message).send(res);
      case ErrorType.BAD_REQUEST:
        return new BadRequestResponse(err.message).send(res);
      case ErrorType.FORBIDDEN:
        return new ForbiddenResponse(err.message).send(res);
      default: {
        let message = err.message;
        // Do not send failure message in production as it may send sensitive data
        if (process.env.NODE_ENV === 'production') message = 'Something wrong happened.';
        return new InternalErrorResponse(message).send(res);
      }
    }
  }
}

export class AuthFailureError extends ApiError {
  constructor(message = 'Invalid Credentials') {
    super(ErrorType.UNAUTHORIZED, message);
  }
}

export class InternalError extends ApiError {
  constructor(message = 'Internal error') {
    super(ErrorType.INTERNAL, message);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(ErrorType.BAD_REQUEST, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(ErrorType.NOT_FOUND, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Permission denied') {
    super(ErrorType.FORBIDDEN, message);
  }
}

export class NoEntryError extends ApiError {
  constructor(message = "Entry don't exists") {
    super(ErrorType.NO_ENTRY, message);
  }
}

export class BadTokenError extends ApiError {
  constructor(message = 'Token is not valid') {
    super(ErrorType.BAD_TOKEN, message);
  }
}

export class TokenExpiredError extends ApiError {
  constructor(message = 'Token is expired') {
    super(ErrorType.TOKEN_EXPIRED, message);
  }
}

export class NoDataError extends ApiError {
  constructor(message = 'No data available') {
    super(ErrorType.NO_DATA, message);
  }
}

export class AccessTokenError extends ApiError {
  constructor(message = 'Invalid access token') {
    super(ErrorType.ACCESS_TOKEN, message);
  }
}
