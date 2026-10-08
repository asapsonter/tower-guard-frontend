import { handleGuardian } from "../server/router.js";

// maxDuration for the Claude tool loop is set in vercel.json
export const POST = handleGuardian;
