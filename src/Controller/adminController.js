import prisma from "../config/prisma.js"
import bcrypt from "bcrypt"
import Stripe from "stripe";
import { attachAverageRatings } from "./propertyAverageRating.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const TARGET_PRICE_ID = process.env.STRIPE_OWNER_SUBSCRIPTION_PRICE_ID;

// ============ DASHBOARD STATS ============
const calculateMonthlyTrend = async (model, field, where = {}) => {
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const currentMonth = await model.count({
    where: {
      ...where,
      [field]: {
        gte: currentMonthStart,
      },
    },
  })

  const previousMonth = await model.count({
    where: {
      ...where,
      [field]: {
        gte: previousMonthStart,
        lte: previousMonthEnd,
      },
    },
  })

  const trend = previousMonth > 0 ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100) : 0
  return { current: currentMonth, trend }
}

// export const getDashboardStats = async (req, res) => {
//   try {
//     // Total Owners with trend
//     const totalOwners = await prisma.User.count({
//       where: { roleid: 2 },
//     })
//     const ownersTrend = await calculateMonthlyTrend(prisma.User, "createdat", { roleid: 2 })

//     // Total Properties with trend
//     const totalProperties = await prisma.property.count()
//     const propertiesTrend = await calculateMonthlyTrend(prisma.property, "created_at")

//     // Total Bookings with trend
//     const totalBookings = await prisma.booking.count()
//     const bookingsTrend = await calculateMonthlyTrend(prisma.booking, "created_at")

//     // Monthly Revenue calculation
//     const activeSubscriptions = await prisma.ownerinfo.count({
//       where: { subscription_status: "active" },
//     })
//     const monthlyRevenue = activeSubscriptions * 10

//     // Calculate revenue trend
//     const now = new Date()
//     const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
//     const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
//     const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

//     const currentMonthActiveCount = await prisma.ownerinfo.count({
//       where: {
//         subscription_status: "active",
//         updated_at: { gte: currentMonthStart },
//       },
//     })
//     const previousMonthActiveCount = await prisma.ownerinfo.count({
//       where: {
//         subscription_status: "active",
//         updated_at: {
//           gte: previousMonthStart,
//           lte: previousMonthEnd,
//         },
//       },
//     })

//     const revenueTrend =
//       previousMonthActiveCount > 0
//         ? Math.round(((currentMonthActiveCount - previousMonthActiveCount) / previousMonthActiveCount) * 100)
//         : 0

//     // Revenue Overview Data
//     const revenueData = await prisma.owner_subscriptions.groupBy({
//       by: ["current_period_start"],
//       _sum: {
//         amount: true,
//       },
//       orderBy: {
//         current_period_start: "asc",
//       },
//     })

//     const chartData = revenueData.map((item) => ({
//       date: item.current_period_start.toISOString().split("T")[0],
//       revenue: Number.parseInt(item._sum.amount || 0),
//     }))

//     // Quick Stats
//     const totalOwnerInfoRecords = await prisma.ownerinfo.count()
//     const activeSubscriptionPercentage =
//       totalOwnerInfoRecords > 0 ? Math.round((activeSubscriptions / totalOwnerInfoRecords) * 100) : 0

//     const propertiesCount = totalProperties || 1
//     const avgBookingRate = Math.round(totalBookings / propertiesCount)

//     const completedBookings = await prisma.booking.count({
//       where: { booking_status: "CONFIRMED" },
//     })
//     const satisfactionScore = totalBookings > 0 ? (4.0 + (completedBookings / totalBookings) * 0.8).toFixed(1) : 4.8

//     res.status(200).json({
//       totalOwners,
//       ownersTrend: ownersTrend.trend,
//       totalProperties,
//       propertiesTrend: propertiesTrend.trend,
//       totalBookings,
//       bookingsTrend: bookingsTrend.trend,
//       totalRevenue: monthlyRevenue,
//       revenueTrend,
//       chartData,
//       quickStats: {
//         activeSubscriptions: activeSubscriptionPercentage,
//         bookingRate: avgBookingRate,
//         satisfaction: satisfactionScore,
//       },
//     })
//   } catch (error) {
//     console.error("Dashboard stats error:", error)
//     res.status(500).json({
//       message: "Error fetching dashboard stats",
//       error: error.message,
//     })
//   }
// }

// ============ OWNERS ENDPOINTS ============


export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    // Helper dates for Current Month vs Previous Month calculations
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    // 1. Total Owners (Role ID 2)
    const totalOwners = await prisma.User.count({ where: { roleid: 2 } });
    const prevOwners = await prisma.User.count({ 
        where: { roleid: 2, createdat: { lt: currentMonthStart } } 
    });
    const ownersTrend = prevOwners === 0 ? 100 : Math.round(((totalOwners - prevOwners) / prevOwners) * 100);
    // 2. Total Properties (With Specific Conditions)
    const propertyCondition = {
        is_active: true,
        issuspended: false,
        AvailableStatus: true,
        is_active_byConnectId: true
    };
    const totalProperties = await prisma.property.count({ where: propertyCondition });
    const prevProperties = await prisma.property.count({ 
        where: { ...propertyCondition, created_at: { lt: currentMonthStart } } 
    });
    const propertiesTrend = prevProperties === 0 ? 100 : Math.round(((totalProperties - prevProperties) / prevProperties) * 100);
    // 3. Total Bookings
    const totalBookings = await prisma.booking.count();
    const prevBookings = await prisma.booking.count({
        where: { created_at: { lt: currentMonthStart } }
    });
    const bookingsTrend = prevBookings === 0 ? 100 : Math.round(((totalBookings - prevBookings) / prevBookings) * 100);
    // 4. Monthly Revenue (From Stripe - Showing Previous Month)
    // Fetch Paid Invoices from Stripe (approx last 3 months to be safe for trends)
    // We fetch data to calculate: Prev Month Revenue AND the Trend (Prev vs Month Before Prev)
    const threeMonthsAgo = Math.floor(new Date(now.getFullYear(), now.getMonth() - 2, 1).getTime() / 1000);
    
    const invoices = await stripe.invoices.list({
        status: 'paid',
        limit: 100, // Adjust based on volume
        created: { gte: threeMonthsAgo }, 
        expand: ['data.charge']
    });
    let revenueCurrentMonth = 0;
    let revenuePrevMonth = 0;
    let revenueMonthBeforePrev = 0;
    const currentMonthIdx = now.getMonth();
    const prevMonthIdx = new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth();
    const monthBeforePrevIdx = new Date(now.getFullYear(), now.getMonth() - 2, 1).getMonth();
    const graphMap = {};
    invoices.data.forEach(inv => {
        const d = new Date(inv.created * 1000);
        const amount = inv.amount_paid / 100; // Convert cents to dollars
        const monthIdx = d.getMonth();
        // Populate Revenue Variables
        if (monthIdx === currentMonthIdx) revenueCurrentMonth += amount;
        else if (monthIdx === prevMonthIdx) revenuePrevMonth += amount;
        else if (monthIdx === monthBeforePrevIdx) revenueMonthBeforePrev += amount;
        // Populate Graph Data (Daily)
        // We only want to show relevant recent data on the graph (e.g. last 30 days or current view)
        // Let's show all fetched data sorted by date
        const dateKey = d.toISOString().split('T')[0];
        graphMap[dateKey] = (graphMap[dateKey] || 0) + amount;
    });
    // Trend for Previous Month: Compare (Prev Month) vs (Month Before Prev)
    // Because we are displaying "Previous Month Revenue" as the main stats
    const revenueTrend = revenueMonthBeforePrev === 0 ? 100 : Math.round(((revenuePrevMonth - revenueMonthBeforePrev) / revenueMonthBeforePrev) * 100);
    
    // Sort Chart Data
    const chartData = Object.keys(graphMap).sort().map(date => ({
        date,
        revenue: graphMap[date]
    }));
    // 5. Quick Stats
    
    // Active Subscriptions: Check ownerinfo for stripe_customer_id
    const totalOwnerInfo = await prisma.ownerinfo.count();
    const subscribers = await prisma.ownerinfo.count({
        where: { stripe_customer_id: { not: null } }
    });
    const activeSubPct = totalOwnerInfo === 0 ? 0 : Math.round((subscribers / totalOwnerInfo) * 100);
    // Booking Rate: Avg bookings per property
    const bookingRate = totalProperties === 0 ? 0 : (totalBookings / totalProperties).toFixed(1);
    // Customer Satisfaction: Avg rating from review table
    const reviews = await prisma.review.aggregate({ _avg: { rating: true } });
    const satisfaction = reviews._avg.rating ? reviews._avg.rating.toFixed(1) : "0.0";
    res.status(200).json({
      totalOwners,
      ownersTrend,
      totalProperties,
      propertiesTrend,
      totalBookings,
      bookingsTrend,
      totalRevenue: revenuePrevMonth, // Showing Previous Month as requested
      revenueTrend,
      chartData,
      quickStats: {
        activeSubscriptions: activeSubPct,
        bookingRate: Number(bookingRate),
        satisfaction: satisfaction,
      },
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    res.status(500).json({
      message: "Error fetching dashboard stats",
      error: error.message,
    })
  }
}



export const getAllOwners = async (req, res) => {
  try {
    const owners = await prisma.User.findMany({
      where: { roleid: 2 }, // Only owners
      include: {
        ownerinfo: true,
        property: true,
        booking: true,
        canadian_cities: true,
        canadian_states: true
      },
    })

    // Transform data to match frontend expectations
    const formattedOwners = owners.map((owner) => {
      // const activeSubscription = owner.owner_subscriptions.find((sub) => new Date(sub.current_period_end) > new Date())

      return {
        id: owner.userid,
        fullName: `${owner.firstname} ${owner.lastname}`,
        email: owner.email,
        city: owner.canadian_cities?.canadian_city_name || owner.international_city || "N/A",
        province: owner.canadian_states?.canadian_province_name || owner.international_province || "N/A",
        totalProperties: owner.property.length,
        subscriptionStatus: owner.ownerinfo?.subscription_status || "inactive",
        status: owner.isemailverified ? "active" : "inactive",
        phone: owner.phoneno,
        address: owner.address,
        profilePic: owner.profilepic,
      }
    })

    res.status(200).json(formattedOwners)
  } catch (error) {
    console.error("Get owners error:", error)
    res.status(500).json({
      message: "Error fetching owners",
      error: error.message,
    })
  }
}

export const getOwnerById = async (req, res) => {
  try {
    const { id } = req.params

    const owner = await prisma.User.findUnique({
      where: { userid: Number(id) },
      include: {
        ownerinfo: {
          include: {
            owner_subscriptions: true,
          },
        },
        property: {
          include: {
            booking: true,
            canadian_cities: true,
            canadian_cities: true
          },
        },
        booking: true,
        canadian_cities: true,
        canadian_states: true,
      },
    })

    if (!owner || owner.roleid !== 2) {
      return res.status(404).json({ message: "Owner not found" })
    }

    // Calculate total revenue from all bookings of owner's properties
    let totalRevenue = 0
    owner.property.forEach((property) => {
      property.booking.forEach((booking) => {
        totalRevenue += Number.parseInt(booking.total_amount || 0)
      })
    })

    // Format properties with booking data
    const formattedProperties = owner.property.map((property) => {
      const propertyBookings = property.booking
      let propertyRevenue = 0
      propertyBookings.forEach((booking) => {
        propertyRevenue += Number.parseInt(booking.total_amount || 0)
      })

      return {
        id: property.propertyid,
        title: property.propertytitle,
        subtitle: property.propertysubtitle,
        city: property.canadian_cities?.canadian_city_name || "N/A",
        imageUrl: property.photo1_featured || "/placeholder.svg",
        bookings: propertyBookings.length,
        revenue: propertyRevenue,
        status: property.AvailableStatus ? "active" : "inactive",
        bookingDetails: propertyBookings.map((b) => ({
          id: b.bookingid,
          checkin: b.checkin_date,
          checkout: b.checkout_date,
          amount: Number.parseInt(b.total_amount),
          status: b.booking_status,
        })),
      }
    })

    // // Subscriptions data
    // const subscriptions = owner.ownerinfo?.is_active
const subscriptions = owner.ownerinfo?.owner_subscriptions || []


    // Correct total bookings for owner's properties
    let totalBookings = 0;

    owner.property.forEach((property) => {
      totalBookings += property.booking.length;
    });


    res.status(200).json({
      id: owner.userid,
      fullName: `${owner.firstname} ${owner.lastname}`,
      email: owner.email,
      phone: owner.phoneno,
      address: owner.address,
      city: owner.canadian_cities?.canadian_city_name || owner.international_city,
      province: owner.canadian_states?.canadian_province_name || owner.international_province,
      postalCode: owner.postalcode,
      profilePic: owner.profilepic,
      status: owner.isemailverified ? "active" : "inactive",
      documents: {
        idDocument: owner.ownerinfo?.iddocpic || null,
        residentialDoc: owner.ownerinfo?.residentialdocpdf || null,
      },
      subscriptionStatus: owner.ownerinfo?.subscription_status || "inactive",
      totalProperties: owner.property.length,
      totalBookings: totalBookings,
      totalRevenue,
      properties: formattedProperties,
      subscriptions: subscriptions.map((sub) => ({
        id: sub.id,
        amount: sub.amount,
        currency: sub.currency,
        startDate: sub.current_period_start,
        endDate: sub.current_period_end,
        createdAt: sub.created_at,
      })),
    })
  } catch (error) {
    console.error("Get owner by ID error:", error)
    res.status(500).json({
      message: "Error fetching owner details",
      error: error.message,
    })
  }
}

export const createOwner = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      passwordhash,
      phoneno,
      address,
      postalcode,
      canadian_provinceid,
      canadian_cityid,
    } = req.body

    // Validate required fields
    if (!firstname || !lastname || !email || !passwordhash || !phoneno) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Check if email exists
    const existingUser = await prisma.User.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordhash, 10)

    // Create user with roleid = 2 (owner)
    const user = await prisma.User.create({
      data: {
        firstname,
        lastname,
        email,
        passwordhash: hashedPassword,
        phoneno,
        address,
        postalcode,
        canadian_provinceid: canadian_provinceid ? Number(canadian_provinceid) : null,
        canadian_cityid: canadian_cityid ? Number(canadian_cityid) : null,
        roleid: 2, // Owner role
        isemailverified: true,
      },
    })

       
        
    // Create ownerinfo record
    await prisma.ownerinfo.create({
      data: {
        userid: user.userid,
        legalfullname: `${firstname} ${lastname}`,
        displayname: `${firstname} ${lastname}`,
        subscription_status: "inactive",
      },
    })

    const { passwordhash: _, ...userWithoutPassword } = user

    res.status(201).json({
      message: "Owner created successfully",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Create owner error:", error)
    res.status(500).json({
      message: "Error creating owner",
      error: error.message,
    })
  }
}

export const deleteOwner = async (req, res) => {
  try {
    const { id } = req.params

    // Verify owner exists
    const owner = await prisma.User.findUnique({
      where: { userid: Number(id) },
      include: { ownerinfo: true },
    })

    if (!owner || owner.roleid !== 2) {
      return res.status(404).json({ message: "Owner not found" })
    }

    // Delete ownerinfo first (has cascade to owner_subscriptions)
    if (owner.ownerinfo) {
      await prisma.ownerinfo.delete({
        where: { ownerid: owner.ownerinfo.ownerid },
      })
    }

    // Delete all properties and related data
    await prisma.property.deleteMany({
      where: { userid: Number(id) },
    })

    // Delete all bookings
    await prisma.booking.deleteMany({
      where: { userid: Number(id) },
    })

    // Delete owner subscriptions
    await prisma.owner_subscriptions.deleteMany({
      where: { userid: Number(id) },
    })

    // Delete user
    const deletedUser = await prisma.User.delete({
      where: { userid: Number(id) },
    })

    res.status(200).json({
      message: "Owner deleted successfully",
      user: deletedUser,
    })
  } catch (error) {
    console.error("Delete owner error:", error)
    res.status(500).json({
      message: "Error deleting owner",
      error: error.message,
    })
  }
}

// ============ PROPERTIES ENDPOINTS ============
export const getAllProperties = async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: {
        is_active: true,
        issuspended: false,
        AvailableStatus: true,
        is_active_byConnectId: true
      },
      include: {
        User: true,
        canadian_cities: true,
        booking: true,
      },
    })

    const formattedProperties = properties.map((property) => {
      let revenue = 0
      property.booking.forEach((booking) => {
        revenue += Number.parseInt(booking.total_amount || 0)
      })

      return {
        id: property.propertyid,
        title: property.propertytitle,
        imageUrl: property.photo1_featured || "/placeholder.svg",
        city: property.canadian_cities?.canadian_city_name || "N/A",
        ownerName: property.User ? `${property.User.firstname} ${property.User.lastname}` : "Unknown",
        ownerId: property.userid,
        revenue,
        status: property.AvailableStatus ? "active" : "inactive",
        bookingCount: property.booking.length,
      }
    })

    res.status(200).json(formattedProperties)





        const property = await prisma.property.findMany({
     where: {
        is_active: true,
        issuspended: false,
        AvailableStatus: true,
        is_active_byConnectId: true
      },
      include: {
        propertyclassification: true,
        canadian_cities: true,
        canadian_states: true,
        propertyamenities: {
          include: {
            amenities: true,
          },
        },
        propertysafetyfeatures: {
          include: {
            safetyfeatures: true,
          },
        },
        propertysharedspaces: {
          include: {
            sharedspaces: true,
          },
        },
        propertyroom: {
          include: {
            roomtype: true,
          },
        },
      },
    })

    if (property.length === 0) {
      return res.status(404).json({ message: "No Property was found!" })
    }

    const propertiesWithRatings = await attachAverageRatings(property)

    return res.status(200).json({
      message: "Property found successfully",
      property: propertiesWithRatings,
    })


  } catch (error) {
    console.error("Get properties error:", error)
    res.status(500).json({
      message: "Error fetching properties",
      error: error.message,
    })
  }
}

export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params

    // const property = await prisma.property.findUnique({
    //   where: { propertyid: Number(id) },
    //   include: {
    //     User: true,
    //     canadian_cities: true,
    //     canadian_states: true,
    //     booking: {
    //       include: {
    //         User: true,
    //       },
    //     },
    //     propertyroom: true,
    //     propertyamenities: {
    //       include: {
    //         amenities: true,
    //       },
    //     },
    //   },
    // })

    // console.log("property showcasing",property)

    // if (!property) {
    //   return res.status(404).json({ message: "Property not found" })
    // }

    // // Calculate total revenue
    // let totalRevenue = 0
    // property.booking.forEach((booking) => {
    //   totalRevenue += Number.parseInt(booking.total_amount || 0)
    // })

    // res.status(200).json({
    //   id: property.propertyid,
    //   title: property.propertytitle,
    //   subtitle: property.propertysubtitle,
    //   address: property.address,
    //   city: property.canadian_cities?.canadian_city_name,
    //   province: property.canadian_states?.canadian_province_name,
    //   imageUrl: property.photo1_featured,
    //   images: [property.photo1_featured, property.photo2, property.photo3, property.photo4, property.photo5].filter(
    //     Boolean,
    //   ),
    //   ownerName: property.User ? `${property.User.firstname} ${property.User.lastname}` : "Unknown",
    //   ownerId: property.userid,
    //   status: property.AvailableStatus ? "active" : "inactive",
    //   checkIn: property.checkintime,
    //   checkOut: property.checkouttime,
    //   rules: property.houserules,
    //   totalRevenue,
    //   bookingCount: property.booking.length,
    //   bookings: property.booking.map((booking) => ({
    //     id: booking.bookingid,
    //     guestName: booking.User ? `${booking.User.firstname} ${booking.User.lastname}` : "Guest",
    //     checkin: booking.checkin_date,
    //     checkout: booking.checkout_date,
    //     totalGuests: booking.total_guests,
    //     totalNights: booking.total_nights,
    //     amount: Number.parseInt(booking.total_amount),
    //     status: booking.booking_status,
    //   })),
    //   rooms: property.propertyroom.map((room) => ({
    //     id: room.propertyroomid,
    //     name: room.roomname,
    //     price: room.price,
    //     available: room.available,
    //   })),
    //   amenities: property.propertyamenities.map((pam) => ({
    //     id: pam.propertyamenitiesid,
    //     name: pam.amenities?.amenitiesname,
    //     icon: pam.amenities?.icons,
    //   })),
    // })

     const property = await prisma.property.findMany({
            where: { propertyid: Number(id), AvailableStatus: true, is_active: true, is_active_byConnectId: true, issuspended: false, issuspended: false },
            include: {
              propertyclassification: true,
              canadian_cities: true,
              canadian_states: true,
              propertyamenities: {
                include: {
                  amenities: true,
                },
              },
              propertysafetyfeatures: {
                include: {
                  safetyfeatures: true,
                },
              },
              propertysharedspaces: {
                include: {
                  sharedspaces: true,
                },
              },
              propertyroom: {
                include: {
                  roomtype: true,
                },
              },
            },
          })
    
          if (property.length === 0) {
            return res.status(404).json({ message: "No Property was found!" })
          }
    
          const propertiesWithRatings = await attachAverageRatings(property)
    
          return res.status(200).json({
            message: "Property found successfully",
            properties: propertiesWithRatings,
          })
  } catch (error) {
    console.error("Get property by ID error:", error)
    res.status(500).json({
      message: "Error fetching property details",
      error: error.message,
    })
  }
}



export const getAllPropertiesForAdmin = async (req, res) => {

  try {

    // const property = await prisma.property.findMany({
    //   where: {
    //     is_active: true,
    //     issuspended: false,
    //     AvailableStatus: true,
    //     is_active_byConnectId: true
    //   },
    //   include: {
    //     propertyclassification: true,
    //     canadian_cities: true,
    //     canadian_states: true,

    //     propertyamenities: {
    //       include: {
    //         amenities: true
    //       }
    //     },

    //     propertysafetyfeatures: {
    //       include: {
    //         safetyfeatures: true
    //       }
    //     },

    //     propertysharedspaces: {
    //       include: {
    //         sharedspaces: true
    //       }
    //     },

    //     propertyroom: {
    //       include: {
    //         roomtype: true
    //       }
    //     }
    //   }
    // });

    // if (property.length === 0) {
    //   return res.status(404).json({ message: "No Property was found!" });
    // }

    // return res.status(200).json({
    //   message: "Property found successfully",
    //   property,
    // });



            const property = await prisma.property.findMany({
     where: {
        is_active: true,
        issuspended: false,
        AvailableStatus: true,
        is_active_byConnectId: true
      },
      include: {
        propertyclassification: true,
        canadian_cities: true,
        canadian_states: true,
        propertyamenities: {
          include: {
            amenities: true,
          },
        },
        propertysafetyfeatures: {
          include: {
            safetyfeatures: true,
          },
        },
        propertysharedspaces: {
          include: {
            sharedspaces: true,
          },
        },
        propertyroom: {
          include: {
            roomtype: true,
          },
        },
      },
    })

    if (property.length === 0) {
      return res.status(404).json({ message: "No Property was found!" })
    }

    const propertiesWithRatings = await attachAverageRatings(property)

    return res.status(200).json({
      message: "Property found successfully",
      property: propertiesWithRatings,
    })
  } catch (ex) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: ex.message
    });
  }
};



export const getStripePayments = async (req, res) => {
  try {
    const { sort = 'desc' } = req.query; // Default to descending (newest first)

    // 1. Fetch recent invoices from Stripe
    // Stripe API doesn't support direct sorting by date in the list call, 
    // so we fetch and then sort manually if needed, or rely on Stripe's default (desc)
    const invoices = await stripe.invoices.list({
      limit: 100,
      expand: ["data.customer"],
    });

    // 2. Fetch all owner info to map Stripe Customer IDs to Owner Names
    const owners = await prisma.ownerinfo.findMany({
      include: {
        User: true,
      },
    });

    const ownerMap = {};
    owners.forEach((o) => {
      if (o.stripe_customer_id) {
        ownerMap[o.stripe_customer_id] = `${o.User.firstname} ${o.User.lastname}`;
      }
    });

    // 3. Format invoice data
    let formattedPayments = invoices.data.map((inv) => {
      return {
        id: inv.id,
        ownerName: ownerMap[inv.customer] || inv.customer_email || "Unknown Owner",
        month: new Date(inv.created * 1000).toLocaleString("default", { month: "long", year: "numeric" }),
        amount: inv.amount_paid / 100,
        method: inv.collection_method === "charge_automatically" ? "Credit Card" : "Manual",
        status: inv.status, // paid, open, draft, uncollectible, void
        date: new Date(inv.created * 1000).toISOString(),
        timestamp: inv.created,
        invoicePdf: inv.invoice_pdf, // URL to the downloadable PDF
      };
    });

    // 4. Handle Sorting (asc/desc)
    if (sort === 'asc') {
      formattedPayments.sort((a, b) => a.timestamp - b.timestamp);
    } else {
      formattedPayments.sort((a, b) => b.timestamp - a.timestamp);
    }

    // 5. Calculate Stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;

    const totalCollectedThisMonth = invoices.data
      .filter((inv) => inv.status === "paid" && inv.created >= startOfMonth)
      .reduce((sum, inv) => sum + inv.amount_paid, 0) / 100;

    const totalPending = invoices.data
      .filter((inv) => inv.status === "open")
      .reduce((sum, inv) => sum + inv.amount_due, 0) / 100;

    const failedCount = invoices.data.filter((inv) => inv.status === "uncollectible").length;

    res.status(200).json({
      success: true,
      payments: formattedPayments,
      stats: {
        totalCollected: totalCollectedThisMonth,
        pending: totalPending,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error("Stripe payments error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching Stripe payments",
      error: error.message,
    });
  }
};






export const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.User.findMany({
      where: { roleid: 3 },
      include: {
        booking: {
          include: {
            property: true
          }
        },
        canadian_cities: true,
        canadian_states: true
      },
    })

    const formattedCustomers = customers.map((customer) => ({
      id: customer.userid,
      fullName: `${customer.firstname} ${customer.lastname}`,
      email: customer.email,
      city: customer.canadian_cities?.canadian_city_name || customer.international_city || "N/A",
      province: customer.canadian_states?.canadian_province_name || customer.international_province || "N/A",
      totalBookings: customer.booking.length,
      status: customer.isemailverified ? "active" : "inactive",
      phone: customer.phoneno,
      address: customer.address,
    }))

    res.status(200).json(formattedCustomers)
  } catch (error) {
    res.status(500).json({ message: "Error fetching customers", error: error.message })
  }
}

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params
    const customer = await prisma.User.findUnique({
      where: { userid: Number(id) },
      include: {
        booking: {
          include: {
            property: {
              include: {
                User: true
              }
            }
          }
        },
        canadian_cities: true,
        canadian_states: true,
      },
    })

    if (!customer || customer.roleid !== 3) {
      return res.status(404).json({ message: "Customer not found" })
    }

    let totalSpent = 0
    customer.booking.forEach((b) => {
      totalSpent += Number.parseFloat(b.total_amount || 0)
    })

    const formattedBookings = customer.booking.map((b) => ({
      id: b.bookingid,
      checkIn: b.checkin_date,
      checkOut: b.checkout_date,
      amount: b.total_amount,
      status: b.booking_status,
      property: {
        title: b.property?.propertytitle,
        image: b.property?.photo1_featured,
        owner: b.property?.User ? `${b.property.User.firstname} ${b.property.User.lastname}` : "N/A"
      }
    }))

    res.status(200).json({
      id: customer.userid,
      fullName: `${customer.firstname} ${customer.lastname}`,
      email: customer.email,
      phone: customer.phoneno,
      address: customer.address,
      city: customer.canadian_cities?.canadian_city_name || customer.international_city || "N/A",
      province: customer.canadian_states?.canadian_province_name || customer.international_province || "N/A",
      postalCode: customer.postalcode,
      status: customer.isemailverified ? "active" : "inactive",
      totalBookings: customer.booking.length,
      totalSpent,
      bookings: formattedBookings
    })
  } catch (error) {
    res.status(500).json({ message: "Error fetching customer details", error: error.message })
  }
}

export const createCustomer = async (req, res) => {
  try {
    const { firstname, lastname, email, passwordhash, phoneno, address, postalcode, canadian_provinceid, canadian_cityid } = req.body
    
    const existing = await prisma.User.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ message: "Email already exists" })
    }

        const hashedPassword = await bcrypt.hash(passwordhash, 10)

    const customer = await prisma.User.create({
      data: {
        firstname,
        lastname,
        email,
        passwordhash: hashedPassword, // Assumes pre-hashed as per owner logic
        phoneno,
        address,
        postalcode,
        canadian_provinceid: Number(canadian_provinceid),
        canadian_cityid: Number(canadian_cityid),
        roleid: 3,
        isemailverified: true
      }
    })
    res.status(201).json(customer)
  } catch (error) {
    res.status(500).json({ message: "Error creating customer", error: error.message })
  }
}

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.User.delete({ where: { userid: Number(id) } })
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ message: "Error deleting customer", error: error.message })
  }
}
