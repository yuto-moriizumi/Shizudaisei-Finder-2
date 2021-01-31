export default interface DbUser {
  id: string;
  tweet_id: string;
  content: string;
  created_at: string;
}

export interface TwitterResponseUser {
  id_str: string;
  name: string;
  screen_name: string;
  profile_image_url_https: string;
}

export interface UserTweet extends DbUser {
  name: string;
  screen_name: string;
  img_url: string;
  is_following: boolean;
}
