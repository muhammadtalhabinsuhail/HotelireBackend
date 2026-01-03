import prisma from "../config/prisma.js"

/**
 * Calculate average rating for a property
 * @param {number} propertyId - Property ID
 * @returns {Promise<number>} - Average rating (0 if no reviews)
 */
const calculatePropertyAverageRating = async (propertyId) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        property_id: propertyId,
        review_submitted: true,
      },
      select: {
        rating: true,
      },
    })

    if (reviews.length === 0) {
      return 0
    }

    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0)
    const avgRating = Number.parseFloat((totalRating / reviews.length).toFixed(1))

    return avgRating
  } catch (error) {
    console.error("Error calculating average rating:", error)
    return 0
  }
}

/**
 * Attach average rating to property objects
 * @param {Array} properties - Array of property objects
 * @returns {Promise<Array>} - Properties with avgRating field
 */
const attachAverageRatings = async (properties) => {
  try {
    const propertiesWithRatings = await Promise.all(
      properties.map(async (property) => {
        const avgRating = await calculatePropertyAverageRating(property.propertyid)
        return {
          ...property,
          avgRating,
        }
      }),
    )
    return propertiesWithRatings
  } catch (error) {
    console.error("Error attaching average ratings:", error)
    return properties
  }
}

export { calculatePropertyAverageRating, attachAverageRatings }
