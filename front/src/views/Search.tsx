import React from "react";
import { Auth0ContextInterface, withAuth0 } from "@auth0/auth0-react";
import { Button, Container, Form, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import User from "../utils/User";
import UserCard from "../components/UserCard";
import axios from "axios";

type Prop = {
  auth0: Auth0ContextInterface;
};
type State = {
  users: User[];
  from: string;
  to: string;
  incl_flw: boolean;
  excl_kws: string[];
};

const SERVER_URL = process.env.REACT_APP_SERVER_URL;
// const AUDIENCE = process.env.REACT_APP_AUTH0_AUDIENCE;
// if (!(SERVER_URL && AUDIENCE)) new Error("env invalid");

class Search extends React.Component<Prop, State> {
  private excl_kws = ["人文社会科学部", "教育学部", "理学部", "農学部", "情報学部", "工学部"];
  state = {
    users: new Array<User>(),
    from: "2020-01-01",
    to: "2030-01-01",
    incl_flw: false,
    excl_kws: new Array<string>(),
  };

  private async search() {
    const token = await this.props.auth0.getAccessTokenSilently();
    axios
      .get(`${SERVER_URL}/users/search`, {
        params: {
          from: this.state.from,
          to: this.state.to,
          incl_flw: this.state.incl_flw,
          excl_kws: this.state.excl_kws,
        },
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      .then((res) => this.setState({ users: res.data }))
      .catch((err) => console.log(err));
  }

  //ユーザをフォローする
  private async follow(user: User) {
    this.setState({
      users: this.state.users.map((user2) => {
        if (user2 !== user) return user2;
        user2.is_requesting = true;
        return user2;
      }),
    });
    const token = await this.props.auth0.getAccessTokenSilently();
    axios
      .post(
        `${SERVER_URL}/users/follow`,
        { user_id: user.id },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        console.log("req suc");
        this.setState({
          users: this.state.users.map((user2) => {
            if (user2 !== user) return user2;
            user2.is_following = true;
            return user2;
          }),
        });
      })
      .catch((e) => {
        console.log("req err");
        console.log(e);
      })
      .finally(() => {
        console.log("req final");
        this.setState({
          users: this.state.users.map((user2) => {
            if (user2 !== user) return user2;
            user2.is_requesting = false;
            return user2;
          }),
        });
        console.log(user);
      });
  }

  render() {
    return (
      <>
        <Container className="my-3">
          <h1>検索条件</h1>
          <Form className="my-3">
            <Form.Row className="mb-2">
              <Col>
                <Form.Control
                  type="date"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    this.setState({ from: e.target.value })
                  }
                />
              </Col>
              <Form.Label className="mx-3">から</Form.Label>
              <Col>
                <Form.Control
                  type="date"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.setState({ to: e.target.value })}
                />
              </Col>
              <Form.Label className="ml-3 mr-4">まで</Form.Label>
              <Form.Check
                id="incl_flw"
                inline
                type="checkbox"
                label="フォローしている人を含む"
                onChange={(_: React.ChangeEvent<HTMLInputElement>) =>
                  this.setState({ incl_flw: !this.state.incl_flw })
                }
              />
            </Form.Row>
            <Form.Row className="d-flex justify-content-between">
              <Form.Label>学部</Form.Label>
              {this.excl_kws.map((kw) => {
                return (
                  <Form.Check
                    key={kw}
                    id={"excl_flw" + kw}
                    inline
                    type="checkbox"
                    label={kw}
                    checked={!this.state.excl_kws.includes(kw)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (this.state.excl_kws.includes(kw))
                        this.setState({
                          excl_kws: this.state.excl_kws.filter((kwd) => kwd !== kw),
                        });
                      else {
                        const excl_kws = this.state.excl_kws.slice();
                        excl_kws.push(kw);
                        this.setState({
                          excl_kws: excl_kws,
                        });
                      }
                    }}
                  />
                );
              })}
            </Form.Row>
            <Form.Text>チェックを外すとその学部と思われるユーザを除外します（正確ではありません）</Form.Text>
            <Container className="mt-3 text-center">
              <Button className="col-8" onClick={this.search.bind(this)}>
                検索
              </Button>
            </Container>
          </Form>
          <Row>
            <h1 className="mr-auto">検索結果</h1>
            <Button
              size="lg"
              onClick={(_) => {
                // this.state.users.forEach((user) => this.follow(user));
              }}
            >
              一括フォロー
            </Button>
          </Row>
        </Container>
        <Container fluid className="px-4 no-gutters">
          <Row>
            {this.state.users.map((user: User, idx) => {
              return (
                <Col key={idx} xs={12} sm={6} md={4} lg={3} xl={2}>
                  <UserCard
                    user={user}
                    onFollow={() => {
                      this.follow(user);
                    }}
                  />
                </Col>
              );
            })}
          </Row>
        </Container>
      </>
    );
  }
}

export default withAuth0(Search);
