import React from "react";
import {
  Button,
  Card,
  CardDeck,
  Col,
  Container,
  Jumbotron,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

type Page = {
  name: string;
  url: string;
  title: string;
  img: string;
  updated: string;
};
interface State {
  pages: Page[];
}

const SERVER_URL = process.env.REACT_APP_SERVER_URL;
if (!SERVER_URL) new Error("SERVER_URL must be specified");

export default class Index extends React.Component<{}, State> {
  state = { pages: new Array<Page>() };

  componentWillMount() {
    axios
      .get(`${SERVER_URL}/api/pages`)
      .then((res) => {
        this.setState({ pages: res.data });
      })
      .catch((err) => console.log(err));
  }

  render() {
    return (
      <React.Fragment>
        <Jumbotron>
          <Container>
            <h1>お気に入りの更新監視を簡単に。</h1>
            <p>
              特定のサイトのお気に入りページを一つ一つ確認するのは大変。
              <br />
              面倒なことは、アプリにやらせよう！
            </p>
            <Link to="mypage">
              <Button>GO MYPAGE</Button>
            </Link>
          </Container>
        </Jumbotron>
        <Container fluid className="px-5">
          <h2 className="h1 mb-3">更新情報</h2>
          <CardDeck className="no-gutters">
            {this.state.pages.map((page: Page) => (
              <Col key={page.url} xs={12} sm={6} md={4} lg={3} xl={2}>
                <Card>
                  <Card.Link href={page.url} target="_blank" rel="noreferrer">
                    <Card.Img
                      variant="top"
                      src={page.img}
                      referrerPolicy="no-referrer"
                    />
                    <Card.Body className="px-3 py-2">
                      <Card.Title className="mb-1">{page.title}</Card.Title>
                    </Card.Body>
                  </Card.Link>
                  <Card.Subtitle className="px-3 pb-2">
                    {page.name}
                  </Card.Subtitle>
                  <Card.Footer>
                    {dayjs(page.updated).format("YYYY/MM/DD")}
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </CardDeck>
        </Container>
      </React.Fragment>
    );
  }
}
