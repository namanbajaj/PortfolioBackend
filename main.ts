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

router.get("/test", async (ctx) => {
  await fetch("https://api.github.com/repos/namanbajaj/portfolio_json/contents/test.json", {
    headers: {
      "Authorization": Deno.env.get("GITHUB_API_KEY") || ""
    },
  }).then((response) => response.json())
    .then(async (data: GithubResp) => {
      console.log(data);
      if (data.download_url) {
        const download_url = data.download_url;
        console.log('download url: ', download_url)
        await fetch(download_url).then((response) => response.json())
          .then(data => {
            console.log(data)
            ctx.response.status = Status.OK;
            ctx.response.body = data;
          })
      }
      else {
        ctx.response.body = { "Error": 404 }
        ctx.response.status = Status.NotFound;
      }
      ctx.response.type = "json";
    });
});

router.get("/fetchJSON", async (ctx) => {
  const json_filename = ctx.request.url.searchParams.get('filename');
  const url = "https://api.github.com/repos/namanbajaj/portfolio_json/contents/" + json_filename;
  const headers = {
    "Authorization": Deno.env.get("GITHUB_API_KEY") || ""
  };

  await fetch(url, { headers: headers })
    .then(response => response.json())
    .then(async (data: GithubResp) => {
      console.log(data);
      if (data.download_url) {
        const download_url = data.download_url;
        console.log('download url: ', download_url)
        await fetch(download_url).then((response) => response.json())
          .then(data => {
            console.log(data)
            ctx.response.status = Status.OK;
            ctx.response.body = data;
          })
      }
      else {
        ctx.response.body = { "Error": "File with name " + json_filename + " not found" }
        ctx.response.status = Status.NotFound;
      }
      ctx.response.type = "json";
      console.log(ctx.request.headers.get('origin'))
      ctx.response.headers.set("Access-Control-Allow-Origin", "*")
    })
});

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
