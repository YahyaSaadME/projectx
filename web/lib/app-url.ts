export function getAppBaseUrl(request?: Request) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (!request) {
    return "http://localhost:3000";
  }

  const requestUrl = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const rawHost = forwardedHost ?? request.headers.get("host") ?? requestUrl.host;
  const host = rawHost === "0.0.0.0" || rawHost === "127.0.0.1" || rawHost === "[::]" ? "localhost:3000" : rawHost;
  const protocol = forwardedProto ?? requestUrl.protocol.replace(":", "");

  return `${protocol}://${host}`.replace(/\/$/, "");
}