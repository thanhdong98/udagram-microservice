import { Router, Request, Response, NextFunction } from "express";

import { User } from "./model.index";
import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";
import { config } from "../../config/config";
import EmailValidator from "email-validator";

const authRouter: Router = Router();
const router: Router = Router();

const generatePassword = async (plainTextPassword: string): Promise<string> => {
	const saltRound = 10;
	const salt = await bcrypt.genSalt(saltRound);
	return await bcrypt.hash(plainTextPassword, salt);
};

const comparePasswords = async (plainTextPassword: string, hash: string): Promise<boolean> =>
	await bcrypt.compare(plainTextPassword, hash);

const generateJWT = (user: User): string => {
	//@TODO Use jwt to create a new JWT Payload containing
	return jwt.sign(user.toJSON(), config.jwt.secret);
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
	if (!req.headers?.authorization) {
		return res.status(401).send({ message: "No authorization headers." });
	}

	const token_bearer = req.headers.authorization.split(" ");
	console.log("token_bearer", req.headers.authorization);
	if (token_bearer.length != 2) {
		return res.status(401).send({ message: "Malformed token." });
	}

	const token = token_bearer[1];

	return jwt.verify(token, config.jwt.secret, (err, decoded) => {
		if (err) {
			return res.status(500).send({ auth: false, message: "Failed to authenticate." });
		}
		return next();
	});
};

authRouter.get("/verification", requireAuth, async (req: Request, res: Response) => {
	return res.status(200).send({ auth: true, message: "Authenticated." });
});

authRouter.post("/login", async (req: Request, res: Response) => {
	const email = req.body.email;
	const password = req.body.password;
	// check email is valid
	if (!email || !EmailValidator.validate(email)) {
		return res.status(400).send({ auth: false, message: "Email is required or malformed" });
	}

	// check email password valid
	if (!password) {
		return res.status(400).send({ auth: false, message: "Password is required" });
	}

	const user = await User.findByPk(email);
	// check that user exists
	if (!user) {
		return res.status(401).send({ auth: false, message: "Unauthorized" });
	}

	// check that the password matches
	const authValid = await comparePasswords(password, user.password_hash);

	if (!authValid) {
		return res.status(401).send({ auth: false, message: "Unauthorized" });
	}

	// Generate JWT
	const jwt = generateJWT(user);

	res.status(200).send({ auth: true, token: jwt, user: user.short() });
});

//register a new user
authRouter.post("/", async (req: Request, res: Response) => {
	const email = req.body.email;
	const plainTextPassword = req.body.password;
	// check email is valid
	if (!email || !EmailValidator.validate(email)) {
		return res.status(400).send({ auth: false, message: "Email is required or malformed" });
	}

	// check email password valid
	if (!plainTextPassword) {
		return res.status(400).send({ auth: false, message: "Password is required" });
	}

	// find the user
	const user = await User.findByPk(email);
	// check that user doesnt exists
	if (user) {
		return res.status(422).send({ auth: false, message: "User may already exist" });
	}

	const password_hash = await generatePassword(plainTextPassword);

	const newUser = await new User({
		email,
		password_hash
	});

	let savedUser;
	try {
		savedUser = await newUser.save();
	} catch (e) {
		throw e;
	}

	// Generate JWT
	const jwt = generateJWT(savedUser);

	res.status(201).send({ token: jwt, user: savedUser.short() });
});

router.use("/auth", authRouter);

router.get("/", async (req: Request, res: Response) => {
	res.send("auth");
});

router.get("/", async (req: Request, res: Response) => {});

router.get("/:id", async (req: Request, res: Response) => {
	let { id } = req.params;
	const item = await User.findByPk(id);
	res.send(item);
});

export const UserRouter: Router = router;
