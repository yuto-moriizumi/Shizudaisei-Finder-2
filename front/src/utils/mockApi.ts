import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import User from "./User";

const SERVER_URL = process.env.REACT_APP_SERVER_URL;
if (!SERVER_URL) new Error("SERVER_URL must be specified");

export default function enableMock() {
  const mockAxios = new AxiosMockAdapter(axios, { delayResponse: 500 });
  const USERS: User[] = [
    {
      id: "0151029122",
      name: "Taro Tanaka",
      screen_name: "TaroTanaka",
      img_url: "https://pbs.twimg.com/profile_images/1219493965000368129/ObOXnQp7_400x400.jpg",
      content: "今日はいい天気",
      created_at: "2020-11-12 13:14:15",
      is_following: false,
    },
    {
      id: "0151029123",
      name: "Taro Tanaka",
      screen_name: "TaroTanaka",
      img_url: "https://pbs.twimg.com/profile_images/1219493965000368129/ObOXnQp7_400x400.jpg",
      content: "今日はいい天気",
      created_at: "2020-11-12 13:14:15",
      is_following: false,
    },
  ];

  mockAxios.onGet(`${SERVER_URL}/users`).reply(() => {
    return [
      200,
      USERS.map((user) => {
        delete user.is_following;
        return user;
      }),
    ];
  });
  mockAxios.onGet(`${SERVER_URL}/users/search`).reply(() => {
    return [200, USERS];
  });
  mockAxios.onPost(`${SERVER_URL}/users/follow`).reply(() => [201, null]);
  mockAxios.onGet(`${SERVER_URL}/users/update`).reply(() => [200, null]);
}
