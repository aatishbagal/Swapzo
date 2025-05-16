const LiveResultsTable = ({ results }) => {
  return (
    <table className="live-results">
      <thead>
        <tr>
          <th>Casino</th>
          <th>Game</th>
          <th>Bet Amount</th>
          <th>Multiplier</th>
          <th>Payout</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {results.map((row, index) => (
          <tr key={index}>
            <td>{row.casino}</td>
            <td>{row.game}</td>
            <td>{row.bet}</td>
            <td>{row.multiplier}</td>
            <td>{row.payout}</td>
            <td><button>Play</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default LiveResultsTable;