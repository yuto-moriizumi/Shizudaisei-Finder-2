//引数のエレメント配列にdivタグを挿入し、レスポンシブ化します
export default function getResponsiveElements(elements: JSX.Element[]) {
  const result = new Array<JSX.Element>();
  let key = 0;
  for (let i = 0; i < elements.length; i++) {
    if (i % 2 === 0)
      result.push(
        <div
          className="w-100 d-none d-sm-block d-md-none"
          key={`separator-${key++}`}
        ></div>
      );
    if (i % 3 === 0)
      result.push(
        <div
          className="w-100 d-none d-md-block d-lg-none"
          key={`separator-${key++}`}
        ></div>
      );
    if (i % 4 === 0)
      result.push(
        <div
          className="w-100 d-none d-lg-block d-xl-none"
          key={`separator-${key++}`}
        ></div>
      );
    if (i % 5 === 0)
      result.push(
        <div
          className="w-100 d-none d-xl-block"
          key={`separator-${key++}`}
        ></div>
      );
    result.push(elements[i]);
  }
  return result;
}
