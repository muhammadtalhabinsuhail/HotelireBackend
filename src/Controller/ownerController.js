import { uploadImageToCloudinary, uploadPdfToCloudinary } from "../middlewares/uploadHandler.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { ca } from "react-day-picker/locale";
import { normalizeCanadianPhone } from "../utils/ReusableFunction/normalizeCanadianPhone.js";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";



const createOwnerInfo = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "User is not Signed In" });
    }

    // console.log("USERID = ", req.user.user.userid);

    const data = {
      legalfullname: req.body.legalfullname,
      displayname: req.body.displayname,
      iddocpic: null,
      residentialdocpdf: null,

      owner_iddocpictype: {
        connect: {
          pictypeid: parseInt(req.body.idType),
        }
      },

      owner_residentialdocpdftype: {
        connect: {
          pdftypeid: parseInt(req.body.proofType),
        }
      },

      // selected type for doc img of owner ki id hai
      // selected type for doc pdf of owner ki id hai
      User: {
        connect: { userid: req.user.user.userid }   // Connect existing user by ID
      }
    };

    const perfect_phone = normalizeCanadianPhone(req.body.phone);

    const data2 = {
      email: req.body.email,
      address: req.body.address,
      postalcode: req.body.postalCode,
      phoneno: perfect_phone,

      canadian_states: {
        connect: { canadian_province_id: parseInt(req.body.canadian_provinceid) }
      },
      canadian_cities: {
        connect: { canadian_city_id: parseInt(req.body.canadian_cityid) }
      },

      role: {
        connect: { roleid: 2 }
      }
    };



    console.log(data)
    console.log(data2)


    if (!data.legalfullname) {
      return res.status(400).json({ message: "Legal Full Name is required." });
    }

    const idDoc = req.files?.iddocpic?.[0];
    const pdfDoc = req.files?.residentialdocpdf?.[0];

    if (!idDoc || !pdfDoc) {
      return res
        .status(400)
        .json({ message: "Both ID document and residential PDF are required" });
    }

    // Validate sizes
    if (idDoc && idDoc.size > 1 * 1024 * 1024)
      return res.status(400).json({ message: "Image size must be less than 1MB" });

    if (pdfDoc && pdfDoc.size > 3 * 1024 * 1024)
      return res.status(400).json({ message: "PDF size must be less than 3MB" });

    // Upload files to different Cloudinary accounts
    const imageUrl = await uploadImageToCloudinary(
      idDoc.buffer,
      idDoc.originalname
    );
    const pdfUrl = await uploadPdfToCloudinary(
      pdfDoc.buffer,
      pdfDoc.originalname
    );

    data.iddocpic = imageUrl;
    data.residentialdocpdf = pdfUrl;

    console.log(data)
    console.log(data2)

    const ExistingUser = await prisma.ownerinfo.findFirst({
      where: { userid: req.user.user.userid },
    });
    console.log('ExistingUser', ExistingUser)

    if (ExistingUser) {
      const updatedUserInfo = await prisma.ownerinfo.update({
        where: { userid: req.user.user.userid },
        data: data,
      });
    } else {
      const newUserInfo = await prisma.ownerinfo.create({
        data: data,
      });
    }

    const SignUpUser = prisma.User.findUnique({
      where: { userid: req.user.user.userid },
    });

    if (!SignUpUser) {
      res.status(500).json({
        message: "Error creating OwnerInfo! User must sign in again.",
        error: error.message,
      });
    }

    const SignUpUserUpdate = await prisma.User.update({
      where: { userid: req.user.user.userid },
      data: data2,
    });




    const findpropertywhereilive = await prisma.property.findFirst({
      where: {
        propertylocationid: 1,
        address: req.user.user.address,
        postalcode: req.user.user.postalcode,
        userid: req.user.user.userid,
        canadian_city_id: req.user.user.canadian_cityid,
        canadian_province_id: req.user.user.canadian_provinceid
      }
    });

    if (findpropertywhereilive) {
      const updatepropertywhereilive = await prisma.property.update({
        where: { propertyid: findpropertywhereilive.propertyid },
        data: {
          canadian_city_id: data2.canadian_cities.connect.canadian_city_id,
          canadian_province_id: data2.canadian_states.connect.canadian_province_id,
          address: data2.address,
          postalcode: data2.postalcode
        }
      });


    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      domain: isProd ? ".hotelire.ca" : undefined,
      path: "/",
    });


    const isUserExist = await prisma.User.findFirst(
      {
        where: { email: data2.email }
      }
    );

    console.log('isUserExist', isUserExist);


    const { passwordhash, ...userWithoutPassword } = isUserExist;

    console.log('userWithoutPassword', userWithoutPassword);

    const token = await jwt.sign({ user: userWithoutPassword }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });


    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      domain: isProd ? ".hotelire.ca" : undefined,
      path: "/",
      maxAge: 1000 * 60 * 60 * 24
    });


    res.status(201).json({
      message: "OwnerInfo successfully saved.",
    });

  } catch (error) {
    console.error(error);
    console.log("Error creating OwnerInfo:", error);
    res.status(500).json({
      message: "Error creating OwnerInfo",
      error: error.message,
    });
  }
};













const fetchOwnerIdDocPic_Categories = async (req, res) => {
  try {
    var OwnerIdDocPic_Categories = await prisma.owner_iddocpictype.findMany();
    if (OwnerIdDocPic_Categories == "") {
      return res.status(404).json({
        message: " Owner ID Document Picture Categories not found"
      });
    }
    res.status(200).json({
      message: " Owner ID Document Picture Categories fetched successfully",
      data: OwnerIdDocPic_Categories
    });
  } catch (ex) {

    res.json({
      message: "Error in fetching Owner ID Document Picture Categories",
      error: ex.message
    });
  }
}


const fetchOwnerResidentialDocPdf_Categories = async (req, res) => {
  try {
    var OwnerResidentialDocPdf_Categories = await prisma.owner_residentialdocpdftype.findMany();
    if (OwnerResidentialDocPdf_Categories == "") {
      return res.status(404).json({
        message: " Owner Residential Document Pdf Categories not found"
      });
    }
    res.status(200).json({
      message: " Owner  Residential Document Pdf  Categories fetched successfully",
      data: OwnerResidentialDocPdf_Categories
    });
  } catch (ex) {

    res.json({
      message: "Error in fetching Owner Residential Document Pdf  Categories",
      error: ex.message
    });
  }
}














// Get Revenue Statistics and Charts Data
const getOwnerRevenueStats = async (req, res) => {
  try {
    const { ownerId } = req.params;
    if (!ownerId) return res.status(400).json({ error: "Owner ID is required" });
    // Fetch all paid payments for this owner's properties
    const payments = await prisma.payment.findMany({
      where: {
        booking: {
          property: {
            userid: Number(ownerId)
          }
        },
        payment_status: "PAID"
      },
      include: {
        booking: {
          include: {
            property: true
          }
        }
      },
      orderBy: {
        paid_at: 'asc' // Sorted for chart generation
      }
    });
    // 1. Calculate Totals
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // 2. Calculate Monthly Revenue (Current Month)
    const now = new Date();
    // const currentMonthRevenue = payments.reduce((sum, p) => {
    //   const pDate = new Date(p.paid_at || p.created_at);
    //   if (pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear()) {
    //     return sum + Number(p.amount);
    //   }
    //   return sum;
    // }, 0);
    // 3. Pending Payouts (Bookings confirmed but not yet paid/completed or held in escrow)
    // This logic depends on your payout flow. Assuming 'PENDING' bookings might have potential revenue:
    const pendingBookings = await prisma.booking.findMany({
      where: {
        property: { userid: Number(ownerId) },
        booking_status: "PENDING"
      }
    });
    const pendingPayouts = pendingBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
    // 4. Generate Chart Data (Revenue over time)
    const chartMap = {};
    payments.forEach(p => {
      const date = new Date(p.paid_at || p.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      chartMap[key] = (chartMap[key] || 0) + Number(p.amount);
    });

    const chartData = Object.entries(chartMap).map(([date, revenue]) => ({
      name: new Date(date + "-01").toLocaleString('default', { month: 'short' }), // "Jan"
      fullDate: date,
      revenue
    })).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
    // 5. Generate Property Breakdown
    const propertyMap = {};
    payments.forEach(p => {
      const propName = p.booking.property.propertytitle;
      propertyMap[propName] = (propertyMap[propName] || 0) + Number(p.amount);
    });
    const propertyRevenue = Object.entries(propertyMap).map(([name, value]) => ({
      name,
      value
    }));

    const currentMonthRevenue = payments.reduce((sum, p) => {
      const pDate = new Date(p.paid_at || p.created_at);
      if (pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear()) {
        return sum + Number(p.amount);
      }
      return sum;
    }, 0);


    res.json({
      success: true,
      data: {
        stats: {
          totalRevenue,
          monthlyRevenue: currentMonthRevenue,
          pendingPayouts,
          growth: 12.5 // You would calculate real growth by comparing vs last month
        },
        chartData,
        propertyRevenue
      }
    });
  } catch (error) {
    console.error("[v0] Error fetching revenue stats:", error);
    res.status(500).json({ error: "Failed to fetch revenue statistics" });
  }
};
// Get Recent Transactions (for the Table)
const getOwnerTransactions = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const transactions = await prisma.payment.findMany({
      where: {
        booking: {
          property: {
            userid: Number(ownerId)
          }
        },
        payment_status: "PAID"
      },
      include: {
        booking: {
          include: {
            property: { select: { propertytitle: true } },
            User: { select: { firstname: true, lastname: true } }
          }
        }
      },
      orderBy: {
        paid_at: 'desc'
      },
      take: 50 // Limit to last 50 transactions
    });
    const formattedTxs = transactions.map(tx => ({
      id: `TX-${tx.paymentid}`,
      date: tx.paid_at || tx.created_at,
      bookingId: `BK${tx.bookingid}`,
      property: tx.booking.property.propertytitle,
      guest: `${tx.booking.User.firstname} ${tx.booking.User.lastname}`,
      amount: Number(tx.amount),
      status: "Completed", // or map from tx.payment_status
      type: "Payment"
    }));
    res.json({
      success: true,
      data: formattedTxs
    });
  } catch (error) {
    console.error("[v0] Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

export { createOwnerInfo, getOwnerRevenueStats, getOwnerTransactions, fetchOwnerIdDocPic_Categories, fetchOwnerResidentialDocPdf_Categories }; 
