import React from "react";
import { Card, Col, Row, Image, Button, Spinner, Container } from "react-bootstrap";
import User from "../utils/User";
import dayjs from "dayjs";

type Props = {
  user: User;
  onFollow?: () => void;
};
export default class UserCard extends React.Component<Props, {}> {
  render() {
    const user = this.props.user;
    return (
      <Card key={user.id} className="mb-4">
        <Card.Header className="p-2">
          <Container fluid>
            <Row>
              <Col className="px-0" xs="2">
                <Image fluid src={user.img_url} style={{ maxHeight: "48px" }} />
              </Col>
              <Col className="pl-1 pr-0" xs="10">
                <Card.Link href={"https://twitter.com/" + user.screen_name} target="_blank">
                  <h6 className="mb-0">{user.name}</h6>
                  <small>@{user.screen_name}</small>
                </Card.Link>
              </Col>
            </Row>
          </Container>
        </Card.Header>
        <Card.Body className="p-3">{user.content}</Card.Body>
        <Card.Footer>
          <Row className="px-2">
            <Col xs="auto" className="px-0">
              {dayjs(user.created_at).format("YYYY-MM-DD")}
            </Col>
            {this.props.onFollow ? (
              <Col xs="auto" className="px-0 ml-auto">
                {user.is_requesting ? ( //フォローリクエスト送信中であれば
                  <Button size="sm" disabled>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  </Button>
                ) : user.follow_failed ? ( //フォローリクエストが失敗した場合は
                  <Button size="sm" variant="danger" disabled>
                    フォロー失敗
                  </Button>
                ) : user.is_following ? (
                  <Button size="sm" disabled>
                    フォロー済
                  </Button>
                ) : (
                  <Button size="sm" onClick={this.props.onFollow.bind(this)}>
                    フォロー
                  </Button>
                )}
              </Col>
            ) : (
              ""
            )}
          </Row>
        </Card.Footer>
      </Card>
    );
  }
}
