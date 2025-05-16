const ChartCard = ({ title, value }) => {
  return (
    <div className="chart-card">
      <div>{title}</div>
      <div>{value}</div>
    </div>
  );
};

export default ChartCard;