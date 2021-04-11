import React from 'react';
import { Card, Col, Row, Image, Button, Container } from 'react-bootstrap';
import dayjs from 'dayjs';
import LazyLoad from 'react-lazyload';
import User from '../../utils/User.d';
import ButtonState from './ButtonState';
import FollowingState from './FollowingState';
import FollowFailedState from './FollowFailedState';
import FollowedState from './FollowedState';
import BeforeFollowState from './BeforeFollowState';

type Props = {
  user: User;
  onFollow?: () => void;
};
export default class UserCard extends React.Component<Props, {}> {
  render() {
    const { user } = this.props;
    let { onFollow } = this.props;
    if (onFollow) onFollow = onFollow.bind(this);

    // フォロー試行状態を判別する
    let buttonState: ButtonState;
    if (user.is_requesting) buttonState = new FollowingState();
    else if (user.follow_failed) buttonState = new FollowFailedState();
    else if (user.is_following) buttonState = new FollowedState();
    else buttonState = new BeforeFollowState();

    return (
      <Card key={user.id} className="mb-4">
        <Card.Header className="p-2">
          <Container fluid>
            <Row>
              <Col className="px-0" xs="2">
                <LazyLoad height={48}>
                  <Image
                    fluid
                    src={user.img_url}
                    alt={`${user.screen_name}のサムネイル`}
                    style={{ maxHeight: '48px' }}
                    width="48px"
                    height="48px"
                  />
                </LazyLoad>
              </Col>
              <Col className="pl-1 pr-0" xs="10">
                <Card.Link
                  href={`https://twitter.com/${user.screen_name}`}
                  target="_blank"
                >
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
              {dayjs(user.created_at).format('YYYY-MM-DD')}
            </Col>
            {onFollow ? (
              <Col xs="auto" className="px-0 ml-auto">
                <Button
                  size="sm"
                  variant={buttonState.variant}
                  disabled={buttonState.disabled}
                  onClick={buttonState.disabled ? undefined : onFollow}
                >
                  {buttonState.display}
                </Button>
              </Col>
            ) : (
              ''
            )}
          </Row>
        </Card.Footer>
      </Card>
    );
  }
}
