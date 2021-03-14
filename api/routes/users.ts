import express from "express";
import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";
import mysql2 from "mysql2/promise";
import dayjs from "dayjs";
import Twitter from "twitter";
import DbUser, { TwitterResponseUser, UserTweet } from "../User";
import auth0 from "auth0";

const router = express.Router();

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN ?? "AUTH0_DOMAIN";
const AUTH0_FQDN = `https://${AUTH0_DOMAIN}/`;

const DB_SETTING = {
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
};
const CONSUMER_KEYSET = {
  consumer_key: process.env.CONSUMER_KEY ?? "CONSUMER_KEY",
  consumer_secret: process.env.CONSUMER_SECRET ?? "CONSUMER_SECRET",
};
const TWITTER_KEYSET = {
  ...CONSUMER_KEYSET,
  bearer_token: process.env.BEARER_TOKEN ?? "BEARER_TOKEN",
};
const AUTH0_KEYSET = {
  clientId: process.env.CLIENT_ID ?? "CLIENT_ID",
  clientSecret: process.env.CLIENT_SECRET ?? "CLIENT_SECRET",
};

// ユーザを100件取得
router.get("/", async (req, res) => {
  const offset = parseInt((req.query.offset as string) ?? "0");
  const connection = await mysql2.createConnection(DB_SETTING);
  try {
    await connection.connect();
    const [usersArr, fields] = await connection.query(
      `SELECT * FROM users ORDER BY created_at DESC LIMIT 100 OFFSET ${offset}`
    );
    const users = usersArr as DbUser[];

    const detailed_users = await fetchUserDetail(users);
    res.send(detailed_users);
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
  connection.end();
});

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: AUTH0_FQDN + ".well-known/jwks.json",
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: AUTH0_FQDN,
  algorithms: ["RS256"],
});

// router.use(checkJwt);

//express-jwtは、tokenデコード後reqオブジェクトのuserプロパティに結果オブジェクトを格納します
//しかしなぜか型定義が用意されていないのでここで作ります
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
      }; //subはユーザのIDです
    }
  }
}

// 購読一覧をstar降順に取得する
router.get("/search", checkJwt, async (req, res) => {
  if (!req.user)
    return res
      .status(403)
      .send({ error: "token does not contain user information" });

  //検索オプションを成形
  type SearchOptions = {
    from?: string;
    to?: string;
    incl_flw: string;
    excl_kws?: string[];
    excl_names?: string[];
  };
  const options = req.query as SearchOptions;
  console.log(options);

  const connection = await mysql2.createConnection(DB_SETTING);
  try {
    //検索条件に応じてDBを検索
    await connection.connect();

    //クエリを構築する
    let QUERY = "SELECT * FROM users WHERE created_at BETWEEN ? AND ?";
    if (options.excl_kws)
      //除外キーワードが指定されている場合は除外
      QUERY += ` AND NOT content REGEXP('${options.excl_kws
        .map((kw) => `.*${kw}.*`)
        .join("|")}')`;

    const from = dayjs(options.from);
    const to = dayjs(options.to);

    //クエリ実行
    const result_set = await connection.execute(
      QUERY + " ORDER BY created_at DESC",
      [
        from.isValid() ? from.format("YYYY-MM-DD") : "2000-01-01",
        to.isValid() ? to.format("YYYY-MM-DD") : "2050-01-01",
      ]
    );
    if (!result_set) {
      //検索結果0件の場合
      res.status(200).send([]);
      return;
    }
    const [users_temp, fields] = result_set;
    let users = users_temp as DbUser[];

    //フォローしているユーザ一覧を取得する
    const auth_user = await getAuthUser(req.user.sub);

    //Twitterインスタンス化
    const client = new Twitter({
      ...CONSUMER_KEYSET,
      access_token_key: auth_user.access_token ?? "ACCESS_TOKEN_KEY",
      access_token_secret: auth_user.access_token_secret ?? "ACCESS_TOKEN_KEY",
    });

    //フォローしているユーザID一覧を取得
    const followings = await client.get("friends/ids", {
      user_id: auth_user.user_id,
      count: 5000,
      stringify_ids: true,
    });
    const following_ids = followings.ids as Array<string>;

    if (options.incl_flw === "false")
      //フォローしているユーザを除外する場合
      users = users.filter((user) => following_ids.indexOf(user.id) === -1);

    let detailed_users = await fetchUserDetail(users);
    if (options.excl_names) {
      const excl_names = options.excl_names;
      //除外するアカウント名が指定されている場合は除外
      detailed_users = detailed_users.filter(
        (user) => excl_names.every((keyword) => !user.name.includes(keyword)) //いずれのキーワードも含まない全てのアカウントを返す
      );
    }
    res.send(
      detailed_users.map((user) => {
        //フォローしているユーザのIDリストに該当しているか、自分自身のアカウントであればフォロー扱いにする
        if (following_ids.includes(user.id) || user.id === auth_user.user_id)
          user.is_following = true;
        return user;
      })
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
  connection.end();
});

async function fetchUserDetail(users: DbUser[]) {
  if (users.length === 0) return [];
  const client = new Twitter(TWITTER_KEYSET);
  const detailed_users = await client
    .get("users/lookup", {
      user_id: users
        .slice(0, 100)
        .map((user) => user.id)
        .join(","),
      include_entities: false,
    })
    .catch((e) => {
      console.log(e);
    });
  if (!detailed_users) throw new Error("couldn't fetch users");

  //users配列をidで取れるようにMapに変換
  const users_map = new Map<string, DbUser>(
    users.map((user) => [user.id, user])
  );

  const responce_users = detailed_users.map((user: TwitterResponseUser) => {
    const tweet_user = users_map.get(user.id_str);
    const detailed_user = {
      id: user.id_str,
      name: user.name,
      screen_name: user.screen_name,
      img_url: user.profile_image_url_https,
      content: tweet_user?.content,
      created_at: tweet_user?.created_at,
    } as UserTweet;
    return detailed_user;
  }) as UserTweet[];
  return responce_users;
}

async function getAuthUser(auth0_id: string) {
  //認証したユーザのアクセストークンを取得
  console.log(AUTH0_KEYSET);
  const ManagementClient = auth0.ManagementClient;
  const management = new ManagementClient({
    domain: AUTH0_DOMAIN,
    ...AUTH0_KEYSET,
  });
  const user = await management.getUser({ id: auth0_id });
  if (!user.identities) throw new Error("User identities not found");
  const identity = JSON.parse(JSON.stringify(user.identities[0]));
  return {
    access_token: identity.access_token as string,
    access_token_secret: identity.access_token_secret as string,
    user_id: identity.user_id as string,
  };
}

router.post("/follow", checkJwt, async (req, res) => {
  if (!req.user)
    return res
      .status(403)
      .send({ error: "token does not contain user information" });
  const auth_user = await getAuthUser(req.user.sub);
  if (!auth_user)
    return res.status(500).send({ error: "management api error" });
  const client = new Twitter({
    ...CONSUMER_KEYSET,
    access_token_key: auth_user.access_token ?? "ACCESS_TOKEN_KEY",
    access_token_secret: auth_user.access_token_secret ?? "ACCESS_TOKEN_KEY",
  });

  client
    .post("friendships/create", {
      user_id: req.body.user_id,
    })
    .catch((e) => {
      console.log(e);
      res.status(500).send(e);
    })
    .then(async (result) => {
      if (result instanceof Array) {
        //エラーオブジェクトの配列が返された場合
        const error = result[0] as { code: number; message: string };
        if (error.code === 162) return res.status(403).send(error); //対象のユーザにブロックされている
        if (error.code === 88) return res.status(429).send(error); //レート制限
        return res.status(500).send(error); //その他のエラー
      }
      console.log(result);
      res.status(201).send();
      //DBに使用状況を登録
      const connection = await mysql2.createConnection(DB_SETTING);
      await connection.connect();
      connection
        .execute("INSERT IGNORE friendships VALUE (?, ?, ?)", [
          auth_user.user_id,
          req.body.user_id,
          dayjs().format("YYYY-MM-DD HH:MM:ss"),
        ])
        .catch((err) => console.log(err));
      connection.end();
    });
});

//cron用 ツイートを検索してDBに追加する
router.get("/update", async (req, res) => {
  try {
    const API_TYPE = req.query.type; //"30day" or "fullarchive"
    const IS_PREMIUM_API = API_TYPE === "fullarchive" || API_TYPE === "30day";
    console.log("type", API_TYPE);
    const NEXT = req.query.next; //for pagination, provided by api responce
    const client = new Twitter(TWITTER_KEYSET);
    const endpoint =
      API_TYPE === "fullarchive"
        ? "tweets/search/fullarchive/test2"
        : API_TYPE === "30day"
        ? "tweets/search/30day/test"
        : "search/tweets";
    let request = {};
    if (IS_PREMIUM_API) {
      request = {
        query: "#春から静大",
        toDate: 202102200000,
      };
      if (NEXT) {
        Object.defineProperty(request, "next", {
          value: NEXT,
        });
      }
    } else {
      request = {
        q: "#春から静大",
        result_type: "recent",
        count: 100,
        include_entities: false,
      };
    }
    const responce = await client.get(endpoint, request);
    const next = responce.next;
    let tweets = (IS_PREMIUM_API ? responce.results : responce.statuses) as {
      id_str: string;
      name: string;
      text: string;
      user: { id_str: string; name: string };
      created_at: string;
      retweeted_status?: {};
    }[];
    const users = tweets
      .filter((tweet) => tweet.retweeted_status === undefined) //RTを除外
      .map((tweet) => {
        return {
          id: tweet.user.id_str,
          name: tweet.user.name,
          tweet_id: tweet.id_str,
          content: tweet.text,
          created_at: dayjs(tweet.created_at).format("YYYY-MM-DD HH:mm:ss"),
        };
      });

    //DBに登録
    const connection = await mysql2.createConnection(DB_SETTING);
    await connection.connect();
    const success = new Array<{}>();
    const skip = new Array<{}>();
    const error = new Array<{}>();
    users.forEach((user) => {
      connection
        .execute("INSERT users VALUES (?, ?, ?, ?)", [
          user.id,
          user.tweet_id,
          user.content,
          user.created_at,
        ])
        .then(() => {
          // console.log("success", { user_id: user.id, name: user.name });
          success.push({ user_id: user.id, name: user.name });
        })
        .catch((err: { code: string; sqlMessage: string }) => {
          if (err.code === "ER_DUP_ENTRY") {
            // console.log("skip", { user_id: user.id, name: user.name });
            skip.push({ user_id: user.id, name: user.name });
            return;
          }
          console.log("error", { user_id: user.id, name: user.name });
          error.push({
            code: err.code,
            message: err.sqlMessage,
            user_id: user.id,
            name: user.name,
          });
          console.log(err);
        });
    });
    await connection.end();
    const result = {
      total: users.length,
      next: next,
      success: {
        total: success.length,
        entries: success,
      },
      skip: {
        total: skip.length,
        entries: skip,
      },
      error: {
        total: error.length,
        entries: error,
      },
    };
    if (error.length === 0) {
      res.send(result);
      console.log(
        `user insertion cron success, inserted:${success.length} skipped:${skip.length}`
      );
      return;
    }
    res.status(500).send(result);
    console.log(
      `user insertion cron failed, inserted:${success.length} skipped:${skip.length}, error:${error.length}`
    );
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
});

export default router;
