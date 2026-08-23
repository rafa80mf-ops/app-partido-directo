export default function FootballBall({ className = '', ...props }) {
  return (
    <img className={`football-ball ${className}`.trim()} src="/football-ball.svg" alt="" aria-hidden="true" {...props} />
  );
}
