const PerformanceList = ({ data }) => {
  return (
    <div className="performance-list">
      <h2>Best Performing</h2>
      <ul>
        {data.map((item, index) => (
          <li key={index}>
            <div>
              <div className="icon-square" />
              <div>
                <p>{item.name}</p>
                <p>{item.game}</p>
              </div>
            </div>
            <div>
              <p>{item.earning} €</p>
              <p>{item.percentage}%</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PerformanceList;