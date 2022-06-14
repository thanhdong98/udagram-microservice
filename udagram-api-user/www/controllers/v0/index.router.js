"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRouter = exports.requireAuth = void 0;
const express_1 = require("express");
const model_index_1 = require("./model.index");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config/config");
const email_validator_1 = __importDefault(require("email-validator"));
const authRouter = (0, express_1.Router)();
const router = (0, express_1.Router)();
const generatePassword = (plainTextPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const saltRound = 10;
    const salt = yield bcrypt_1.default.genSalt(saltRound);
    return yield bcrypt_1.default.hash(plainTextPassword, salt);
});
const comparePasswords = (plainTextPassword, hash) => __awaiter(void 0, void 0, void 0, function* () { return yield bcrypt_1.default.compare(plainTextPassword, hash); });
const generateJWT = (user) => {
    //@TODO Use jwt to create a new JWT Payload containing
    return jsonwebtoken_1.default.sign(user.toJSON(), config_1.config.jwt.secret);
};
const requireAuth = (req, res, next) => {
    var _a;
    if (!((_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization)) {
        return res.status(401).send({ message: "No authorization headers." });
    }
    const token_bearer = req.headers.authorization.split(" ");
    console.log("token_bearer", req.headers.authorization);
    if (token_bearer.length != 2) {
        return res.status(401).send({ message: "Malformed token." });
    }
    const token = token_bearer[1];
    return jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret, (err, decoded) => {
        if (err) {
            return res.status(500).send({ auth: false, message: "Failed to authenticate." });
        }
        return next();
    });
};
exports.requireAuth = requireAuth;
authRouter.get("/verification", exports.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.status(200).send({ auth: true, message: "Authenticated." });
}));
authRouter.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.body.email;
    const password = req.body.password;
    // check email is valid
    if (!email || !email_validator_1.default.validate(email)) {
        return res.status(400).send({ auth: false, message: "Email is required or malformed" });
    }
    // check email password valid
    if (!password) {
        return res.status(400).send({ auth: false, message: "Password is required" });
    }
    const user = yield model_index_1.User.findByPk(email);
    // check that user exists
    if (!user) {
        return res.status(401).send({ auth: false, message: "Unauthorized" });
    }
    // check that the password matches
    const authValid = yield comparePasswords(password, user.password_hash);
    if (!authValid) {
        return res.status(401).send({ auth: false, message: "Unauthorized" });
    }
    // Generate JWT
    const jwt = generateJWT(user);
    res.status(200).send({ auth: true, token: jwt, user: user.short() });
}));
//register a new user
authRouter.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.body.email;
    const plainTextPassword = req.body.password;
    // check email is valid
    if (!email || !email_validator_1.default.validate(email)) {
        return res.status(400).send({ auth: false, message: "Email is required or malformed" });
    }
    // check email password valid
    if (!plainTextPassword) {
        return res.status(400).send({ auth: false, message: "Password is required" });
    }
    // find the user
    const user = yield model_index_1.User.findByPk(email);
    // check that user doesnt exists
    if (user) {
        return res.status(422).send({ auth: false, message: "User may already exist" });
    }
    const password_hash = yield generatePassword(plainTextPassword);
    const newUser = yield new model_index_1.User({
        email,
        password_hash
    });
    let savedUser;
    try {
        savedUser = yield newUser.save();
    }
    catch (e) {
        throw e;
    }
    // Generate JWT
    const jwt = generateJWT(savedUser);
    res.status(201).send({ token: jwt, user: savedUser.short() });
}));
router.use("/auth", authRouter);
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("auth");
}));
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () { }));
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { id } = req.params;
    const item = yield model_index_1.User.findByPk(id);
    res.send(item);
}));
exports.UserRouter = router;
//# sourceMappingURL=index.router.js.map