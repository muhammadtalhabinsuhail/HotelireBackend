import prisma from "../config/prisma.js"
import bcrypt from "bcrypt";

// REUSEABLE FUNCTIONS
const passwordHasher = async (password) => {
  return await bcrypt.hash(password, 10);
};

const passwordComparer = async (plainPassword, hashedPassword) => {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch; // true if match warna false 
};

const createUser = async (req, res) => {

  try {
    const data = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      passwordhash: req.body.passwordhash,
      address: req.body.address,
      city: req.body.city,
      province: req.body.province,
      postalcode: req.body.postalcode,
      phoneno: req.body.phoneno,
      isemailverified: req.body.isemailverified,
      ProfilePic: req.body.ProfilePic

    };


    const isUserExist = await prisma.User.findUnique(
      {
        where: { email: data.email }
      }
    );

    if (isUserExist) {
      return res.status(400).json({ message: "User with this email already exisits" });
    }

    const passwordhashed = await passwordHasher(data.passwordhash);

    data.passwordhash = passwordhashed;

    const user = await prisma.User.create({ data });

    return res.status(201).json({
      message: "User created successfully",
      data: user,
    });


  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}


const fetchAllUsers = async (req, res) => {
  try {
    const users = await prisma.User.findMany(
     {
      include:{
        countries:true,
        states: true,
        cities: true
      }
     }
    );
    return res.status(200).json({ message: "Users data fetched successfully", Data: users });

  } catch (ex) {
    console.error('Error fetching users:', ex);
    return res.status(500).json({ message: 'Error fetching users' });
  }
};


const fetchSpecificUser = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await prisma.User.findUnique({
      where: {
        userid: parseInt(id)
      }
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User data fetched successfully", Data: users });

  } catch (ex) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Error fetching users' });
  }
};

//verify Password Before Update
const authBeforeUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { passwordhash } = req.body;

    const user = await prisma.User.findUnique({
      where: { userid: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await passwordComparer(passwordhash, user.passwordhash);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    return res.status(200).json({ message: "Password verified successfully" });

  } catch (error) {
    console.error("Error user:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



const updateUserByUser = async (req, res) => {
  try {
    const { id } = req.params;

    const data = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      passwordhash: req.body.passwordhash,
      address: req.body.address,
      city: req.body.city,
      province: req.body.province,
      postalcode: req.body.postalcode,
      phoneno: req.body.phoneno,
      isemailverified: req.body.isemailverified,
      ProfilePic: req.body.ProfilePic
    };

    const isUserExist = await prisma.User.findUnique({
      where: { userid: parseInt(id) }
    });



    if (!isUserExist) {
      return res.status(404).json({ message: "User not found" });
    }


    let hashedPassword = isUserExist.passwordhash; //  keepung old password
    if (data.passwordhash) {
      hashedPassword = await passwordHasher(data.passwordhash);
      data.passwordhash = hashedPassword;
    }



    const updatedUser = await prisma.User.update({
      where: { userid: parseInt(id) }, // check column name! maybe UserId
      data: data,
    });



    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });


  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

export { createUser, fetchAllUsers, fetchSpecificUser, authBeforeUpdate, updateUserByUser }