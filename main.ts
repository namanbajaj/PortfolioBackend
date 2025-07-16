import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { Status } from "jsr:@oak/commons@1/status";
import GithubResp from "./models/githubresp.ts";

const router = new Router();

router.get("/health", (ctx) => {
  ctx.response.body = {
    message: "OK",
  };
  ctx.response.type = "json";
  ctx.response.status = Status.OK;
});

router.get("/fetchJSON", async (ctx) => {
  ctx.response.type = "json";

  const allowedOrigins = [
    'https://www.namanbajaj.com'
  ]

  const requestOrigin = ctx.request.headers.get("origin") || "";
  const password = ctx.request.url.searchParams.get('password') || "";
  if (allowedOrigins.includes(requestOrigin) || password === Deno.env.get("API_PASSWORD")) {
    ctx.response.headers.set("Access-Control-Allow-Origin", requestOrigin)
  }
  else {
    ctx.response.status = Status.Unauthorized;
    ctx.response.body = { "Error": "Forbidden" };
    return;
  }

  const json_filename = ctx.request.url.searchParams.get('filename');
  if (json_filename === null) {
    ctx.response.body = { "Error": "Send a filename" }
    ctx.response.status = Status.BadRequest
    return;
  }

  const url = "https://api.github.com/repos/namanbajaj/portfolio_json/contents/" + json_filename;
  const headers = {
    "Authorization": Deno.env.get("GITHUB_API_KEY") || ""
  };

  if (headers.Authorization === "") {
    ctx.response.body = { "Error": "Auth not found" }
    ctx.response.status = Status.Forbidden
    return;
  }

  await fetch(url, { headers: headers })
    .then(response => response.json())
    .then(async (data: GithubResp) => {
      if (data.download_url) {
        const download_url = data.download_url;
        await fetch(download_url).then((response) => response.json())
          .then(data => {
            console.log(data)
            if (data) {
              ctx.response.status = Status.OK;
              ctx.response.body = data;
            }
            else {
              ctx.response.status = Status.InternalServerError;
              ctx.response.body = { "Error": "Unable to parse data: " + data }
            }
          })
      }
      else {
        ctx.response.body = { "Error": "File with name " + json_filename + " not found" }
        ctx.response.status = Status.NotFound;
      }
    })
});

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
