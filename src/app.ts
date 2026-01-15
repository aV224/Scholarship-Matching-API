import express from "express"; // runtime import
import type { Application, Request, Response } from "express"; // types only
import router from "./routes.js";

import * as dotenv from "dotenv"

// Load environment variables
dotenv.config();

const app: Application = express(); // app is an Express Application object.. express() returns an actual Express application instance

// Adds middleware to parse incoming JSON bodies. When a client sends a rest with a JSON body, this middleware parses it and attaches it. 
app.use(express.json()); 

// Added at the end. Mount the API routes
app.use("/api", router);

// Defines a health-check endpoint at /health. It's used to verify that this API is live
// When someone send a GET request to /health, it sends back a 200 OK HTTP status code, and a JSON response that gives a timestamp. 
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

// Sets the port number for the server. It tries to use the PORT from environment variables(in prod). Defaults to 3000 if none provided
const PORT = process.env.PORT || 3000; 

// app.listen starts the server and begins listening for incoming requests at the specified port
app.listen(PORT, () => {
  console.log(`🚀 TuitionPlanner Server running on http://localhost:${PORT}`);
});