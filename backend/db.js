import mongoose from 'mongoose'

await mongoose.connect();

const UserSchema = mongoose.Schema({
    email: String,
    password: String,
    publicKey: String,
    privateKey: String
}) 

const userModel = mongoose.model("users", UserSchema);

module.exports = {
    userModel
}