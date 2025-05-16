const Header = () => {
  return (
    <header className="header">
      <h1>Sup Bro,<br /><span>Welcome back</span></h1>
      <div className="header-right">
        <input type="text" placeholder="Search" />
        <div className="flag" />
        <span>€</span>
      </div>
    </header>
  );
};

export default Header;