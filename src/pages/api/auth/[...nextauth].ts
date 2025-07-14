import NextAuth from "next-auth/next";
import { authOptions } from "../../../app/api/auth/[...nextauth]/authOptions";

export default NextAuth(authOptions); 