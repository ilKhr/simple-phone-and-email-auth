import { Handler } from "../server";
import { ENDPOINTS } from "./endpoints";
import * as handlers from "../handlers";

const route: Record<(typeof ENDPOINTS)[keyof typeof ENDPOINTS], Handler> = {
  [ENDPOINTS.root]: () => "20",
  [ENDPOINTS.userSignUpEmail]: handlers.user.signUp.email,
};
