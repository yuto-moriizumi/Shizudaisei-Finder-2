import axios from "axios";
import express from "express";
import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";
import mysql2 from "mysql2";
import { JSDOM } from "jsdom";
import dayjs from "dayjs";
import { URL } from "url";

const router = express.Router();

const DB_SETTING = {
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
};
const connection = mysql2.createConnection(DB_SETTING);

connection.connect((err) => {
  if (err) {
    console.log("error connecting: " + err.stack);
    console.log(DB_SETTING);
    return;
  }
  // console.log("database connection success");
});
connection.end();

/* GET pages */
router.get("/pages", (req, res) => {
  const connection = mysql2.createConnection(DB_SETTING);
  connection.connect();
  const data: (mysql2.RowDataPacket | mysql2.OkPacket)[] = [];
  connection
    .query(
      "SELECT name, url, last_title as title, last_img as img, updated FROM artists"
    )
    .on("result", (row) => data.push(row))
    .on("end", () => {
      res.send(data);
    });
});

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: process.env.AUTH0_DOMAIN + ".well-known/jwks.json",
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: process.env.AUTH0_DOMAIN,
  algorithms: ["RS256"],
});

// router.use(checkJwt);

//express-jwtは、tokenデコード後reqオブジェクトのuserプロパティに結果オブジェクトを格納します
//しかしなぜか型定義が用意されていないのでここで作ります
declare global {
  namespace Express {
    interface Request {
      user?: { sub: string }; //subはユーザのIDです
    }
  }
}

//購読一覧をstar降順に取得する
router.get("/subscriptions", checkJwt, (req, res) => {
  if (!req.user) {
    res.status(403).send({ error: "token does not contain user information" });
    return;
  }
  console.log(`USER_ID:${req.user.sub}`);

  const connection = mysql2.createConnection(DB_SETTING);
  connection.connect();
  const data: (mysql2.RowDataPacket | mysql2.OkPacket)[] = [];
  const QUERY =
    "SELECT name, `url`, `last_title` as `title`, `last_img` as `img`, `updated`, `rank` as `rating`, `has_new` FROM artists NATURAL JOIN subscriptions " +
    `WHERE user_id='${req.user.sub}' ORDER BY rating DESC`;
  connection
    .query(QUERY)
    .on("result", (row) => data.push(row))
    .on("end", () => res.send(data))
    .on("error", (err) => console.log(err, QUERY));
});

//新規購読を追加する
router.post("/subscriptions", checkJwt, (req, res) => {
  if (!req.user) {
    res.status(403).send({ error: "token does not contain user information" });
    return;
  }
  const user_id = req.user.sub;

  //SQLインジェクションの危険性あり
  //ページを追加する
  const connection = mysql2.createConnection(DB_SETTING);
  connection.connect();
  connection
    .query("INSERT IGNORE INTO artists" + `(url) VALUES ('${req.body.url}')`)
    .on("error", (err) => {
      console.log(err);
      res.status(500).send();
    })
    .on("end", () => {
      //購読追加とページ更新を並列実行
      Promise.all([
        updatePageInfo({
          url: req.body.url,
        }),
        new Promise((fulfilled) => {
          //購読を追加する
          const QUERY =
            "INSERT IGNORE INTO subscriptions" +
            " (`user_id`, `url`, `rank`, `has_new`)" +
            ` VALUES ('${user_id}', '${req.body.url}', ${req.body.star}, 1)`;
          console.log(QUERY);
          connection
            .query(QUERY)
            .on("error", (err) => {
              console.log(err);
              res.status(500).send();
            })
            .on("end", () => fulfilled(undefined));
        }),
      ]).then(() => res.status(201).send());
    });
});

//既読を切り替える
router.post("/subscriptions/new", checkJwt, (req, res) => {
  if (!req.user) {
    res.status(403).send({ error: "token does not contain user information" });
    return;
  }
  console.log(`USER_ID:${req.user.sub}, BODY:${req.body}`);

  //SQLインジェクションの危険性あり
  //既読を切り替える
  const connection = mysql2.createConnection(DB_SETTING);
  connection.connect();
  connection
    .query(
      "UPDATE subscriptions" +
        ` SET has_new=${req.body.has_new} WHERE user_id='${req.user.sub}' AND url='${req.body.url}'`
    )
    .on("end", () => res.status(201).send());
});

//ランクを変更する
router.post("/subscriptions/rank", checkJwt, (req, res) => {
  if (!req.user) {
    res.status(403).send({ error: "token does not contain user information" });
    return;
  }
  console.log(`USER_ID:${req.user.sub}`);

  //SQLインジェクションの危険性あり
  //ランクを変更する
  const QUERY =
    "UPDATE subscriptions" +
    ` SET rank=${req.body.rank} WHERE user_id='${req.user.sub}' AND url='${req.body.url}'`;
  console.log(QUERY);
  const connection = mysql2.createConnection(DB_SETTING);
  connection.connect();
  connection.query(QUERY).on("end", () => res.status(201).send());
});

//既読を削除する
router.post("/subscriptions/delete", checkJwt, (req, res) => {
  if (!req.user) {
    res.status(403).send({ error: "token does not contain user information" });
    return;
  }
  console.log(`USER_ID:${req.user.sub}`);

  //SQLインジェクションの危険性あり
  //既読を削除する
  const connection = mysql2.createConnection(DB_SETTING);
  connection.connect();
  connection
    .query(
      "DELETE FROM subscriptions" +
        ` WHERE user_id='${req.user.sub}' AND url='${req.body.url}'`
    )
    .on("end", () => res.status(201).send());

  //購読のないページを削除する
  connection
    .query(
      "DELETE FROM artists WHERE NOT url IN (SELECT url FROM subscriptions)"
    )
    .on("error", (err) => {
      console.log(err);
    });
});

type Page = {
  url: string;
  last_title?: string;
  last_img?: string;
  updated?: string;
};

//全てのページを更新する
router.get("/pages/update", (req, res) => {
  const pages: Page[] = [];
  const connection = mysql2.createConnection(DB_SETTING);
  connection.connect();
  connection
    .query("SELECT * FROM artists ORDER BY updated ASC")
    .on("result", (row) => pages.push(JSON.parse(JSON.stringify(row))))
    .on("end", async () => {
      console.log(`pages loaded, total ${pages.length}`);
      for (const page of pages) {
        await updatePageInfo(page);
      }
    });
  res.status(202).send();
});

//指定したページの情報を取得し、DBを更新します
async function updatePageInfo(page: Page) {
  console.log(`${page.url} update start`);
  //htmlを取得
  const res = await axios.get(page.url);
  const gallery_document = new JSDOM(res.data).window.document;

  //本を取得
  const books = gallery_document.querySelectorAll("a.cover");
  if (!books) {
    console.log(`${page.url}'s first book was not found`);
    return;
  }

  //最新の日本語本を見つける
  for (const book of Array.from(books)) {
    const book_url = new URL(page.url).origin + book.getAttribute("href");
    const res_book = await axios.get(book_url);
    const document = new JSDOM(res_book.data).window.document;

    //言語を取得
    const language = document.querySelector("section#tags")?.textContent;
    if (language?.includes("japanese")) {
      //日本語である
      //タイトルを取得
      const title = document.querySelector("h2.title span.pretty")?.textContent;

      //更新が無ければ何もしない
      if (title === page.last_title) {
        console.log(`${page.url} no update`);
        return;
      }

      //作者を取得
      const author = document.querySelector("h2.title span.before")
        ?.textContent;

      //サムネイルのエレメントを取得
      const el_thumbnail = book.querySelector("img");

      const QUERY =
        "UPDATE artists" +
        ` SET name=?,` +
        ` last_title=?,` +
        ` last_img=?,` +
        ` updated=?` +
        ` WHERE url=?`;
      //情報を更新する
      const connection = mysql2.createConnection(DB_SETTING);
      connection.connect();
      await new Promise((resolve) => {
        connection
          .execute(QUERY, [
            author ?? "undefined",
            title ?? "undefined",
            el_thumbnail?.getAttribute("data-src") ?? "undefined",
            dayjs().format("YYYY-MM-DD HH:MM:ss"),
            page.url,
          ])
          .on("end", () => {
            console.log(`${page.url} update end`);
            resolve(undefined);
          });
      });
      return;
    }
  }
  console.log(`${page.url} no japanese`);
}

export default router;
