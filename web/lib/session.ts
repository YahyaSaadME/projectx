import "server-only";

import { cookies } from "next/headers";
import { authCookieName, verifyJwt } from "@/lib/auth";
import { asPublicUser, findUserById } from "@/lib/users";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyJwt(token);
    const user = await findUserById(payload.sub);

    if (!user) {
      return null;
    }

    return asPublicUser(user);
  } catch {
    return null;
  }
}