import {
  createReadStream,
} from "node:fs";

import {
  appendFile,
  mkdir,
  stat,
} from "node:fs/promises";

import {
  createServer,
} from "node:http";

import {
  dirname,
  extname,
  resolve,
  sep,
} from "node:path";

import {
  fileURLToPath,
} from "node:url";


const MAX_WISH_LENGTH = 120;
const MAX_BODY_SIZE = 2048;

const projectDirectory =
  fileURLToPath(
    new URL(".", import.meta.url)
  );

const distributionDirectory =
  resolve(
    projectDirectory,
    "dist",
  );

const wishLogPath =
  process.env.WISH_LOG_PATH
    ? resolve(process.env.WISH_LOG_PATH)
    : resolve(
        projectDirectory,
        "data",
        "wishes.log",
      );

const isProduction =
  process.argv.includes(
    "--production"
  );


function getArgument(name) {
  const index =
    process.argv.indexOf(
      name
    );

  if (index === -1) return null;

  return process.argv[index + 1]
    ?? null;
}


const host =
  process.env.HOST
  ?? getArgument("--host")
  ?? (
    isProduction
      ? "0.0.0.0"
      : "127.0.0.1"
  );

const port =
  Number.parseInt(
    process.env.PORT
    ?? getArgument("--port")
    ?? (
      isProduction
        ? "3000"
        : "5173"
    ),
    10,
  );

if (
  !Number.isInteger(port)
  || port < 1
  || port > 65535
) {
  throw new Error(
    "PORT must be an integer between 1 and 65535"
  );
}


const mimeTypes =
  new Map([
    [".css", "text/css; charset=utf-8"],
    [".gif", "image/gif"],
    [".glb", "model/gltf-binary"],
    [".html", "text/html; charset=utf-8"],
    [".ico", "image/x-icon"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".png", "image/png"],
    [".svg", "image/svg+xml"],
    [".webp", "image/webp"],
  ]);


function sendJson(
  response,
  statusCode,
  body,
) {
  response.writeHead(
    statusCode,
    {
      "Cache-Control":
        "no-store",

      "Content-Type":
        "application/json; charset=utf-8",

      "X-Content-Type-Options":
        "nosniff",
    },
  );

  response.end(
    JSON.stringify(body)
  );
}


async function readJsonBody(request) {
  let size = 0;
  let isTooLarge = false;
  const chunks = [];

  for await (const chunk of request) {
    size += chunk.length;

    if (size > MAX_BODY_SIZE) {
      isTooLarge = true;
      continue;
    }

    chunks.push(
      chunk
    );
  }

  if (isTooLarge) {
    const error =
      new Error(
        "Request body is too large"
      );

    error.statusCode = 413;
    throw error;
  }

  try {
    return JSON.parse(
      Buffer.concat(chunks)
        .toString("utf8")
    );
  } catch {
    const error =
      new Error(
        "Request body must be valid JSON"
      );

    error.statusCode = 400;
    throw error;
  }
}


async function appendWish(wish) {
  const entry = {
    wish,

    createdAt:
      new Date()
        .toISOString(),
  };

  await mkdir(
    dirname(
      wishLogPath
    ),
    {
      recursive: true,
    },
  );

  await appendFile(
    wishLogPath,
    `${JSON.stringify(entry)}\n`,
    {
      encoding: "utf8",
      flag: "a",
      mode: 0o600,
    },
  );
}


async function handleWishRequest(
  request,
  response,
) {
  if (request.method !== "POST") {
    response.setHeader(
      "Allow",
      "POST",
    );

    sendJson(
      response,
      405,
      {
        success: false,
        error: "Method not allowed",
      },
    );

    return;
  }

  if (
    !request.headers["content-type"]
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    sendJson(
      response,
      415,
      {
        success: false,
        error: "Content-Type must be application/json",
      },
    );

    return;
  }

  let body;

  try {
    body =
      await readJsonBody(
        request
      );
  } catch (error) {
    sendJson(
      response,
      error.statusCode ?? 400,
      {
        success: false,
        error: error.message,
      },
    );

    return;
  }

  const wish =
    typeof body?.wish === "string"
      ? body.wish.trim()
      : "";

  if (
    !wish
    || wish.length > MAX_WISH_LENGTH
  ) {
    sendJson(
      response,
      400,
      {
        success: false,
        error:
          `Wish must contain between 1 and ${MAX_WISH_LENGTH} characters`,
      },
    );

    return;
  }

  try {
    await appendWish(
      wish
    );
  } catch (error) {
    console.error(
      "Could not append to the wish log:",
      error
    );

    sendJson(
      response,
      500,
      {
        success: false,
        error: "Wish could not be saved",
      },
    );

    return;
  }

  sendJson(
    response,
    201,
    {
      success: true,
    },
  );
}


function getStaticPath(pathname) {
  let decodedPath;

  try {
    decodedPath =
      decodeURIComponent(
        pathname
      );
  } catch {
    return null;
  }

  const relativePath =
    decodedPath === "/"
      ? "index.html"
      : decodedPath.replace(
          /^\/+/,
          "",
        );

  const filePath =
    resolve(
      distributionDirectory,
      relativePath,
    );

  if (
    filePath !== distributionDirectory
    && !filePath.startsWith(
      `${distributionDirectory}${sep}`
    )
  ) {
    return null;
  }

  return filePath;
}


async function serveFile(
  request,
  response,
  filePath,
) {
  const fileStats =
    await stat(
      filePath
    );

  if (!fileStats.isFile()) {
    const error =
      new Error(
        "Not a file"
      );

    error.code = "ENOENT";
    throw error;
  }

  response.writeHead(
    200,
    {
      "Cache-Control":
        filePath.includes(
          `${sep}assets${sep}`
        )
          ? "public, max-age=31536000, immutable"
          : "no-cache",

      "Content-Length":
        fileStats.size,

      "Content-Type":
        mimeTypes.get(
          extname(filePath)
            .toLowerCase()
        )
        ?? "application/octet-stream",
    },
  );

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(
    filePath
  )
    .on(
      "error",
      () => {
        response.destroy();
      },
    )
    .pipe(
      response
    );
}


async function serveProduction(
  request,
  response,
  pathname,
) {
  if (
    request.method !== "GET"
    && request.method !== "HEAD"
  ) {
    response.writeHead(405, {
      Allow: "GET, HEAD",
    });

    response.end(
      "Method not allowed"
    );

    return;
  }

  const filePath =
    getStaticPath(
      pathname
    );

  if (!filePath) {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  try {
    await serveFile(
      request,
      response,
      filePath,
    );
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    if (
      extname(filePath)
      || !request.headers.accept
        ?.includes("text/html")
    ) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    await serveFile(
      request,
      response,
      resolve(
        distributionDirectory,
        "index.html",
      ),
    );
  }
}


let vite = null;

const server =
  createServer(
    (request, response) => {
      void handleRequest(
        request,
        response,
      ).catch((error) => {
        console.error(
          "Unhandled server error:",
          error
        );

        if (!response.headersSent) {
          sendJson(
            response,
            500,
            {
              success: false,
              error: "Internal server error",
            },
          );
        } else {
          response.destroy();
        }
      });
    },
  );


async function handleRequest(
  request,
  response,
) {
  const requestUrl =
    new URL(
      request.url ?? "/",
      "http://localhost",
    );

  if (requestUrl.pathname === "/api/wishes") {
    await handleWishRequest(
      request,
      response,
    );

    return;
  }

  if (isProduction) {
    await serveProduction(
      request,
      response,
      requestUrl.pathname,
    );

    return;
  }

  vite.middlewares(
    request,
    response,
  );
}


if (!isProduction) {
  const {
    createServer:
      createViteServer,
  } = await import("vite");

  vite =
    await createViteServer({
      appType: "spa",

      server: {
        middlewareMode: true,

        hmr: {
          server,
        },
      },
    });
}


server.listen(
  port,
  host,
  () => {
    console.log(
      `${
        isProduction
          ? "Production"
          : "Development"
      } server running at http://${host}:${port}`
    );

    console.log(
      `Wishes are appended to ${wishLogPath}`
    );
  },
);


async function shutdown() {
  await vite?.close();

  server.close(
    () => {
      process.exit(0);
    }
  );
}


process.once(
  "SIGINT",
  shutdown,
);

process.once(
  "SIGTERM",
  shutdown,
);
