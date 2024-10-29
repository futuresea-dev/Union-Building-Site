import * as jwt from 'jsonwebtoken';

export class JWT{
    private HASH_METHOD = 'RSA256'
    private optional_data = {
        expiresIn: 86400
    }

    createJwt(dataObject:object){
        return jwt.sign(dataObject, this.HASH_METHOD, this.optional_data);
    }

    decodeJwt(token:string){
        jwt.verify(token, this.HASH_METHOD, {clockTimestamp: new Date().getTime()}, function(err, decoded_payload) {
            if(err){
                return err;
            }else{
                return JSON.parse(JSON.stringify(decoded_payload));
            }
        });
    }

    validateToken(req: Request, res: Response){}
}