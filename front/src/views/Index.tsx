import React from "react";
import { Button, CardDeck, Container, Jumbotron } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import User from "../utils/User";
import UserCard from "../components/UserCard";

interface State {
  users: User[];
  isLoading: boolean;
}

const SERVER_URL = process.env.REACT_APP_SERVER_URL;
if (!SERVER_URL) new Error("SERVER_URL must be specified");

export default class Index extends React.Component<{}, State> {
  state = { users: new Array<User>(), isLoading: false };

  componentDidMount() {
    this.getUsers(0);
    window.addEventListener("scroll", this.handleScroll.bind(this));
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

  private getCardsWithSeparator(users: User[]) {
    //カードをレスポンシブ対応させるために、キー付セパレータを混ぜたJSXの配列を生成する
    const result = new Array<JSX.Element>();
    let key = 0;
    for (let i = 0; i < users.length; i++) {
      if (i % 2 === 0) result.push(<div className="w-100 d-none d-sm-block d-md-none" key={key++}></div>);
      if (i % 3 === 0) result.push(<div className="w-100 d-none d-md-block d-lg-none" key={key++}></div>);
      if (i % 4 === 0) result.push(<div className="w-100 d-none d-lg-block d-xl-none" key={key++}></div>);
      if (i % 5 === 0) result.push(<div className="w-100 d-none d-xl-block" key={key++}></div>);
      result.push(<UserCard key={key++} user={users[i]} />);
    }
    return result;
  }

  private handleScroll() {
    const LOADING_HEIGHT_RATE = 0.9;
    if (
      Math.ceil(window.innerHeight + document.documentElement.scrollTop) <
        document.documentElement.offsetHeight * LOADING_HEIGHT_RATE ||
      this.state.isLoading //ロード中はapiを呼ばない
    )
      return;
    this.getUsers(this.state.users.length);
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
        </Jumbotron>
        <Container fluid className="px-4 no-gutters">
          <CardDeck>{this.getCardsWithSeparator(this.state.users)}</CardDeck>
        </Container>
      </React.Fragment>
    );
  }
}
