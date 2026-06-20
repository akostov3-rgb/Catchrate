// Wraps each screen in a fade + slight translateY transition.
export default function Phase({ keyName, children }) {
  return (
    <div className="phase" key={keyName}>
      {children}
    </div>
  );
}
