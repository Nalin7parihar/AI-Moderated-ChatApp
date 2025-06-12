import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name : {
    type : String,
    required : true
  },
  mobileNumber : {
    type : String,
    required : true,
    unique: true
  },
  email : {
    type : String,
    required : true,
    unique: true
  },
  password : {
    type : String,
    required : true
  },
  violationCount : {
    type : Number,
    default : 0
  },
  isBanned : {
    type : Boolean,
    default : false
  },
  lastViolationDate : {
    type : Date,
    default : null
  }
});

export const user = mongoose.model("users",userSchema);