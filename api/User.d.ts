export default interface DbUser {
  id: string;
  tweet_id: string;
  content: string;
  created_at: string;
}

export interface TwitterResponseUser {
  id_str: string; // Twitter内部で管理しているユーザID
  name: string;
  screen_name: string; // Twitterのレスポンスにおけるscreen_nameで、いわゆる変更できるIDのこと
  profile_image_url_https: string;
}

export interface UserTweet extends DbUser {
  name: string;
  screen_name: string;
  img_url: string;
  is_following: boolean;
}
