export default interface User {
  id: string;
  name: string;
  screen_name: string;
  img_url: string;
  content: string;
  created_at: string;
  is_following?: boolean;
  is_requesting?: boolean;
  follow_failed?: boolean;
}
