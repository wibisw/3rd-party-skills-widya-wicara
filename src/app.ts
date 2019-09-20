// import dotenv agar app bisa menggunakan variabel dari file .env
require('dotenv').config();

// import express.js
import express from "express";

// import utility applyMiddleware dan applyRoutes
// applyMiddleware() untuk apply middleware yang di definisikan di dalam folder middleware
// applyServices() menjalankan route yang di definisikan di dalam folder services
// applySkills() menjalankan route yang di definisikan di dalam folder skils
import { applyMiddleware, applyServices, applySkills } from "./utils";

// import middleware
import commonMiddleware from "./middleware/common";
import errorHandlers from "./middleware/error_handler";

// import routes
import services from "./services";
import skills from "./skill_apis"
import response_helper from "./middleware/response_helper";

// close seluruh app ketika unchaughtException terdeteksi
process.on("uncaughtException", e => {
    // TODO: ganti dengan logger
    console.log(e);
    process.exit(1);
});

// close seluruh app ketika unhandledRejection terdeteksi
process.on("unhandledRejection", e => {
    // TODO: ganti dengan logger
    console.log(e);
    process.exit(1);
});

const expressApp = express();                    // instansiasi express.js

applyMiddleware(commonMiddleware, expressApp);   // apply common middleware
applyMiddleware(response_helper, expressApp);    // apply response_helper middleware
applyServices(services, expressApp);             // apply services route
applySkills(skills, expressApp);                 // apply skills route
applyMiddleware(errorHandlers, expressApp);      // apply errorHandler middleware

export default expressApp;