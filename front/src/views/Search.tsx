import React, { lazy, Suspense } from 'react';
import { Auth0ContextInterface, withAuth0 } from '@auth0/auth0-react';
import {
  Alert,
  Button,
  CardDeck,
  Container,
  Form,
  Row,
  Spinner,
  Col,
} from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import dayjs from 'dayjs';
import User from '../utils/User.d';
import getResponsiveElements from '../utils/getResponsiveElements';

const UserCard = lazy(() => import('../components/UserCard/UserCard'));

const SERVER_URL = process.env.REACT_APP_SERVER_URL;
const DEFAULT_RANGE_MONTHS = 6;
const FOLLOWALL_INTERVAL_MS = 500;
const EXCL_KWS = [
  '学環',
  '人文',
  '教育',
  '理学部',
  '農学部',
  '情報学部',
  '工学部',
];
const EXCL_NAMES = ['サークル'];

type Prop = {
  auth0: Auth0ContextInterface;
};
type State = {
  users: User[];
  from: string;
  to: string;
  incl_flw: boolean;
  excl_kws: string[];
  excl_names: string[];
  is_searching: boolean;
  search_failed: boolean;
  is_search_empty: boolean;
  show_warning: boolean;
  reached_follow_limit: boolean;
};
class Search extends React.Component<Prop, State> {
  private searchBinded = this.search.bind(this);

  private followAllBinded = this.followAll.bind(this);

  constructor(props: any) {
    super(props);
    this.state = {
      users: [],
      from: dayjs()
        .subtract(DEFAULT_RANGE_MONTHS, 'month')
        .format('YYYY-MM-DD'), // デフォルトは半年前まで
      to: dayjs().format('YYYY-MM-DD'),
      incl_flw: false,
      excl_kws: [],
      excl_names: [],
      is_searching: false,
      search_failed: false,
      is_search_empty: false,
      show_warning: true,
      reached_follow_limit: false,
    };
  }

  private async search() {
    const { auth0 } = this.props;
    this.setState({ is_searching: true });
    const token = await auth0.getAccessTokenSilently();
    const { from, to, incl_flw, excl_kws, excl_names } = this.state;
    axios
      .get(`${SERVER_URL}/users/search`, {
        params: {
          from,
          to,
          incl_flw,
          excl_kws,
          excl_names,
        },
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      .then((res) =>
        this.setState({
          users: res.data,
          is_search_empty: res.data.length === 0,
        })
      )
      .catch((err) => {
        this.setState({ search_failed: true });
        console.log(err);
      })
      .finally(() => this.setState({ is_searching: false }));
  }

  // ユーザをフォローする
  private async follow(user: User) {
    if (user.is_requesting || user.is_following) return; // すでに対象ユーザにフォローリクエストを送信しているか、フォロー済み場合は何もしない
    const { users } = this.state;
    this.setState({
      users: users.map((user2) => {
        const user3 = user2;
        if (user2 === user) user3.is_requesting = true;
        return user3;
      }),
    });
    const { auth0 } = this.props;
    const token = await auth0.getAccessTokenSilently();
    try {
      await axios.post(
        `${SERVER_URL}/users/follow`,
        { user_id: user.id },
        { headers: { authorization: `Bearer ${token}` }, timeout: 4000 }
      );
      this.setState({
        users: users.map((user2) => {
          const user3 = user2;
          if (user2 === user) user3.is_following = true;
          return user3;
        }),
      });
    } catch (error) {
      if (error.response.status === 429)
        this.setState({ reached_follow_limit: true });
      this.setState({
        users: users.map((user2) => {
          const user3 = user2;
          if (user2 === user) user3.follow_failed = true;
          return user3;
        }),
      });
    }
    this.setState({
      users: users.map((user2) => {
        const user3 = user2;
        if (user2 === user) user3.is_requesting = false;
        return user2;
      }),
    });
  }

  private async followAll() {
    const { users } = this.state;
    // eslint-disable-next-line no-restricted-syntax
    for (const user of users) {
      this.follow(user);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) =>
        setTimeout(resolve, FOLLOWALL_INTERVAL_MS)
      );
    }
  }

  render() {
    const {
      from,
      to,
      incl_flw,
      excl_kws,
      excl_names,
      is_searching,
      show_warning,
      search_failed,
      is_search_empty,
      reached_follow_limit,
      users,
    } = this.state;
    return (
      <>
        <Helmet>
          <title>静大生発見機 2 ユーザ検索</title>
          <meta
            name="description"
            content="静大生のTwitterユーザを検索して、フォローすることができます。Twitterでログインして、友達をいっぱい作ろう！"
          />
        </Helmet>
        <Container className="my-3" fluid="md">
          <h1>検索条件</h1>
          <Form className="my-3">
            <Form.Row className="mb-2">
              <Col xs={10} sm="auto">
                <Form.Control
                  type="date"
                  value={from}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    this.setState({ from: e.target.value })
                  }
                />
              </Col>
              <Form.Label className="my-auto col-2 col-sm-auto">
                から
              </Form.Label>
              <Col xs={10} sm="auto">
                <Form.Control
                  type="date"
                  value={to}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    this.setState({ to: e.target.value })
                  }
                />
              </Col>
              <Form.Label className="my-auto col-2 col-sm-auto">
                まで
              </Form.Label>
              <Col className="my-auto" xs={12} sm="auto">
                <Form.Check
                  id="incl_flw"
                  inline
                  type="checkbox"
                  label="フォローしている人を含む"
                  // _: React.ChangeEvent<HTMLInputElement>
                  onChange={() => this.setState({ incl_flw: !incl_flw })}
                />
              </Col>
            </Form.Row>
            <Form.Row className="d-flex justify-content-between">
              <Form.Label className="my-auto col-2 col-sm-1">学部</Form.Label>
              <Form.Row className="col-10 col-sm-11">
                {EXCL_KWS.map((kw) => (
                  <Col xs="auto" key={kw}>
                    <Form.Check
                      id={`excl_kws${kw}`}
                      inline
                      type="checkbox"
                      label={kw}
                      checked={!excl_kws.includes(kw)}
                      // e: React.ChangeEvent<HTMLInputElement>
                      onChange={() => {
                        if (excl_kws.includes(kw))
                          this.setState({
                            excl_kws: excl_kws.filter((kwd) => kwd !== kw),
                          });
                        else {
                          const new_excl_kws = excl_kws.slice();
                          new_excl_kws.push(kw);
                          this.setState({
                            excl_kws: new_excl_kws,
                          });
                        }
                      }}
                    />
                  </Col>
                ))}
              </Form.Row>
            </Form.Row>
            <Form.Text>
              チェックを外すとその学部と思われるユーザを除外します（正確ではありません）
            </Form.Text>
            <Form.Row>
              <Form.Label className="mr-5 my-auto">名前</Form.Label>
              {EXCL_NAMES.map((kw) => (
                <Form.Check
                  key={kw}
                  id={`excl_name${kw}`}
                  inline
                  type="checkbox"
                  label={kw}
                  checked={!excl_names.includes(kw)}
                  // e: React.ChangeEvent<HTMLInputElement>
                  onChange={() => {
                    if (excl_names.includes(kw))
                      this.setState({
                        excl_names: excl_names.filter((kwd) => kwd !== kw),
                      });
                    else {
                      const new_excl_names = excl_names.slice();
                      new_excl_names.push(kw);
                      this.setState({
                        excl_names: new_excl_names,
                      });
                    }
                  }}
                />
              ))}
            </Form.Row>
            <Form.Text>
              チェックを外すとその名前が含まれるユーザを除外します
            </Form.Text>
            <Container className="mt-3 text-center">
              {is_searching ? (
                <Button className="col-8" disabled>
                  <Spinner
                    as="span"
                    animation="border"
                    role="status"
                    aria-hidden="true"
                  />
                </Button>
              ) : (
                <Button className="col-8" onClick={this.searchBinded}>
                  検索
                </Button>
              )}
            </Container>
          </Form>
          <Row className="mb-2 mx-1">
            <h1 className="mr-auto">検索結果</h1>
            <Button size="lg" onClick={this.followAllBinded}>
              一括フォロー
            </Button>
          </Row>
          <Alert
            variant="warning"
            dismissible
            onClose={() => this.setState({ show_warning: false })}
            show={show_warning}
          >
            短時間に大量フォローすると、アカウントがロックされる場合があります。
            <br />
            Twitterアカウントに復旧用のメールアドレスや電話番号を登録しておきましょう。
          </Alert>
          <Alert
            variant="danger"
            dismissible
            onClose={() => this.setState({ search_failed: false })}
            show={search_failed}
          >
            サーバエラー。少し時間を空ければ治るかもしれません。
          </Alert>
          <Alert
            variant="warning"
            dismissible
            onClose={() => this.setState({ reached_follow_limit: false })}
            show={reached_follow_limit}
          >
            フォロー制限に達しました。時間を開けてから再度フォローを行ってください。
          </Alert>
          <Alert
            variant="info"
            dismissible
            onClose={() => this.setState({ is_search_empty: false })}
            show={is_search_empty}
          >
            検索結果は0件でした
          </Alert>
        </Container>
        <Container fluid className="px-4 no-gutters">
          <CardDeck>
            <Suspense fallback={<h1>LOADING</h1>}>
              {getResponsiveElements(
                users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onFollow={() => this.follow(user)}
                  />
                ))
              )}
            </Suspense>
          </CardDeck>
        </Container>
      </>
    );
  }
}

export default withAuth0(Search);
