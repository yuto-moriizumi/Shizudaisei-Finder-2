import React from "react";
import { Button, CardDeck, Container, Jumbotron } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import User from "../utils/User";
import UserCard from "../components/UserCard";
import getResponsiveElements from "../utils/getResponsiveElements";

interface State {
  users: User[];
  isLoading: boolean;
}

const SERVER_URL = process.env.REACT_APP_SERVER_URL;
if (!SERVER_URL) new Error("SERVER_URL must be specified");

export default class Index extends React.Component<{}, State> {
  state = { users: new Array<User>(), isLoading: false };
  private next = "";
  private handleScrollBinded = this.handleScroll.bind(this);

  componentDidMount() {
    this.getUsers(0);
    window.addEventListener("scroll", this.handleScrollBinded);
  }
  componentWillUnmount() {
    window.removeEventListener("scroll", this.handleScrollBinded);
  }

  private getUsers(offset: number) {
    this.setState({ isLoading: true });
    axios
      .get(`${SERVER_URL}/users?offset=${offset}`)
      .then((res) => {
        this.setState({ users: this.state.users.concat(res.data) });
      })
      .catch((e) => console.log(e))
      .finally(() => this.setState({ isLoading: false }));
  }

  private handleScroll() {
    const LOADING_HEIGHT_RATE = 0.8;
    if (
      Math.ceil(window.innerHeight + document.documentElement.scrollTop) <
        document.documentElement.offsetHeight * LOADING_HEIGHT_RATE ||
      this.state.isLoading //ロード中はapiを呼ばない
    )
      return;
    this.getUsers(this.state.users.length);
  }

  private cron() {
    axios
      .get(`${SERVER_URL}/users/update?type=fullarchive` + (this.next === "" ? "" : `&next=${this.next}`))
      .then((res) => {
        this.next = res.data.next;
        this.cron();
      })
      .catch((e) => console.log(e));
  }

  render() {
    return (
      <React.Fragment>
        <Jumbotron className="text-center">
          <h1 className="display-1">仲間を、見つけよう！</h1>
          <p className="h3 mb-3">
            Shizudaisei Finder 2は、静大生のTwitterユーザを簡単に見つけられるWEBアプリです
          </p>
          <Link to="search">
            <Button size="lg">検索する</Button>
          </Link>
          {/* <Button
            size="lg"
            onClick={() => {
              this.cron();
            }}
          >
            管理者用:更新
          </Button> */}
        </Jumbotron>
        <Container fluid className="px-4 no-gutters">
          <CardDeck>
            {getResponsiveElements(this.state.users.map((user) => <UserCard key={user.id} user={user} />))}
          </CardDeck>
        </Container>
      </React.Fragment>
    );
  }
}
