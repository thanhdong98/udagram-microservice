import { config } from "dotenv";
config();
import express from "express";
import { sequelize } from "./sequelize";

import { UserRouter } from "./controllers/v0/index.router";

import bodyParser from "body-parser";

import { User } from "./controllers/v0/model.index";

(async () => {
	sequelize.addModels([User]);
	await sequelize.sync();
	console.log("hello");
	const app = express();
	const port = process.env.PORT || 8080; // default port to listen

	app.use(bodyParser.json());

	//CORS Should be restricted
	app.use(function (req, res, next) {
		res.header("Access-Control-Allow-Origin", "http://localhost:8100");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
		next();
	});

	app.use("/api/v0/users", UserRouter);

	// Root URI call
	app.get("/", async (req, res) => {
		res.send("/api/v0/");
	});

	// Start the Server
	app.listen(port, () => {
		console.log(`server running http://localhost:${port}`);
		console.log(`press CTRL+C to stop server`);
	});
})();
