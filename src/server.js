import app from "./app.js";
import dotenv from "dotenv";

dotenv.config()

const PORT = process.env.PORT || 3000;


app.get("/", (req, res) => {
  res.send(`
    <h2>Continue with Google (Arctic + PKCE)</h2>
    <a href="/auth/google"><button>Continue with Google</button></a>
  `);
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
