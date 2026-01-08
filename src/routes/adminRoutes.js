// import express from "express"
// import {
//   getDashboardStats,
//   getAllOwners,
//   getOwnerById,
//   getAllProperties,
//   getPropertyById,
// } from "../Controller/adminController.js"

// const router = express.Router()

// // Dashboard routes
// router.get("/dashboard", getDashboardStats)

// // Owners routes
// router.get("/owners", getAllOwners)
// router.get("/owners/:id", getOwnerById)

// // Properties routes
// router.get("/properties", getAllProperties)
// router.get("/properties/:id", getPropertyById)

// export default router



import express from "express"
import {
  getDashboardStats,
  getAllOwners,
  getOwnerById,
  getAllProperties,
  getPropertyById,
  createOwner,
  deleteOwner,
  getAllPropertiesForAdmin,
  getStripePayments,
  getAllCustomers,
  getCustomerById,
  createCustomer,
  deleteCustomer
} from "../Controller/adminController.js"

const router = express.Router()

// Dashboard routes
router.get("/dashboard", getDashboardStats)

// Owners routes
router.get("/owners", getAllOwners)
router.post("/owners", createOwner)
router.get("/owners/:id", getOwnerById)
router.delete("/owners/:id", deleteOwner)

// Properties routes
router.get("/properties", getAllProperties)
router.get("/properties/:id", getPropertyById)
router.get("/getAllPropertiesForAdmin", getAllPropertiesForAdmin)


// Customers routes
router.get("/customers", getAllCustomers)
router.post("/customers", createCustomer)
router.get("/customers/:id", getCustomerById)
router.delete("/customers/:id", deleteCustomer)


router.get("/payments", getStripePayments)


export default router
