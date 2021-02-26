import React from "react";
import { Button, Col, Container, Jumbotron, Row } from "react-bootstrap";
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
          <Row>
            {this.state.users.map((user: User) => (
              <Col key={user.id} xs={12} sm={6} md={4} lg={3} xl={2}>
                <UserCard user={user} />
              </Col>
            ))}
          </Row>
        </Container>
      </React.Fragment>
    );
  }
}
