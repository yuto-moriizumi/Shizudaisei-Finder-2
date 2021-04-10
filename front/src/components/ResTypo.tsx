import React from 'react';

type Heading =
  | 'display-1'
  | 'display-2'
  | 'display-3'
  | 'display-4'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6';
type Props = {
  classes: [Heading, Heading, Heading, Heading, Heading];
  as?: 'p' | 'h1' | 'span';
  children?: JSX.Element | string;
};
export default class ResTypo extends React.Component<Props> {
  render() {
    const { as, classes, children } = this.props;
    if (as === undefined || as === 'p') {
      return (
        <>
          <p className={`${classes[4]} d-none d-xl-block`}>{children}</p>
          <p className={`${classes[3]} d-none d-lg-block d-xl-none`}>
            {children}
          </p>
          <p className={`${classes[2]} d-none d-md-block d-lg-none`}>
            {children}
          </p>
          <p className={`${classes[1]} d-none d-sm-block d-md-none`}>
            {children}
          </p>
          <p className={`${classes[0]} d-xs-block d-sm-none`}>{children}</p>
        </>
      );
    }
    if (as === 'h1')
      return (
        <>
          <h1 className={`${classes[4]} d-none d-xl-block`}>{children}</h1>
          <h1 className={`${classes[3]} d-none d-lg-block d-xl-none`}>
            {children}
          </h1>
          <h1 className={`${classes[2]} d-none d-md-block d-lg-none`}>
            {children}
          </h1>
          <h1 className={`${classes[1]} d-none d-sm-block d-md-none`}>
            {children}
          </h1>
          <h1 className={`${classes[0]} d-xs-block d-sm-none`}>{children}</h1>
        </>
      );
    return (
      <>
        <span className={`${classes[4]} d-none d-xl-block`}>{children}</span>
        <span className={`${classes[3]} d-none d-lg-block d-xl-none`}>
          {children}
        </span>
        <span className={`${classes[2]} d-none d-md-block d-lg-none`}>
          {children}
        </span>
        <span className={`${classes[1]} d-none d-sm-block d-md-none`}>
          {children}
        </span>
        <span className={`${classes[0]} d-xs-block d-sm-none`}>{children}</span>
      </>
    );
  }
}
