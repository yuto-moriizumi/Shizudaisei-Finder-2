import React from "react";
import { Button, CardColumns, CardDeck, Col, Container, Jumbotron, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import User from "../utils/User";
import UserCard from "../components/UserCard";

interface State {
  users: User[];
}

const SERVER_URL = process.env.REACT_APP_SERVER_URL;
if (!SERVER_URL) new Error("SERVER_URL must be specified");

export default class Index extends React.Component<{}, State> {
  state = { users: new Array<User>() };

  componentWillMount() {
    axios
      .get(`${SERVER_URL}/users`)
      .then((res) => {
        this.setState({ users: res.data });
      })
      .catch((err) => console.log(err));
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
