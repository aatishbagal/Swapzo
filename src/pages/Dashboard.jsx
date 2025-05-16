import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import PerformanceList from "../components/PerformanceList";
import LiveResultsTable from "../components/LiveResultsTable";

const Dashboard = () => {
  const performances = [
    { name: "Stake Casino", game: "DICE", earning: "2,735.82", percentage: "90.42" },
    { name: "Gamomat", game: "PLINKO", earning: "2,488.98", percentage: "80.24" },
    { name: "Avatar UX", game: "MINES", earning: "2,128.08", percentage: "76.14" },
    { name: "Push Gaming", game: "LIMBO", earning: "1,905.57", percentage: "69.02" },
  ];

  const results = [
    { casino: "Stake Casino", game: "Plinko", bet: "657.5 €", multiplier: "8.62 x", payout: "1.59 k" },
    { casino: "Pragmatic Play", game: "Dice", bet: "400 €", multiplier: "10.96 x", payout: "1.65 k" },
  ];

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="stat-section">
          <StatCard title="Most Winnings" value="620.58k" subtitle="Win Last Hour" percentage={98} />
          <ChartCard title="Tracked Casino" value="3" />
          <ChartCard title="Winnings 24h" value="26.9b" />
          <ChartCard title="Total Players" value="4890" />
        </div>
        <PerformanceList data={performances} />
        <h2 className="section-title">Live Results</h2>
        <LiveResultsTable results={results} />
      </main>
    </div>
  );
};

export default Dashboard;