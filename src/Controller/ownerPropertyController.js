import { uploadImageToCloudinary, uploadPdfToCloudinary } from "../middlewares/uploadHandler.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

import { sendWelcomeHostEmail } from "../utils/ownerWelcomeMail.js";



dotenv.config();



const fetchPropertyClassificationCategories = async (req, res) => {
  const { id } = req.params;

  try {
    let classifications;

    if (id) {
      const classId = Number(id);
      if (isNaN(classId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      classifications = await prisma.propertyclassification.findMany({
        where: { propertyclassificationid: classId },
      });
    } else {
      classifications = await prisma.propertyclassification.findMany();
    }

    if (!classifications || classifications.length === 0) {
      return res.status(404).json({ message: "No property classifications found" });
    }

    return res.status(200).json({
      message: "Property classifications fetched successfully",
      classifications,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};



const getRoomTypes = async (req, res) => {
  const { id } = req.params;

  try {
    let roomtypes;

    if (id) {
      const roomtypeId = Number(id);
      if (isNaN(roomtypeId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      roomtypes = await prisma.roomtype.findMany({
        where: { roomtypeid: roomtypeId },
      });
    } else {
      roomtypes = await prisma.roomtype.findMany();
    }

    if (!roomtypes || roomtypes.length === 0) {
      return res.status(404).json({ message: "No room types found" });
    }

    return res.status(200).json({
      message: "Room types fetched successfully",
      roomtypes,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


const getSafetyFeatures = async (req, res) => {
  const { id } = req.params;

  try {
    let safety;

    if (id) {
      const safetyId = Number(id);
      if (isNaN(safetyId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      safety = await prisma.safetyfeatures.findMany({
        where: { safetyfeaturesid: safetyId },
      });
    } else {
      safety = await prisma.safetyfeatures.findMany();
    }

    if (!safety || safety.length === 0) {
      return res.status(404).json({ message: "No safety features found" });
    }

    return res.status(200).json({
      message: "Safety features fetched successfully",
      safety,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getSharedSpaces = async (req, res) => {
  const { id } = req.params;

  try {
    let sharedspaces;

    if (id) {
      const sharedId = Number(id);
      if (isNaN(sharedId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      sharedspaces = await prisma.sharedspaces.findMany({
        where: { sharedspacesid: sharedId },
      });
    } else {
      sharedspaces = await prisma.sharedspaces.findMany();
    }

    if (!sharedspaces || sharedspaces.length === 0) {
      return res.status(404).json({ message: "No shared spaces found" });
    }

    return res.status(200).json({
      message: "Shared spaces fetched successfully",
      sharedspaces,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getAmenities = async (req, res) => {
  const { id } = req.params;

  try {
    let amenities;

    if (id) {
      const amenityId = Number(id);
      if (isNaN(amenityId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      amenities = await prisma.amenities.findMany({
        where: { amenitiesid: amenityId },
      });
    } else {
      amenities = await prisma.amenities.findMany();
    }

    if (!amenities || amenities.length === 0) {
      return res.status(404).json({ message: "No amenities found" });
    }

    return res.status(200).json({
      message: "Amenities fetched successfully",
      amenities,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};






const step1 = async (req, res) => {
  try {

    if (!req.user || req.user.user.roleid != 2) {
      return res.status(401).json({ message: "User is not Signed In or Unauthorized" });
    }


    const ans = await prisma.ownerinfo.findFirst({
      where: { userid: req.user.user.userid }
    });




    if (!ans) {
      return res.status(401).json({ message: "User must fill verification form first! Access Declined!" });
    }



    const data = {
      address: req.body.address,
      postalcode: req.body.postalcode,
      prevpdfurl: req.body.prevpdfurl,

      owner_residentialdocpdftype: {
        connect: { pdftypeid: Number(req.body.pdftypeid) },
      },

      User: {
        connect: { userid: req.user.user.userid },
      },

      canadian_states: {
        connect: { canadian_province_id: Number(req.body.canadian_provinceid) },
      },

      canadian_cities: {
        connect: { canadian_city_id: Number(req.body.canadian_cityid) },
      },

      propertylocation: {
        connect: { propertylocationid: Number(req.body.propertylocationid) },
      },
    };





    const rawPropertyId = req.body.propertyid;

    const propertyid =
      rawPropertyId === null || rawPropertyId === undefined || rawPropertyId === ""
        ? null
        : Number(rawPropertyId);


    console.log(data, "DATAAAAAA", propertyid);

    const locationId = Number(req.body.propertylocationid);


    var ispropertyExists;

    if (propertyid && propertyid != 0) {
      ispropertyExists = await prisma.property.findFirst({
        where: {
          propertyid: propertyid
        }
      });

    } else {
      ispropertyExists = await prisma.property.findFirst({
        where: {
          address: data.address,
          postalcode: data.postalcode,
          userid: req.user.user.userid
        }
      });
    }


    if (locationId === 2 && !data.prevpdfurl) {
      const pdfDoc = req.files?.residentialdocpdf?.[0] || null;

      if (!pdfDoc && !propertyid) {
        return res.status(400).json({ message: "Residential PDF is required" });
      }

      if (pdfDoc && pdfDoc.mimetype !== "application/pdf") {
        return res.status(400).json({ message: "Only PDF files are allowed" });
      }


      if (pdfDoc.size > 3 * 1024 * 1024) {
        return res.status(400).json({ message: "PDF size must be less than 3MB" });
      }

      const pdfUrl = await uploadPdfToCloudinary(pdfDoc.buffer, pdfDoc.originalname);
      data.residentialdocpdf = pdfUrl;
    }


    else if (locationId === 1) {


      data.residentialdocpdf = ans.residentialdocpdf;
      data.owner_residentialdocpdftype = {
        connect: { pdftypeid: ans.pdftypeid }
      };
    }

    if (propertyid && propertyid !== 0 && req.body.prevpdfurl) {
      data.residentialdocpdf = req.body.prevpdfurl;
    }


    const { prevpdfurl, ...datawithouturl } = data;




    console.log("Step 1 DATA:", datawithouturl);



    if (ispropertyExists && propertyid && propertyid != 0) {
      const answer = await prisma.property.update(
        {
          where: {
            propertyid: propertyid
          },
          data: { ...datawithouturl },
        }
      )
      return res.status(200).json({
        message: "This property already exists. Your changes have been saved.",
        data: answer,
      });
    }



    if (ispropertyExists) {   //according to address and postal code

      const answer = await prisma.property.update(
        {
          where: {
            propertyid: ispropertyExists.propertyid
          },
          data: { ...datawithouturl },
        }
      )

      return res.status(200).json({
        message: "This property already exists. Your changes have been saved.",
        data: answer,
      });


    }









    const rep = await prisma.property.create({ data: { ...datawithouturl } });








    return res.status(201).json({
      message: "Property Step 1 created successfully",
      data: rep,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });


  }
};




const step2 = async (req, res) => {
  try {

    if (!req.user || req.user.user.roleid != 2) {
      return res.status(401).json({ message: "User is not Signed In or Unauthorized" });
    }

    const ans = await prisma.ownerinfo.findFirst({
      where: { userid: req.user.user.userid }
    });

    if (!ans) {
      return res.status(401).json({ message: "User must fill verification form first! Access Declined!" });
    }

    const data = {
      address: req.body.address,
      postalcode: req.body.postalcode,

      propertytitle: req.body.propertytitle,
      propertysubtitle: req.body.propertysubtitle,
      propertymaplink: req.body.propertymaplink,


      propertyclassification: {
        connect: {
          propertyclassificationid: Number(req.body.propertyclassificationid),
        },
      },
    };

    const propertyid = Number(req.body.propertyid);

    if (!data.address || !data.postalcode) {
      return res.status(400).json({ message: "User must fill/refill location form!" });
    }
    if (!propertyid || propertyid == 0) {
      return res.status(400).json({ message: "User must fill/refill first two form!" });
    }

    const reply = await prisma.property.findFirst({
      where: {
        propertyid: propertyid,
        address: data.address,
        postalcode: data.postalcode,
        userid: req.user.user.userid
      }
    });

    if (!reply) {
      return res.status(400).json({ message: "User must fill step 1 first!" });
    }


    // const photo1_featured = req.files?.photo1_featured?.[0];
    // const photo2 = req.files?.photo2?.[0] || null;
    // const photo3 = req.files?.photo3?.[0] || null;
    // const photo4 = req.files?.photo4?.[0] || null;
    // const photo5 = req.files?.photo5?.[0] || null;

    const photo1_featured_file = req.files?.photo1_featured?.[0] || null;
    const photo2_file = req.files?.photo2?.[0] || null;
    const photo3_file = req.files?.photo3?.[0] || null;
    const photo4_file = req.files?.photo4?.[0] || null;
    const photo5_file = req.files?.photo5?.[0] || null;

    // URLs from frontend for unchanged photos
    const photo1_featured_url = req.body.photo1_featured || null;
    const photo2_url = req.body.photo2 || null;
    const photo3_url = req.body.photo3 || null;
    const photo4_url = req.body.photo4 || null;
    const photo5_url = req.body.photo5 || null;





    // if (!photo1_featured) {
    //   return res.status(400).json({ message: "Atleast, Featured photo is required" });
    // }


    // const uploadIfValid = async (file) => {
    //   if (!file) return null;

    //   if (file.size > 1 * 1024 * 1024) {
    //     return res.status(400).json({ message: "Image size must be less than 1MB" });

    //   }

    //   return await uploadImageToCloudinary(file.buffer, file.originalname);
    // };




    const uploadIfValid = async (file, existingUrl) => {
      if (!file) return existingUrl || null; // <-- fallback to existing URL

      if (file.size > 1 * 1024 * 1024) {
        return res.status(400).json({ message: "Image size must be less than 1MB" });
      }

      return await uploadImageToCloudinary(file.buffer, file.originalname);
    };


    // data.photo1_featured = await uploadIfValid(photo1_featured);
    // data.photo2 = await uploadIfValid(photo2);
    // data.photo3 = await uploadIfValid(photo3);
    // data.photo4 = await uploadIfValid(photo4);
    // data.photo5 = await uploadIfValid(photo5);


    data.photo1_featured = await uploadIfValid(photo1_featured_file, photo1_featured_url);

    if (!data.photo1_featured) {
      return res.status(400).json({ message: "At least, Featured photo is required" });
    }


    data.photo2 = await uploadIfValid(photo2_file, photo2_url);
    data.photo3 = await uploadIfValid(photo3_file, photo3_url);
    data.photo4 = await uploadIfValid(photo4_file, photo4_url);
    data.photo5 = await uploadIfValid(photo5_file, photo5_url);



    const updatedProperty = await prisma.property.update({
      where: { propertyid: reply.propertyid },
      data: data
    });

    console.log(data);


    return res.status(200).json({
      message: "Step 2 completed successfully!",
      data: updatedProperty
    });

  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: "Something went wrong.", error: err.message });

  }
};




const uploadIfValid = async (file) => {
  if (!file) return null;

  if (file.size > 1 * 1024 * 1024) {
    throw new Error("Image size must be less than 1MB");
  }

  const uploadedUrl = await uploadImageToCloudinary(file.buffer);
  return uploadedUrl;
};






const isRoomAvailableinProperty = async (req, res) => {
  try {
    const { PropertyId } = req.body;


    const room = await prisma.propertyroom.findFirst({
      where: { propertyid: Number(PropertyId) },
    });

    return res.json({
      isAvailable: !!room,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error checking room availability",
      error: error.message,
    });
  }
};



const getPropertyAmenities = async (req, res) => {
  try {
    const { propertyid } = req.body;

    if (!propertyid) {
      return res.status(400).json({ message: "PropertyId is required" });
    }

    const amenities = await prisma.propertyamenities.findMany({
      where: {
        propertyid: Number(propertyid),
      },
      select: {
        amenitiesid: true,
        features: true, // ✅ from propertyamenities
        amenities: {
          select: {
            amenitiesid: true,
            amenitiesname: true,
            icons: true,
          },
        },
      },
    });


    // 🔁 flatten response for frontend
    const response = amenities.map(a => ({
      amenitiesid: a.amenities?.amenitiesid,
      amenitiesname: a.amenities?.amenitiesname,
      icons: a.amenities?.icons,
      features: a.features ?? false,
    }));

    return res.status(200).json({
      success: true,
      data: response,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};


const getPropertySafetyFeatures = async (req, res) => {
  try {
    const { propertyid } = req.body;

    if (!propertyid) {
      return res.status(400).json({ message: "PropertyId is required" });
    }

    const safetyFeatures = await prisma.propertysafetyfeatures.findMany({
      where: {
        propertyid: Number(propertyid),
      },
      include: {
        safetyfeatures: {
          select: {
            safetyfeaturesid: true,
            safetyfeaturesname: true,
            icons: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: safetyFeatures.map(s => s.safetyfeatures),
    });

  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const getPropertySharedSpaces = async (req, res) => {
  try {
    const { propertyid } = req.body;

    if (!propertyid) {
      return res.status(400).json({ message: "PropertyId is required" });
    }

    const sharedSpaces = await prisma.propertysharedspaces.findMany({
      where: {
        propertyid: Number(propertyid),
      },
      include: {
        sharedspaces: {
          select: {
            sharedspacesid: true,
            sharedspacesname: true,
            icons: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: sharedSpaces.map(s => s.sharedspaces),
    });

  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const step3 = async (req, res) => {

  let rooms = req.body.rooms;

  if (!req.user || req.user.user.roleid != 2) {
    return res.status(401).json({ message: "User is not Signed In or Unauthorized" })
  }

  try {
    const ownerInfo = await prisma.ownerinfo.findFirst({
      where: { userid: req.user.user.userid }
    })

    if (!ownerInfo) {
      return res.status(401).json({ message: "User must fill verification form first!" })
    }

    const data = {
      propertyid: req.body.propertyid,
      availableAmenitiesIds: JSON.parse(req.body.availableAmenitiesIds || "[]"),
      featuredAmenitiesIds: JSON.parse(req.body.featuredAmenitiesIds || "[]"),
      safetyFeaturesIds: JSON.parse(req.body.safetyFeaturesIds || "[]"),
      sharedSpacesIds: JSON.parse(req.body.sharedSpacesIds || "[]"),
      checkInTime: req.body.checkInTime,
      checkOutTime: req.body.checkOutTime,
      rules: req.body.rules
    };

    // const rooms = [];

    for (const key of Object.keys(req.body)) {
      if (key.startsWith("rooms[")) {
        const index = Number(key.split("[")[1].split("]")[0]);
        const field = key.split("][")[1].replace("]", "");

        if (!rooms[index]) rooms[index] = {};
        rooms[index][field] = req.body[key];
      }
    }

    // Images
    req.files?.forEach(file => {
      const match = file.fieldname.match(/rooms\[(\d+)\]\[(.+)\]/);
      if (match) {
        const idx = Number(match[1]);
        const field = match[2];
        if (!rooms[idx]) rooms[idx] = {};
        rooms[idx][field] = file.buffer;
      }
    });



    // ✅ Detect if rooms were actually sent with meaningful data
    const hasRoomsPayload =
      Array.isArray(rooms) &&
      rooms.length > 0 &&
      rooms.some(room =>
        room?.name ||
        room?.roomtypeid ||
        room?.count ||
        room?.price ||
        room?.image1 ||
        room?.image2
      );






    const roomIndexes = new Set();

    const roomCount = roomIndexes.size;

    const propertyid = Number(req.body.propertyid)


    const userid = req.user.user.userid

    if (!propertyid) {
      return res.status(400).json({ message: "User must fill first 1 & 2 steps" })
    }

    const property = await prisma.property.findFirst({
      where: { propertyid, userid }
    })

    if (!property) {
      return res.status(400).json({ message: "Property not found or access denied" })
    }

    await prisma.property.update({
      where: { propertyid },
      data: {
        checkintime: data.checkInTime,
        checkouttime: data.checkOutTime,
        houserules: data.rules,
      }
    })

    console.log("all rooms object", rooms);

    let number = 1;
    if (hasRoomsPayload) {
      for (const room of rooms) {
        const pic1Url = await uploadIfValid(room.image1)
        const pic2Url = await uploadIfValid(room.image2)

        const existingRoom = await prisma.propertyroom.findFirst({
          where: { propertyid, roomname: room.name }
        })

        console.log(number, "room", rooms);
        number++;

        if (existingRoom) {
          await prisma.propertyroom.update({
            where: { propertyroomid: existingRoom.propertyroomid },
            data: {
              roomtypeid: Number(room.roomtypeid),
              roomcount: Number(room.count),
              price: Number(room.price),
              pic1: pic1Url || existingRoom.pic1,
              pic2: pic2Url || existingRoom.pic2
            }
          })
        }
        else {
          await prisma.propertyroom.create({
            data: {
              propertyid,
              roomtypeid: Number(room.roomtypeid),
              roomname: room.name,
              roomcount: Number(room.count),
              price: Number(room.price),
              pic1: pic1Url,
              pic2: pic2Url,
              available: true
            }
          })
        }
      }
    }
    await prisma.propertyamenities.deleteMany({ where: { propertyid } })

    for (const id of data.availableAmenitiesIds) {
      const isFeatured = data.featuredAmenitiesIds.includes(id);

      await prisma.propertyamenities.create({
        data: {
          propertyid,
          amenitiesid: id,
          features: isFeatured
        }
      });
    }

    await prisma.propertysafetyfeatures.deleteMany({ where: { propertyid } })
    for (const id of data.safetyFeaturesIds) {
      await prisma.propertysafetyfeatures.create({ data: { propertyid, safetyfeaturesid: id } })
    }

    await prisma.propertysharedspaces.deleteMany({ where: { propertyid } })
    for (const id of data.sharedSpacesIds) {
      await prisma.propertysharedspaces.create({ data: { propertyid, sharedspacesid: id } })
    }

    return res.status(200).json({
      message: "Property step 3 completed successfully",
      propertyid
    })

  } catch (error) {
    console.error("Step 3 Error:", error)
    return res.status(500).json({
      message: "Error processing property step 3",
      error: error.message
    })
  }
}


const getProperties = async (req, res) => {
  const { id } = req.params;

  try {


    if (id) {
      // NOTE KRLO KA IS MA SIRF FEATURED WALA AMENITIES RETURN HONGA BHAI JAAN
      const property = await prisma.property.findMany({
        where: { propertyid: Number(id) },
        include: {
          propertyclassification: true,
          canadian_cities: true,
          canadian_states: true,
          propertyamenities: {
            include: {
              amenities: true
            }
          },
          propertysafetyfeatures: {
            include: {
              safetyfeatures: true
            }
          },
          propertysharedspaces: {
            include: {
              sharedspaces: true
            }
          },
          propertyroom: {
            include: {
              roomtype: true
            }
          }
        }
      });

      if (property.length === 0) {
        return res.status(404).json({ message: "No Property was found!" });
      } else {
        return res.status(200).json({
          message: "Property found successfully",
          property,
        });
      }

    }


    const properties = await prisma.property.findMany({
      include: {
        propertyclassification: true,
        propertyamenities: {
          include: {
            amenities: true
          }
        },
        propertysafetyfeatures: {
          include: {
            safetyfeatures: true
          }
        },
        propertysharedspaces: {
          include: {
            sharedspaces: true
          }
        },
        propertyroom: {
          include: {
            roomtype: true
          }
        }
      }
    });

    if (properties.length === 0) {
      return res.status(404).json({ message: "No Property was found!" });
    }

    return res.status(200).json({
      message: "Properties found successfully",
      properties,
    });



  } catch (ex) {
    console.log(ex);
    return res.status(500).json({ message: "Internal Server Error", error: ex.message });
  }


}

const getSpecificOwnerProperties = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ message: "Owner ID is required" });
    }

    const property = await prisma.property.findMany({
      where: {
        userid: Number(id),
      },
      include: {
        propertyclassification: true,
        canadian_cities: true,
        canadian_states: true,

        propertyamenities: {
          include: {
            amenities: true
          }
        },

        propertysafetyfeatures: {
          include: {
            safetyfeatures: true
          }
        },

        propertysharedspaces: {
          include: {
            sharedspaces: true
          }
        },

        propertyroom: {
          include: {
            roomtype: true
          }
        }
      }
    });

    if (property.length === 0) {
      return res.status(404).json({ message: "No Property was found!" });
    }

    return res.status(200).json({
      message: "Property found successfully",
      property,
    });

  } catch (ex) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: ex.message
    });
  }
};


export { step1, step2, getPropertySafetyFeatures, getPropertyAmenities, getPropertySharedSpaces, isRoomAvailableinProperty, step3, fetchPropertyClassificationCategories, getRoomTypes, getSafetyFeatures, getSharedSpaces, getAmenities, getProperties, getSpecificOwnerProperties }; 
