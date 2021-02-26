import React from "react";
import { Auth0ContextInterface, withAuth0 } from "@auth0/auth0-react";
import { Alert, Button, CardDeck, Container, Form, Row, Spinner } from "react-bootstrap";
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
  is_searching: boolean;
  search_failed: boolean;
  is_search_empty: boolean;
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
    is_searching: false,
    search_failed: false,
    is_search_empty: false,
  };

  private async search() {
    this.setState({ is_searching: true });
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
      .then((res) => this.setState({ users: res.data, is_search_empty: res.data.length === 0 }))
      .catch((err) => {
        this.setState({ search_failed: true });
        console.log(err);
      })
      .finally(() => this.setState({ is_searching: false }));
  }

  //ユーザをフォローする
  private async follow(user: User) {
    if (user.is_requesting) return; //すでに対象ユーザにフォローリクエストを送信している場合は何もしない
    this.setState({
      users: this.state.users.map((user2) => {
        if (user2 === user) user2.is_requesting = true;
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
      .then(() =>
        this.setState({
          users: this.state.users.map((user2) => {
            if (user2 === user) user2.is_following = true;
            return user2;
          }),
        })
      )
      .catch((e) => {
        this.setState({
          users: this.state.users.map((user2) => {
            if (user2 === user) user2.follow_failed = true;
            return user2;
          }),
        });
        console.log(e);
      })
      .finally(() =>
        this.setState({
          users: this.state.users.map((user2) => {
            if (user2 === user) user2.is_requesting = false;
            return user2;
          }),
        })
      );
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
      result.push(
        <UserCard
          key={key++}
          user={users[i]}
          onFollow={() => {
            this.follow(users[i]);
          }}
        />
      );
    }
    return result;
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
              {this.state.is_searching ? (
                <Button className="col-8" disabled>
                  <Spinner as="span" animation="border" role="status" aria-hidden="true" />
                </Button>
              ) : (
                <Button className="col-8" onClick={this.search.bind(this)}>
                  検索
                </Button>
              )}
            </Container>
          </Form>
          <Row className="mb-2">
            <h1 className="mr-auto">検索結果</h1>
            <Button
              size="lg"
              onClick={(_) => {
                this.state.users.forEach((user) => this.follow(user));
              }}
            >
              一括フォロー
            </Button>
          </Row>
          <Alert
            variant="danger"
            dismissible
            onClose={() => this.setState({ search_failed: false })}
            show={this.state.search_failed}
          >
            サーバエラー。少し時間を空ければ治るかもしれません。
          </Alert>
          <Alert
            variant="info"
            dismissible
            onClose={() => this.setState({ is_search_empty: false })}
            show={this.state.is_search_empty}
          >
            検索結果は0件でした
          </Alert>
        </Container>
        <Container fluid className="px-4 no-gutters">
          <CardDeck>{this.getCardsWithSeparator(this.state.users)}</CardDeck>
        </Container>
      </>
    );
  }
}

export default withAuth0(Search);
