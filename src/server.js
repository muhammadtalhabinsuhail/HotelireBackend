  // import app from "./app.js";
  // import dotenv from "dotenv";

  // dotenv.config()

  // const PORT = process.env.PORT || 3000;


  // app.get("/", (req, res) => {
  //   res.send(`
  //     <h2>Continue with Google (Arctic + PKCE)</h2>
  //     <a href="/auth/google"><button>Continue with Google</button></a>
  //   `);
  // });

  // // hata dena  '0.0.0.0', 

  // app.listen(PORT, '0.0.0.0', () => {
  //   console.log(`🚀 Server running on http://localhost:${PORT}`);
  // });





  import app from "./app.js";
import dotenv from "dotenv";
import { initializeReviewScheduler } from "./utils/reviewScheduler.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Health check / root route
// app.get("/", (req, res) => {
//   res.send(`
//     <h2>Continue with Google (Arctic + PKCE)</h2>
//     <a href="/auth/google"><button>Continue with Google</button></a>
//   `);
// });

// Bind to 0.0.0.0 for cloud deployment

initializeReviewScheduler();


app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
