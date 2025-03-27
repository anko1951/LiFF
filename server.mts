import { createServer } from "https";
import { parse } from "url";
import next from "next"; // 修正: nextを直接インポート
import fs from "fs";
import path from "path";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev }); // 修正: next() を呼び出す
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(process.cwd(), "localhost-key.pem")),
  cert: fs.readFileSync(path.join(process.cwd(), "localhost.pem")),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(3000, () => {
    console.log("🚀 Server running at https://localhost:3000");
  });
});
