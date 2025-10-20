import jwt  from "jsonwebtoken";

export const verifyAuthentication = (req, res, next) => {
      const token = req.cookies?.token;
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedToken;
    } catch (ex) {
        req.user = null;
    }

    return next();
}


export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.roleid)) {
      return res.status(403).json({ message: "Forbidden: Not allowed" });
    }
    next();
  };
};
