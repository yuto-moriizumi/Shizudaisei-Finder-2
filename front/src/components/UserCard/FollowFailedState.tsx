import React from 'react';
import ButtonState from "./ButtonState";

export default class FollowFailedState implements ButtonState {
    display = (<>フォロー失敗</>);

    variant = 'danger';

    disabled = true;
  }
