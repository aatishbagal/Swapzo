const StatCard = ({ title, value, subtitle, percentage }) => {
  return (
    <div className="stat-card">
      <div>{title}</div>
      <div className="value">{value}</div>
      <div>{subtitle}</div>
      <div className="progress-bar">
        <div className="progress" style={{ width: `${percentage}%` }}></div>
      </div>
      <p>{percentage}% RTP</p>
    </div>
  );
};

export default StatCard;