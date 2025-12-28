// import { property } from "zod"
// import prisma from "../config/prisma.js"

// // ============ DASHBOARD STATS ============
// export const getDashboardStats = async (req, res) => {
//   try {
//     // Total Owners (roleid = 2)
//     const totalOwners = await prisma.User.count({
//       where: { roleid: 2 },
//     })

//     // Total Properties
//     const totalProperties = await prisma.property.count()

//     // Total Bookings
//     const totalBookings = await prisma.booking.count()

//     // Monthly Revenue (active subscriptions count * 10)
//     const activeSubscriptions = await prisma.ownerinfo.count({
//       where: { subscription_status: "active" },
//     })
//     const monthlyRevenue = activeSubscriptions * 10

//     // Revenue Overview Data (from owner_subscriptions)
//     const revenueData = await prisma.owner_subscriptions.groupBy({
//       by: ["current_period_start"],
//       _sum: {
//         amount: true,
//       },
//       orderBy: {
//         current_period_start: "asc",
//       },
//     })

//     // Map revenue data to chart format
//     const chartData = revenueData.map((item) => ({
//       date: item.current_period_start.toISOString().split("T")[0],
//       revenue: Number.parseInt(item._sum.amount || 0),
//     }))

//     // Quick Stats - Active Subscriptions percentage
//     const totalOwnerInfoRecords = await prisma.ownerinfo.count()
//     const activeSubscriptionPercentage =
//       totalOwnerInfoRecords > 0 ? Math.round((activeSubscriptions / totalOwnerInfoRecords) * 100) : 0

//     // Average Booking Rate
//     const propertiesCount = totalProperties || 1
//     const avgBookingRate = Math.round(totalBookings / propertiesCount)

//     // Customer Satisfaction (mock - based on booking status)
//     const completedBookings = await prisma.booking.count({
//       where: { booking_status: "CONFIRMED" },
//     })
//     const satisfactionScore = totalBookings > 0 ? (4.0 + (completedBookings / totalBookings) * 0.8).toFixed(1) : 4.8

//     res.status(200).json({
//       totalOwners,
//       totalProperties,
//       totalBookings,
//       totalRevenue: monthlyRevenue,
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

// // ============ OWNERS ENDPOINTS ============
// export const getAllOwners = async (req, res) => {
//   try {
//     const owners = await prisma.User.findMany({
//       where: { roleid: 2 }, // Only owners
//       include: {
//         ownerinfo: true,
//         owner_subscriptions: true,
//         property: true,
//         booking: true,
//         canadian_cities:true,
//         canadian_states:true,
//       },
//     })

//     // Transform data to match frontend expectations
//     const formattedOwners = owners.map((owner) => {
//       const activeSubscription = owner.owner_subscriptions.find((sub) => new Date(sub.current_period_end) > new Date())

//       return {
//         id: owner.userid,
//         fullName: `${owner.firstname} ${owner.lastname}`,
//         email: owner.email,
//         city: owner.canadian_cities?.canadian_city_name || owner.international_city || "N/A",
//         province: owner.canadian_states?.canadian_province_name || owner.international_province || "N/A",
//         totalProperties: owner.property.length,
//         subscriptionStatus: owner.ownerinfo?.subscription_status || "inactive",
//         status: owner.isemailverified ? "active" : "inactive",
//         phone: owner.phoneno,
//         address: owner.address,
//         profilePic: owner.profilepic,
//       }
//     })

//     res.status(200).json(formattedOwners)
//   } catch (error) {
//     console.error("Get owners error:", error)
//     res.status(500).json({
//       message: "Error fetching owners",
//       error: error.message,
//     })
//   }
// }

// export const getOwnerById = async (req, res) => {
//   try {
//     const { id } = req.params

//     const owner = await prisma.User.findUnique({
//       where: { userid: Number(id) },
//       include: {
//         ownerinfo: {
//           include: {
//             owner_subscriptions: true,
//           },
//         },
//         property: {
//           include: {
//             booking: true,
//             canadian_cities:true,
//             canadian_states:true,
//           },
//         },
//         booking: true,
//         canadian_cities: true,
//         canadian_states: true,
//       },
//     })

//     if (!owner || owner.roleid !== 2) {
//       return res.status(404).json({ message: "Owner not found" })
//     }

//     // Calculate total revenue from all bookings of owner's properties
//     let totalRevenue = 0
//     owner.property.forEach((property) => {
//       property.booking.forEach((booking) => {
//         totalRevenue += Number.parseInt(booking.total_amount || 0)
//       })
//     })

//     // Format properties with booking data
//     const formattedProperties = owner.property.map((property) => {
//       const propertyBookings = property.booking
//       let propertyRevenue = 0
//       propertyBookings.forEach((booking) => {
//         propertyRevenue += Number.parseInt(booking.total_amount || 0)
//       })

//       //  console.log('properties',property.canadian_cities.);

//       return {
//         id: property.propertyid,
//         title: property.propertytitle,
//         subtitle: property.propertysubtitle,
//         city: property.canadian_cities?.canadian_city_name || "N/A",
//         imageUrl: property.photo1_featured || "/placeholder.svg",
//         bookings: propertyBookings.length,
//         revenue: propertyRevenue,
//         status: property.AvailableStatus ? "active" : "inactive",
//         bookingDetails: propertyBookings.map((b) => ({
//           id: b.bookingid,
//           checkin: b.checkin_date,
//           checkout: b.checkout_date,
//           amount: Number.parseInt(b.total_amount),
//           status: b.booking_status,
//         })),
//         canadian_cities:true,
//         canadian_states:true
//       }
//     })




//     // Subscriptions data
//     const subscriptions = owner.ownerinfo?.owner_subscriptions || []

//     res.status(200).json({
//       id: owner.userid,
//       fullName: `${owner.firstname} ${owner.lastname}`,
//       email: owner.email,
//       phone: owner.phoneno,
//       address: owner.address,
//       city: owner.canadian_cities?.canadian_city_name || owner.international_city,
//       province: owner.canadian_states?.canadian_province_name || owner.international_province,
//       postalCode: owner.postalcode,
//       profilePic: owner.profilepic,
//       status: owner.isemailverified ? "active" : "inactive",
//       documents: {
//         idDocument: owner.ownerinfo?.iddocpic || null,
//         residentialDoc: owner.ownerinfo?.residentialdocpdf || null,
//       },
//       subscriptionStatus: owner.ownerinfo?.subscription_status || "inactive",
//       totalProperties: owner.property.length,
//       totalBookings: owner.booking.length,
//       totalRevenue,
//       properties: formattedProperties,
//       subscriptions: subscriptions.map((sub) => ({
//         id: sub.id,
//         amount: sub.amount,
//         currency: sub.currency,
//         startDate: sub.current_period_start,
//         endDate: sub.current_period_end,
//         createdAt: sub.created_at,
//       })),
//     })
//   } catch (error) {
//     console.error("Get owner by ID error:", error)
//     res.status(500).json({
//       message: "Error fetching owner details",
//       error: error.message,
//     })
//   }
// }

// // ============ PROPERTIES ENDPOINTS ============
// export const getAllProperties = async (req, res) => {
//   try {
//     const properties = await prisma.property.findMany({
//       include: {
//         User: true,
//         canadian_cities: true,
//         booking: true,
//       },
//     })

//     const formattedProperties = properties.map((property) => {
//       let revenue = 0
//       property.booking.forEach((booking) => {
//         revenue += Number.parseInt(booking.total_amount || 0)
//       })

//       return {
//         id: property.propertyid,
//         title: property.propertytitle,
//         imageUrl: property.photo1_featured || "/placeholder.svg",
//         city: property.canadian_cities?.canadian_city_name || "N/A",
//         ownerName: property.User ? `${property.User.firstname} ${property.User.lastname}` : "Unknown",
//         ownerId: property.userid,
//         revenue,
//         status: property.AvailableStatus ? "active" : "inactive",
//         bookingCount: property.booking.length,
//       }
//     })

//     res.status(200).json(formattedProperties)
//   } catch (error) {
//     console.error("Get properties error:", error)
//     res.status(500).json({
//       message: "Error fetching properties",
//       error: error.message,
//     })
//   }
// }

// export const getPropertyById = async (req, res) => {
//   try {
//     const { id } = req.params

//     const property = await prisma.property.findUnique({
//       where: { propertyid: Number(id) },
//       include: {
//         User: true,
//         canadian_cities: true,
//         canadian_states: true,
//         booking: {
//           include: {
//             User: true,
//           },
//         },
//         propertyroom: true,
//         propertyamenities: {
//           include: {
//             amenities: true,
//           },
//         },
//       },
//     })

//     console.log('properties',property);


//     if (!property) {
//       return res.status(404).json({ message: "Property not found" })
//     }

//     // Calculate total revenue
//     let totalRevenue = 0
//     property.booking.forEach((booking) => {
//       totalRevenue += Number.parseInt(booking.total_amount || 0)
//     })

//     res.status(200).json({
//       id: property.propertyid,
//       title: property.propertytitle,
//       subtitle: property.propertysubtitle,
//       address: property.address,
//       city: property.canadian_cities?.canadian_city_name,
//       province: property.canadian_states?.canadian_province_name,
//       imageUrl: property.photo1_featured,
//       images: [property.photo1_featured, property.photo2, property.photo3, property.photo4, property.photo5].filter(
//         Boolean,
//       ),
//       ownerName: property.User ? `${property.User.firstname} ${property.User.lastname}` : "Unknown",
//       ownerId: property.userid,
//       status: property.AvailableStatus ? "active" : "inactive",
//       checkIn: property.checkintime,
//       checkOut: property.checkouttime,
//       rules: property.houserules,
//       totalRevenue,
//       bookingCount: property.booking.length,
//       bookings: property.booking.map((booking) => ({
//         id: booking.bookingid,
//         guestName: booking.User ? `${booking.User.firstname} ${booking.User.lastname}` : "Guest",
//         checkin: booking.checkin_date,
//         checkout: booking.checkout_date,
//         totalGuests: booking.total_guests,
//         totalNights: booking.total_nights,
//         amount: Number.parseInt(booking.total_amount),
//         status: booking.booking_status,
//       })),
//       rooms: property.propertyroom.map((room) => ({
//         id: room.propertyroomid,
//         name: room.roomname,
//         price: room.price,
//         available: room.available,
//       })),
//       amenities: property.propertyamenities.map((pam) => ({
//         id: pam.propertyamenitiesid,
//         name: pam.amenities?.amenitiesname,
//         icon: pam.amenities?.icons,
//       })),
//     })
//   } catch (error) {
//     console.error("Get property by ID error:", error)
//     res.status(500).json({
//       message: "Error fetching property details",
//       error: error.message,
//     })
//   }
// }


import prisma from "../config/prisma.js"
import bcrypt from "bcrypt"

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

export const getDashboardStats = async (req, res) => {
  try {
    // Total Owners with trend
    const totalOwners = await prisma.User.count({
      where: { roleid: 2 },
    })
    const ownersTrend = await calculateMonthlyTrend(prisma.User, "createdat", { roleid: 2 })

    // Total Properties with trend
    const totalProperties = await prisma.property.count()
    const propertiesTrend = await calculateMonthlyTrend(prisma.property, "created_at")

    // Total Bookings with trend
    const totalBookings = await prisma.booking.count()
    const bookingsTrend = await calculateMonthlyTrend(prisma.booking, "created_at")

    // Monthly Revenue calculation
    const activeSubscriptions = await prisma.ownerinfo.count({
      where: { subscription_status: "active" },
    })
    const monthlyRevenue = activeSubscriptions * 10

    // Calculate revenue trend
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const currentMonthActiveCount = await prisma.ownerinfo.count({
      where: {
        subscription_status: "active",
        updated_at: { gte: currentMonthStart },
      },
    })
    const previousMonthActiveCount = await prisma.ownerinfo.count({
      where: {
        subscription_status: "active",
        updated_at: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    })

    const revenueTrend =
      previousMonthActiveCount > 0
        ? Math.round(((currentMonthActiveCount - previousMonthActiveCount) / previousMonthActiveCount) * 100)
        : 0

    // Revenue Overview Data
    const revenueData = await prisma.owner_subscriptions.groupBy({
      by: ["current_period_start"],
      _sum: {
        amount: true,
      },
      orderBy: {
        current_period_start: "asc",
      },
    })

    const chartData = revenueData.map((item) => ({
      date: item.current_period_start.toISOString().split("T")[0],
      revenue: Number.parseInt(item._sum.amount || 0),
    }))

    // Quick Stats
    const totalOwnerInfoRecords = await prisma.ownerinfo.count()
    const activeSubscriptionPercentage =
      totalOwnerInfoRecords > 0 ? Math.round((activeSubscriptions / totalOwnerInfoRecords) * 100) : 0

    const propertiesCount = totalProperties || 1
    const avgBookingRate = Math.round(totalBookings / propertiesCount)

    const completedBookings = await prisma.booking.count({
      where: { booking_status: "CONFIRMED" },
    })
    const satisfactionScore = totalBookings > 0 ? (4.0 + (completedBookings / totalBookings) * 0.8).toFixed(1) : 4.8

    res.status(200).json({
      totalOwners,
      ownersTrend: ownersTrend.trend,
      totalProperties,
      propertiesTrend: propertiesTrend.trend,
      totalBookings,
      bookingsTrend: bookingsTrend.trend,
      totalRevenue: monthlyRevenue,
      revenueTrend,
      chartData,
      quickStats: {
        activeSubscriptions: activeSubscriptionPercentage,
        bookingRate: avgBookingRate,
        satisfaction: satisfactionScore,
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

// ============ OWNERS ENDPOINTS ============
export const getAllOwners = async (req, res) => {
  try {
    const owners = await prisma.User.findMany({
      where: { roleid: 2 }, // Only owners
      include: {
        ownerinfo: true,
        owner_subscriptions: true,
        property: true,
        booking: true,
        canadian_cities: true,
        canadian_states: true
      },
    })

    // Transform data to match frontend expectations
    const formattedOwners = owners.map((owner) => {
      const activeSubscription = owner.owner_subscriptions.find((sub) => new Date(sub.current_period_end) > new Date())

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
            canadian_cities:true,
            canadian_cities:true
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

    // Subscriptions data
    const subscriptions = owner.ownerinfo?.owner_subscriptions || []

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
      totalBookings: owner.booking.length,
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

    const property = await prisma.property.findUnique({
      where: { propertyid: Number(id) },
      include: {
        User: true,
        canadian_cities: true,
        canadian_states: true,
        booking: {
          include: {
            User: true,
          },
        },
        propertyroom: true,
        propertyamenities: {
          include: {
            amenities: true,
          },
        },
      },
    })

    if (!property) {
      return res.status(404).json({ message: "Property not found" })
    }

    // Calculate total revenue
    let totalRevenue = 0
    property.booking.forEach((booking) => {
      totalRevenue += Number.parseInt(booking.total_amount || 0)
    })

    res.status(200).json({
      id: property.propertyid,
      title: property.propertytitle,
      subtitle: property.propertysubtitle,
      address: property.address,
      city: property.canadian_cities?.canadian_city_name,
      province: property.canadian_states?.canadian_province_name,
      imageUrl: property.photo1_featured,
      images: [property.photo1_featured, property.photo2, property.photo3, property.photo4, property.photo5].filter(
        Boolean,
      ),
      ownerName: property.User ? `${property.User.firstname} ${property.User.lastname}` : "Unknown",
      ownerId: property.userid,
      status: property.AvailableStatus ? "active" : "inactive",
      checkIn: property.checkintime,
      checkOut: property.checkouttime,
      rules: property.houserules,
      totalRevenue,
      bookingCount: property.booking.length,
      bookings: property.booking.map((booking) => ({
        id: booking.bookingid,
        guestName: booking.User ? `${booking.User.firstname} ${booking.User.lastname}` : "Guest",
        checkin: booking.checkin_date,
        checkout: booking.checkout_date,
        totalGuests: booking.total_guests,
        totalNights: booking.total_nights,
        amount: Number.parseInt(booking.total_amount),
        status: booking.booking_status,
      })),
      rooms: property.propertyroom.map((room) => ({
        id: room.propertyroomid,
        name: room.roomname,
        price: room.price,
        available: room.available,
      })),
      amenities: property.propertyamenities.map((pam) => ({
        id: pam.propertyamenitiesid,
        name: pam.amenities?.amenitiesname,
        icon: pam.amenities?.icons,
      })),
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
  
    const property = await prisma.property.findMany({
     
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
