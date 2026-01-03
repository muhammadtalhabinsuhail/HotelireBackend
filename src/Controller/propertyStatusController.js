import prisma from "../config/prisma.js";

// Get all owner properties with status
const getOwnerProperties = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User is not authenticated" });
    }

    const userId = req.user.user.userid;

    // Get owner info
    const ownerInfo = await prisma.ownerinfo.findUnique({
      where: { userid: userId },
    });

    if (!ownerInfo) {
      return res.status(404).json({ error: "Owner information not found" });
    }

    // Get subscription status
    const subscription = await prisma.owner_subscription.findFirst({
      where: { ownerid: ownerInfo.ownerid },
      orderBy: { created_at: "desc" },
    });

    const subscriptionDisabled =
      subscription && subscription.last_payment_failed_date
        ? Math.floor((new Date() - new Date(subscription.last_payment_failed_date)) / (1000 * 60 * 60 * 24)) >= 20
        : false;

    // Get all properties for this owner
    const properties = await prisma.property.findMany({
      where: { userid: userId },
      select: {
        propertyid: true,
        propertytitle: true,
        AvailableStatus: true,
        created_at: true,
      },
    });

    res.json({
      success: true,
      subscriptionStatus: {
        hasSubscription: !!subscription,
        isActive: subscription?.status === "active",
        isDisabledDueToPayment: subscriptionDisabled,
      },
      properties: properties.map((prop) => ({
        propertyId: prop.propertyid,
        title: prop.propertytitle,
        isAvailable: prop.AvailableStatus,
        isBlockedBySubscription: subscriptionDisabled,
        createdAt: prop.created_at,
      })),
    });
  } catch (error) {
    console.error("Get owner properties error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Update property availability status
const updatePropertyStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User is not authenticated" });
    }

    const userId = req.user.user.userid;
    const { propertyId, isAvailable } = req.body;

    if (!propertyId || isAvailable === undefined) {
      return res.status(400).json({ error: "Property ID and availability status required" });
    }

    // Verify property belongs to user
    const property = await prisma.property.findUnique({
      where: { propertyid: propertyId },
    });

    if (!property || property.userid !== userId) {
      return res.status(403).json({ error: "Unauthorized - property not owned by user" });
    }

    // Check subscription status
    const ownerInfo = await prisma.ownerinfo.findUnique({
      where: { userid: userId },
    });

    const subscription = await prisma.owner_subscription.findFirst({
      where: { ownerid: ownerInfo.ownerid },
      orderBy: { created_at: "desc" },
    });

    const subscriptionDisabled =
      subscription && subscription.last_payment_failed_date
        ? Math.floor((new Date() - new Date(subscription.last_payment_failed_date)) / (1000 * 60 * 60 * 24)) >= 20
        : false;

    if (subscriptionDisabled && isAvailable) {
      return res.status(400).json({
        error: "Cannot enable property while subscription payment is overdue. Please resolve payment issue.",
      });
    }

    // Update property status
    const updatedProperty = await prisma.property.update({
      where: { propertyid: propertyId },
      data: { AvailableStatus: isAvailable },
    });

    res.json({
      success: true,
      message: `Property ${isAvailable ? "enabled" : "disabled"} successfully`,
      property: {
        propertyId: updatedProperty.propertyid,
        title: updatedProperty.propertytitle,
        isAvailable: updatedProperty.AvailableStatus,
      },
    });
  } catch (error) {
    console.error("Update property status error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export { getOwnerProperties, updatePropertyStatus };
