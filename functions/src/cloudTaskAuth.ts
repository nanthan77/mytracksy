import { OAuth2Client, TokenPayload } from "google-auth-library";

const oidcClient = new OAuth2Client();

export interface RequestLike {
    get(name: string): string | undefined;
    originalUrl?: string;
    path?: string;
}

function normalizePath(rawPath?: string): string {
    const cleanPath = (rawPath || "/").split("?")[0];
    return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
}

export function getExpectedTaskAudience(req: RequestLike): string {
    const host = req.get("host") || req.get("x-forwarded-host");
    if (!host) {
        throw new Error("Missing host header");
    }

    const path = normalizePath(req.originalUrl || req.path);
    return `https://${host}${path}`;
}

export async function verifyCloudTaskOidcToken(
    authHeader: string | undefined,
    audience: string,
    expectedServiceAccountEmail?: string
): Promise<TokenPayload> {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Missing bearer token");
    }

    const idToken = authHeader.slice("Bearer ".length).trim();
    if (!idToken) {
        throw new Error("Empty bearer token");
    }

    const ticket = await oidcClient.verifyIdToken({
        idToken,
        audience,
    });

    const payload = ticket.getPayload();
    if (!payload) {
        throw new Error("Missing token payload");
    }

    if (expectedServiceAccountEmail && payload.email && payload.email !== expectedServiceAccountEmail) {
        throw new Error("Unexpected service account email");
    }

    return payload;
}
