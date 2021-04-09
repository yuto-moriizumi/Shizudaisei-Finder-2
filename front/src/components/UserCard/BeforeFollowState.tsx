import React from 'react';
import ButtonState from './ButtonState';

export default class BeforeFollowState implements ButtonState {
  display = <>フォロー</>;

  variant = 'primary';

  disabled = false;
}
