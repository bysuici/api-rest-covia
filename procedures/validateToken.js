import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config();

export const validateToken = (token) => {
    let decoded = null;

    try {
        decoded = jwt.verify(token, process.env.SECRET_KEY)
    } catch (err) {
        console.log(err)
    }

    return decoded == null ? false : true 
}