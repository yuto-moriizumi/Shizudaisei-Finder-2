import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import {
  Button,
  Card,
  CardDeck,
  Col,
  Container,
  Form,
  FormControl,
  Modal,
  Row,
} from "react-bootstrap";
import { faPlusSquare, faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import Rate from "rc-rate";
import axios from "axios";
import { Auth0ContextInterface, withAuth0 } from "@auth0/auth0-react";
import dayjs from "dayjs";

type Subscription = {
  name: string;
  url: string;
  title: string;
  img: string;
  updated: string;
  rating: number;
  has_new: boolean;
};
type State = {
  subscriptions: Subscription[];
  showModal: boolean;
  newCardUrl: string;
  newCardRate: number;
};
type Props = {
  auth0: Auth0ContextInterface;
};

const SERVER_URL = process.env.REACT_APP_SERVER_URL;
const AUDIENCE = process.env.REACT_APP_AUTH0_AUDIENCE;
if (!(SERVER_URL && AUDIENCE)) new Error("env invalid");

class MyPage extends React.Component<Props, State> {
  state = {
    subscriptions: new Array<Subscription>(),
    showModal: false,
    newCardUrl: "",
    newCardRate: 0,
  };

  componentWillMount() {
    this.getSubscriptions();
  }

  private async getSubscriptions() {
    const token = await this.props.auth0.getAccessTokenSilently({
      audience: AUDIENCE,
    });
    axios
      .get(`${SERVER_URL}/api/subscriptions`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      .then((res) => this.setState({ subscriptions: res.data }))
      .catch((err) => console.log(err));
  }

  private onClickAdd() {
    this.setState({ showModal: true });
  }

  private isValidUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  private async addSubscription() {
    if (!this.isValidUrl(this.state.newCardUrl)) return;
    const token = await this.props.auth0.getAccessTokenSilently({
      audience: AUDIENCE,
    });
    this.handleClose();
    axios
      .post(
        `${SERVER_URL}/api/subscriptions`,
        {
          url: this.state.newCardUrl,
          star: this.state.newCardRate,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        this.getSubscriptions();
      })
      .catch((err) => console.log(err));
  }
  private handleClose() {
    this.setState({ showModal: false });
  }

  //既読未読を切り替える
  private async switchRead(index: number, has_new: boolean) {
    const token = await this.props.auth0.getAccessTokenSilently({
      audience: AUDIENCE,
    });
    axios
      .post(
        `${SERVER_URL}/api/subscriptions/new/`,
        {
          url: this.state.subscriptions[index].url,
          has_new: has_new,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        const subscriptions = this.state.subscriptions.slice();
        subscriptions[index].has_new = has_new;
        this.setState({
          subscriptions: subscriptions,
        });
      })
      .catch((err) => console.log(err));
  }

  //新着ありがクリックされたときは、既読に変更する
  private onClickNew(index: number) {
    this.switchRead(index, false);
  }

  //既読がクリックされたときは、新着に変更する
  private onClickRead(index: number) {
    this.switchRead(index, true);
  }

  //購読を削除する
  private async onClickDelete(index: number) {
    if (!window.confirm("本当に削除しますか?")) return;
    const token = await this.props.auth0.getAccessTokenSilently({
      audience: AUDIENCE,
    });
    axios
      .post(
        `${SERVER_URL}/api/subscriptions/delete`,
        {
          url: this.state.subscriptions[index].url,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() =>
        this.setState({
          subscriptions: this.state.subscriptions.filter(
            (subscription) =>
              subscription.url !== this.state.subscriptions[index].url
          ),
        })
      )
      .catch((err) => console.log(err));
  }

  private onNewCardUrlChange(
    e: React.ChangeEvent<typeof FormControl & HTMLInputElement>
  ) {
    this.setState({ newCardUrl: e.target.value });
  }
  private onNewCardRateChange(rate: number) {
    this.setState({ newCardRate: rate });
  }

  private async onRateChange(index: number, rate: number) {
    const token = await this.props.auth0.getAccessTokenSilently({
      audience: AUDIENCE,
    });
    axios
      .post(
        `${SERVER_URL}/api/subscriptions/rank/`,
        {
          url: this.state.subscriptions[index].url,
          rank: rate,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        // console.log(this.state.subscriptions[index].title, rate);
      })
      .catch((err) => console.log(err));
  }

  render() {
    return (
      <React.Fragment>
        <Container className="my-4">
          <Row>
            <Col xs={"auto"}>
              <h1>マイページ</h1>
            </Col>
            <Col xs={"auto"} className="ml-auto">
              <Button size="lg" onClick={this.onClickAdd.bind(this)}>
                <Row noGutters>
                  <Col xs={"auto"} className="mr-2">
                    <FontAwesomeIcon icon={faPlusSquare} />
                  </Col>
                  <Col xs={"auto"}>ウォッチャカードを追加</Col>
                </Row>
              </Button>
            </Col>
          </Row>
        </Container>
        {/* 購読追加モーダル */}
        <Modal show={this.state.showModal} onHide={this.handleClose.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>ウォッチャカードを追加</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group as={Row}>
                <Form.Label column xs={2}>
                  URL
                </Form.Label>
                <Col xs={10}>
                  <Form.Control
                    placeholder="https://www.google.com/"
                    type="url"
                    value={this.state.newCardUrl}
                    onChange={this.onNewCardUrlChange.bind(this)}
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row}>
                <Form.Label column xs={2}>
                  評価
                </Form.Label>
                <Col xs={10}>
                  <Rate onChange={this.onNewCardRateChange.bind(this)} />
                </Col>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={this.addSubscription.bind(this)}>
              追加
            </Button>
          </Modal.Footer>
        </Modal>
        <Container fluid>
          <CardDeck className="no-gutters">
            {this.state.subscriptions.map((subscription, index) => (
              <Col key={index} xs={12} sm={6} md={4} lg={3} xl={2}>
                <Card>
                  <Card.Link href={subscription.url} target="_blank">
                    <Card.Img
                      variant="top"
                      src={subscription.img}
                      referrerPolicy="no-referrer"
                    />
                    <Card.Title className="pt-2 px-3 mb-0">
                      {subscription.title}
                    </Card.Title>
                  </Card.Link>
                  <Card.Body className="pt-2 pb-3">
                    <Card.Subtitle className="pb-1">
                      {subscription.name}
                    </Card.Subtitle>
                    <Rate
                      defaultValue={subscription.rating}
                      onChange={(rate) => {
                        this.onRateChange(index, rate);
                      }}
                    />
                    <Row className="no-gutters">
                      <Col xs={"auto"}>
                        {dayjs(subscription.updated).format("YYYY/MM/DD")}
                      </Col>
                      <Col xs={"auto"} className="ml-auto mr-1">
                        {subscription.has_new ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={this.onClickNew.bind(this, index)}
                          >
                            NEW
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={this.onClickRead.bind(this, index)}
                          >
                            READ
                          </Button>
                        )}
                      </Col>
                      <Col xs={"auto"}>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={this.onClickDelete.bind(this, index)}
                        >
                          <FontAwesomeIcon icon={faTrashAlt} color="red" />
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </CardDeck>
        </Container>
      </React.Fragment>
    );
  }
}

export default withAuth0(MyPage);
