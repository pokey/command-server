import * as http from "http";

export function getRequestJSON(req: http.IncomingMessage) {
  return new Promise<any>((resolve, reject) => {
    var body = "";
    req.on("data", function (chunk) {
      body += chunk;
    });
    req.on("end", () => resolve(JSON.parse(body)));
  });
}
