import { user, user } from "../model/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const registerUser = async (req,res) => {
  const {name,email,mobileNumber,password} = req.body;
  try {
    const exisitngUser = await user.findOne({$or: [{email}, {mobileNumber}]});
    //checking if user exists
    if(exisitngUser) {
      return res.status(400).json({message : "User alreadye exists"});
    }

    //hasing the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt);

    //creating the user
    const newUser = await user.create({name,email,mobileNumber,password : hashedPassword});

    return res.status(201).json({message : "User created Sucessfully",user : newUser});
  }
  catch(error) {
    console.log(error);
    return registerUser.status(500).json({message : "Internal Server error"});
  }
};

const loginUser = async (req,res) => {
  const {email,password} = req.body;
  try {
    const user = await user.findOne({email});

    //verifying if user exists
    if(!user) {
      return res.status(400).json({message : "User does not exists"});
    }

    //verifying the password
    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch) return res.status(400).json({message : "Invalid Credentials"});


    //verify if user is banned
    if(user.isBanned) {
      return res.status(403).json({message : "User is banned"});
    }

    //creating the jwt token
    const token = jwt.sign({id : user._id,name : user.name},process.env.JWT_SECRET(),{expiresIn : "1d"});
    
    //setting the cookie
    res.cookie("token",token,{
      httpOnly : true,
      secure : process.env.NODE_ENV === "production",
      maxAge : 24*60*60*1000
    })

      //returning the response
    return res.status(200).json({message : "user registered successfully",user : {name : user.name,email : user.email,mobileNumber : user.mobileNumber},token});
  } catch (error) {
    console.log(error);
    return res.status(500).json({message : "Internal Server Error"});
  }
};

const deleteUser = async (req,res) => {
  const {id} = req.params;
  try {
    //find user and delete
    const deleteUser = await user.findByIdAndDelete(id);
    return res.status(200).json({message : "User deleted Successfully",user : deleteUser});
  } catch (error) {
    console.log(error);
    return res.status(500).json({message : "Internal Server Error"});
  }
}

const updateUser = async (req,res) => {
  const {id} = req.params;
  const {name,email,mobileNumber,password} = req.body;
  try {
    //validating if email exists
     if (email) {
      const existingUser = await user.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use by another user" });
      }
    }
    //validating if mobileNumber exists
     if (mobileNumber) {
      const existingUser = await user.findOne({ mobileNumber, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: "mobileNumber already in use by another user" });
      }
    }
    
    // Optionally hash password if it's being updated
    let updateData = { name, email, mobileNumber };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    //finding the user and updating
    const updateUser =  await user.findByIdAndUpdate(id,updateData);
    if(!updateUser) {
      return res.status(404).json({message : "User not found"});
    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({message : "Internal Server Error"});
    
  }
}

export { registerUser, loginUser, deleteUser, updateUser };