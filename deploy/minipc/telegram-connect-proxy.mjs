import http from "node:http";
import net from "node:net";

const port = 8899;
const server = http.createServer((request, response) => {
  response.writeHead(405);
  response.end();
});

server.on("connect", (request, client, head) => {
  const [host, rawPort] = request.url.split(":");
  const upstream = net.connect(Number(rawPort) || 443, host, () => {
    client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    if (head.length > 0) {
      upstream.write(head);
    }
    upstream.pipe(client);
    client.pipe(upstream);
  });
  upstream.on("error", () => client.destroy());
  client.on("error", () => upstream.destroy());
});

server.listen(port, "127.0.0.1");
