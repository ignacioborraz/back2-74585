import { Router } from "express";
import { usersManager } from "../../data/manager.mongo.js";

const authRouter = Router();

const registerCb = async (req, res, next) => {
  try {
    const { method, originalUrl: url } = req;
    const message = "Registered";
    /* validar algunos datos obligatorios */
    const { email, password, city } = req.body;
    if (!email || !password || !city) {
      const error = new Error("Invalid data");
      error.statusCode = 400;
      throw error;
    }
    /* validar si el usuario ya fue registrado */
    let user = await usersManager.readBy({ email });
    if (user) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }
    /* registrar al usuario (crearlo) con la contraseña protegida! */
    user = await usersManager.createOne(req.body);
    /* enviar respuesta al cliente */
    const data = { method, url, message };
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};
const loginCb = async (req, res, next) => {
  try {
    const { method, originalUrl: url } = req;
    const message = "Logged in";
    /* validar algunos datos obligatorios */
    const { email, password } = req.body;
    if (!email || !password) {
      const error = new Error("Invalid data");
      error.statusCode = 400;
      throw error;
    }
    /* validar si el usuario ya fue registrado */
    let user = await usersManager.readBy({ email });
    if (!user) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }
    /* validar si la contraseña es correcta */
    if (user.password !== req.body.password) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }
    /* configurar la cookie con las datos del usuario */
    const opts = { maxAge: 7 * 24 * 60 * 60 * 1000, signed: true };
    /* enviar respuesta al cliente */
    const data = { method, url, message };
    res
      .status(200)
      .cookie("user_id", user._id, opts)
      .cookie("role", user.role, opts)
      .cookie("email", user.email, opts)
      .json(data);
  } catch (error) {
    next(error);
  }
};
const signoutCb = (req, res, next) => {
  try {
    const { method, originalUrl: url } = req;
    const message = "Signed out";
    /* eliminar la cookie y enviar respuesta al cliente */
    const data = { method, url, message };
    res
      .status(200)
      .clearCookie("user_id")
      .clearCookie("role")
      .clearCookie("email")
      .json(data);
  } catch (error) {
    next(error);
  }
};
const onlineCb = async (req, res, next) => {
  try {
    const { method, originalUrl: url } = req;
    /* validar al usuario que esta conectado con las cookies */
    const { user_id, email, role } = req.signedCookies;
    /* validar que es un usuario de la base de datos */
    let user = await usersManager.readById(user_id);
    if (!user) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }
    const data = { method, url, user: { user_id, email, role, avatar: user.avatar } };
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

authRouter.post("/register", registerCb);
authRouter.post("/login", loginCb);
authRouter.post("/signout", signoutCb);
authRouter.post("/online", onlineCb);

export default authRouter;
