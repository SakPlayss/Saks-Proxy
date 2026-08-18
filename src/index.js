import { createServer } from "node:http";
import { fileURLToPath } from "url";
import { hostname } from "node:os";

import { Server } from "socket.io";

import {
	server as wisp,
	logging,
} from "@mercuryworkshop/wisp-js/server";

import Fastify from "fastify";
import fastifyStatic from "@fastify/static";

import {
	scramjetPath,
} from "@mercuryworkshop/scramjet/path";

import {
	libcurlPath,
} from "@mercuryworkshop/libcurl-transport";

import {
	baremuxPath,
} from "@mercuryworkshop/bare-mux/node";

/* ---------------- PATHS ---------------- */

const publicPath = fileURLToPath(
	new URL("../public/", import.meta.url)
);

/* ---------------- WISP ---------------- */

logging.set_level(logging.NONE);

Object.assign(wisp.options, {
	allow_udp_streams: false,
	hostname_blacklist: [/example\.com/],
	dns_servers: ["1.1.1.3", "1.0.0.3"],
});

/* ---------------- SERVER ---------------- */

const server = createServer();

/* ---------------- FASTIFY ---------------- */

const fastify = Fastify({
	serverFactory: (handler) => {
		server.on("request", (req, res) => {
			res.setHeader(
				"Cross-Origin-Opener-Policy",
				"same-origin"
			);

			res.setHeader(
				"Cross-Origin-Embedder-Policy",
				"require-corp"
			);

			handler(req, res);
		});

		return server;
	},
});

/* ---------------- SOCKET.IO ---------------- */

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const users = new Map();

io.on("connection", (socket) => {

  const userId =
    socket.handshake.auth.userId;

  if (!userId) return;

  if (!users.has(userId)) {
    users.set(userId, 0);
  }

  users.set(
    userId,
    users.get(userId) + 1
  );

  io.emit(
    "onlineUsers",
    users.size
  );

  console.log(
    "Online users:",
    users.size
  );

  socket.on("disconnect", () => {

    const count = users.get(userId);

    if (count <= 1) {
      users.delete(userId);
    } else {
      users.set(
        userId,
        count - 1
      );
    }

    io.emit(
      "onlineUsers",
      users.size
    );

    console.log(
      "Online users:",
      users.size
    );
  });

});

/* ---------------- UPGRADE ---------------- */

server.on(
	"upgrade",
	(req, socket, head) => {
		if (
			req.url &&
			req.url.endsWith("/wisp/")
		) {
			wisp.routeRequest(
				req,
				socket,
				head
			);

			return;
		}
	}
);

/* ---------------- STATIC ---------------- */

fastify.register(fastifyStatic, {
	root: publicPath,
	decorateReply: true,
});

fastify.register(fastifyStatic, {
	root: scramjetPath,
	prefix: "/scram/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: libcurlPath,
	prefix: "/libcurl/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: baremuxPath,
	prefix: "/baremux/",
	decorateReply: false,
});

/* ---------------- 404 ---------------- */

fastify.setNotFoundHandler(
	(req, reply) => {
		return reply
			.code(404)
			.type("text/html")
			.sendFile("404.html");
	}
);

/* ---------------- LISTEN ---------------- */

server.on("listening", () => {
	const address = server.address();

	console.log("Listening on:");

	console.log(
		`\thttp://localhost:${address.port}`
	);

	console.log(
		`\thttp://${hostname()}:${address.port}`
	);

	console.log(
		`\thttp://${
			address.family === "IPv6"
				? `[${address.address}]`
				: address.address
		}:${address.port}`
	);
});

/* ---------------- SHUTDOWN ---------------- */

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
	console.log(
		"SIGTERM signal received: closing HTTP server"
	);

	fastify.close();

	process.exit(0);
}

/* ---------------- START ---------------- */

let port = parseInt(
	process.env.PORT || ""
);

if (isNaN(port)) {
	port = 8080;
}

fastify.listen({
	port,
	host: "0.0.0.0",
});